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
        .required();
    
    arguments.add_argument("eeprom")
        .help("The path for your PokeWalker eeprom file.")
        .default_value("");

    arguments.add_argument("--server")
        .help("Runs the TCP connection as a server.")
        .flag();
    
    arguments.add_argument("--no-save")
        .help("Disables eeprom saving.")
        .flag();
    
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
    std::array<uint8_t, 0xFFFF> romBuffer = {};
    std::ifstream romFile(romPath, std::ios::binary);
    romFile.read(reinterpret_cast<char*>(romBuffer.data()), romBuffer.size());

    auto eepromPath = arguments.get<std::string>("eeprom");
    std::array<uint8_t, 0xFFFF> eepromBuffer = {};
    if (!eepromPath.empty() && std::filesystem::exists(eepromPath))
    {
        std::ifstream eepromFile(eepromPath, std::ios::binary);
        eepromFile.read(reinterpret_cast<char*>(eepromBuffer.data()), eepromBuffer.size());
        eepromFile.close();
    }
    
    SdlSystem sdl;
    if (!sdl.Initialize())
    {
        return 1;
    }
    
    PokeWalker pokeWalker(romBuffer.data(), eepromBuffer.data());

    pokeWalker.OnDraw([&sdl](uint8_t* buffer)
    {
        sdl.window->Render(buffer);
    });

    pokeWalker.OnAudio([&sdl](float frequency)
    {
        sdl.audio->Render(frequency);
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

        // TODO add proper handlers for these, no board access!!
        socket.setOnData([&](const std::vector<uint8_t>& data) {

            for (auto byte : data)
            {
                pokeWalker.ReceiveSci3(byte);
            }
        });

        pokeWalker.OnTransmitSci3([&](uint8_t byte)
        {
            socket.send({byte});
        });

        if (serverMode) {
            if (!socket.startServer(8081)) {
                std::println("[TCP] Failed to start server");
            }
        } else {
            socket.connect("127.0.0.1", 8081);
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

    if (!eepromPath.empty() && !noSaveMode)
    {
        std::ofstream eepromFileOut(eepromPath, std::ios::binary);
        eepromFileOut.write(reinterpret_cast<const char*>(pokeWalker.GetEepromBuffer()), eepromBuffer.size());
        eepromFileOut.close();
    }
    
    sdl.Stop();

    tcpThread.join();
    
    return 0;
}