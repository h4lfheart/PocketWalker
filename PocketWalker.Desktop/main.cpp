#include <array>
#include <fstream>
#include <ios>
#include <print>
#include <atomic>
#include <chrono>
#include <filesystem>
#include <thread>

#define SDL_MAIN_HANDLED
#define NOMINMAX

#include "../external/SDL/include/SDL.h"
#include "../external/argparse/include/argparse/argparse.hpp"

#include "../PocketWalker/PokeWalker/PokeWalker.h"

#include "Sdl/SdlSystem.h"
#include "Tcp/TcpSocket.h"
#include "Sdl/SdlAudio.h"
#include "Sdl/SdlWindow.h"

int main(int argc, char* argv[])
{
    argparse::ArgumentParser arguments("Pocket Walker");

    arguments.add_argument("rom")
        .help("The path for your PokeWalker rom file.")
        .default_value("rom.bin");
    
    arguments.add_argument("eeprom")
        .help("The path for your PokeWalker eeprom file.")
        .default_value("eeprom.bin");

    arguments.add_argument("--server")
        .help("Runs the TCP connection as a server.")
        .flag();
    
    arguments.add_argument("--no-save")
        .help("Disables eeprom saving.")
        .flag();

    arguments.add_argument("--packet-timeout")
        .help("Packet timeout in milliseconds.")
        .default_value(5)
        .scan<'i', int>();

    arguments.add_argument("--ip")
        .help("IP address to connect to in client mode.")
        .default_value("127.0.0.1");
 
    arguments.add_argument("--port")
        .help("Port Number to connect either server or client mode")
        .default_value(8081)
        .scan<'i', int>();

    try {
        arguments.parse_args(argc, argv);
    }
    catch (const std::exception& err) {
        std::cerr << err.what() << std::endl;
        std::cerr << arguments;

        std::println("Press any key to exit...");
        std::cin.get();
        return 1;
    }
    
    bool serverMode = arguments.is_used("--server");
    bool noSaveMode = arguments.is_used("--no-save");
    
    std::string romPath = arguments.get<std::string>("rom");
    if (!std::filesystem::exists(romPath))
    {
        std::println("Failed to find a rom with the name \"{}\"", romPath);
        std::cin.get();
        return 1;
    }
    
    std::array<uint8_t, 0xFFFF> romBuffer = {};
    std::ifstream romFile(romPath, std::ios::binary);
    romFile.read(reinterpret_cast<char*>(romBuffer.data()), romBuffer.size());

    auto eepromPath = arguments.get<std::string>("eeprom");
    
    std::array<uint8_t, 0xFFFF> eepromBuffer = {};
    if (std::filesystem::exists(eepromPath))
    {
        std::ifstream eepromFile(eepromPath, std::ios::binary);
        eepromFile.read(reinterpret_cast<char*>(eepromBuffer.data()), eepromBuffer.size());
        eepromFile.close();
    }
    
    SdlSystem sdl;
    if (!sdl.Initialize())
    {
        std::println("Failed to initialize SDL");
        std::cin.get();
        return 1;
    }
    
    PokeWalker pokeWalker(romBuffer.data(), eepromBuffer.data());

    auto packetTimeout = arguments.get<int>("--packet-timeout");
    pokeWalker.SetSci3PacketTimeout(packetTimeout);

    pokeWalker.OnDraw([&](const LcdInformation lcd)
    {
        sdl.window->Render(lcd.data);
    });

    pokeWalker.OnAudio([&](const AudioInformation audio)
    {
        sdl.audio->Render(audio.frequency, audio.isFullVolume ? 1.0f : 0.25f);
    });

    pokeWalker.StartAsync();
    
    std::thread tcpThread([&]
    {
        bool connected = false;
        TcpSocket socket;

        socket.setOnConnect([&connected]() {
            connected = true;
            std::println("[TCP] Connected");
        });

        socket.setOnClose([&connected]() {
            connected = false;
            std::println("[TCP] Disconnected");
        });

        if (serverMode) {
            socket.setOnClientConnect([](const std::string& clientIP) {
                std::println("[TCP] Client connected from: {}", clientIP);
            });
        }

        socket.setOnData([&](const std::vector<uint8_t>& data) {

            for (auto byte : data)
            {
                pokeWalker.ReceiveSci3(byte);
            }
        });

        pokeWalker.OnTransmitSci3([&](const std::vector<uint8_t>& packet)
        {
            socket.send(packet);
        });

        auto portNumber = arguments.get<int>("--port");

        if (serverMode) {
            if (!socket.startServer(portNumber)) {
                std::println("[TCP] Failed to start server");
            }
        } else {
            auto ipAddress = arguments.get<std::string>("--ip");
            std::println("[TCP] Connecting to {}:{}", ipAddress, portNumber);
            socket.connect(ipAddress, portNumber);
        }

        while (pokeWalker.IsRunning()) {
            if (!socket.isConnected()) {
                socket.reconnect();
            }
            
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    
        socket.close();
    });
    
    SDL_Event e;
    while (pokeWalker.IsRunning()) {
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT)
                pokeWalker.Stop();
            
            if (e.type == SDL_KEYDOWN)
            {
                switch(e.key.keysym.sym)
                {
                case SDLK_DOWN: {
                        pokeWalker.PressButton(Buttons::Center);
                        break;
                }
                case SDLK_LEFT: {
                        pokeWalker.PressButton(Buttons::Left);
                        break;
                }
                case SDLK_RIGHT: {
                        pokeWalker.PressButton(Buttons::Right);
                        break;
                }
                case SDLK_F1: {
                        pokeWalker.Pause();
                        break;
                }
                case SDLK_F2: {
                        pokeWalker.Resume();
                        break;
                }
                }
            }
            
            if (e.type == SDL_KEYUP)
            {
                switch(e.key.keysym.sym)
                {
                case SDLK_DOWN: {
                        pokeWalker.ReleaseButton(Buttons::Center);
                        break;
                }
                case SDLK_LEFT: {
                        pokeWalker.ReleaseButton(Buttons::Left);
                        break;
                }
                case SDLK_RIGHT: {
                        pokeWalker.ReleaseButton(Buttons::Right);
                        break;
                }
                }
            }
        }
        
        sdl.window->Render();
    }

    if (!noSaveMode)
    {
        std::ofstream eepromFileOut(eepromPath, std::ios::binary);
        eepromFileOut.write(reinterpret_cast<const char*>(pokeWalker.GetEepromBuffer()), eepromBuffer.size());
        eepromFileOut.close();
    }
    
    sdl.Stop();

    tcpThread.join();
    
    return 0;
}