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

#include "Emulator/PocketWalker.h"
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
    
    SdlSystem sdl;
    if (!sdl.Initialize())
    {
        return 1;
    }
    
    bool serverMode = arguments.is_used("--server");
    
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
    
    PocketWalker emulator(romBuffer.data(), eepromBuffer.data());
    if (emulator.IsPokewalkerRom())
    {
        // add watts
        emulator.board->cpu->OnAddress(0x9A4E, [](Cpu* cpu)
        {
            if (cpu->ram->ReadShort(0xF78E) == 0)
            {
                cpu->ram->WriteShort(0xF78E, 1000);
            }

            return Continue;
        });

        // cleanup input
        /*emulator.board->cpu->OnAddress(0x9C3E, [](Cpu* cpu)
        {
            if (cpu->ram->ReadByte(0xFFDE) != 0)
            {
                cpu->ram->WriteByte(0xFFDE, 0);
            }
            
            return Continue;
        });*/

        // factory tests
        emulator.board->cpu->OnAddress(0x336, [](Cpu* cpu)
        {
            cpu->registers->pc += 4;
            
            return SkipInstruction; 
        });

        // accelerometer sleep TODO proper interrupt?
        emulator.board->cpu->OnAddress(0x7700, [](Cpu* cpu)
        {
            cpu->registers->pc += 2;
            
            return SkipInstruction; 
        });

        // hacky ir fix
        emulator.board->cpu->OnAddress(0x8EE, [](Cpu* cpu)
        {
            cpu->registers->pc += 2;
            
            return SkipInstruction; 
        });
    }

    emulator.OnDraw([&sdl](uint8_t* buffer)
    {
        sdl.window->Render(buffer);
    });

    emulator.OnAudio([&sdl](float frequency)
    {
        sdl.audio->Render(frequency);
    });
    
    emulator.Start();
    
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
            emulator.board->sci3->Receive(data);
        });

        emulator.board->sci3->sendData = [&](uint8_t byte)
        {
            socket.send({byte});
        };

        if (serverMode) {
            if (!socket.startServer(8081)) {
                std::println("[TCP] Failed to start server");
            }
        } else {
            socket.connect("127.0.0.1", 8081);
        }

        while (emulator.isRunning) {
            if (!socket.isConnected()) {
                socket.reconnect();
            }
            
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    
        socket.close();
    });
    
    SDL_Event e;
    while (emulator.isRunning) {
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT)
                emulator.Stop();
            if (e.type == SDL_KEYDOWN)
            {
                // TODO proper input peripheral
                switch(e.key.keysym.sym)
                {
                case SDLK_LEFT: {
                        emulator.board->ram->WriteByte(0xFFDE, emulator.board->ram->ReadByte(0xFFDE) | (1 << 2));
                        break;
                }
                case SDLK_DOWN: {
                        if (!emulator.board->cpu->flags->interrupt)
                            emulator.board->cpu->interrupts->flag1 |= InterruptFlags::Flag1::FLAG_IRQ0;
                        
                        emulator.board->ram->WriteByte(0xFFDE, emulator.board->ram->ReadByte(0xFFDE) | (1 << 0));
                        break;
                }
                case SDLK_RIGHT: {
                        emulator.board->ram->WriteByte(0xFFDE, emulator.board->ram->ReadByte(0xFFDE) | (1 << 4));
                        break;
                }
                    // hacky custom route impl
                case SDLK_HOME:
                    {
                        emulator.board->ram->WriteByte(0xf7b1, 0x11);
                        emulator.board->ram->WriteByte(0xf7d0, 1);
                        emulator.board->ram->WriteByte(0xf7ce, 0);
                        emulator.board->ram->WriteByte(0xf7cf, 0);
                        emulator.board->ram->WriteByte(0xf797, emulator.board->ram->ReadByte(0xf797) | 1);
                    }
                }
            }

            if (e.type == SDL_KEYUP)
            {
                switch(e.key.keysym.sym)
                {
                case SDLK_LEFT: {
                        emulator.board->ram->WriteByte(0xFFDE, emulator.board->ram->ReadByte(0xFFDE) & ~(1 << 2));
                        break;
                }
                case SDLK_DOWN: {
                        emulator.board->ram->WriteByte(0xFFDE, emulator.board->ram->ReadByte(0xFFDE) & ~(1 << 0));
                        break;
                }
                case SDLK_RIGHT: {
                        emulator.board->ram->WriteByte(0xFFDE, emulator.board->ram->ReadByte(0xFFDE) & ~(1 << 4));
                        break;
                }
                }
            }
        }

        sdl.window->Render();
    }

    
    if (!eepromPath.empty())
    {
        std::ofstream eepromFileOut(eepromPath, std::ios::binary);
        eepromFileOut.write(reinterpret_cast<const char*>(emulator.board->eeprom->memory->buffer), eepromBuffer.size());
        eepromFileOut.close();
    }
    
    sdl.Stop();
    
    tcpThread.join();

    
    return 0;
}