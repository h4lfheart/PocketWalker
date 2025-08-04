#include <array>
#include <fstream>
#include <ios>
#include <print>

#define SDL_MAIN_HANDLED
#include <thread>

#include "../external/SDL/include/SDL.h"

#include "Emulator/PocketWalker.h"

const std::string romPath = "C:/walker.bin";
const std::string eepromPath = "C:/Users/Max/Desktop/eep.rom";

int main(int argc, char* argv[])
{
    SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO);

    size_t margin = 4;
    size_t baseWidth = Lcd::WIDTH + margin * 2;
    size_t baseHeight = Lcd::HEIGHT + margin * 2;

    SDL_Window* window = SDL_CreateWindow(
        "Pocket Walker",
        SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
        baseWidth * 8, baseHeight * 8, 0
    );
    
    SDL_Renderer *renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);

    SDL_Texture *texture = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_RGB24, SDL_TEXTUREACCESS_STREAMING, baseWidth, baseHeight);

    void *pixels;
    int pitch;
    if (SDL_LockTexture(texture, NULL, &pixels, &pitch) != 0) {
        printf("SDL_LockTexture error: %s\n", SDL_GetError());
        return 1;
    }


    auto pixel_ptr = static_cast<uint8_t*>(pixels);
    int width = baseWidth;
    int height = baseHeight;

    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            int dstIndex = (y * width + x) * 3;
            pixel_ptr[dstIndex] = 0xCC;
            pixel_ptr[dstIndex + 1] = 0xCC;
            pixel_ptr[dstIndex + 2] = 0xCC;
        }
    }

    SDL_UnlockTexture(texture);

    bool running = true;
    
    std::array<uint8_t, 0xFFFF> romBuffer = {};
    std::ifstream romFile(romPath, std::ios::binary);
    romFile.read(reinterpret_cast<char*>(romBuffer.data()), romBuffer.size());

    std::array<uint8_t, 0xFFFF> eepromBuffer = {};
    std::ifstream eepromFile(eepromPath, std::ios::binary);
    eepromFile.read(reinterpret_cast<char*>(eepromBuffer.data()), eepromBuffer.size());
    
    PocketWalker emulator(romBuffer.data(), eepromBuffer.data());

    emulator.board->lcd->onDraw = [&](uint8_t* data)
    {
        void *pixels;
        int pitch;
        if (SDL_LockTexture(texture, NULL, &pixels, &pitch) != 0) {
            printf("SDL_LockTexture error: %s\n", SDL_GetError());
            return 1;
        }

        auto pixel_ptr = static_cast<uint8_t*>(pixels);
        int width = 96;
        int height = 64;
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int srcIndex = (y * width + x) * 3;
                int dstX = margin + x;
                int dstY = margin + y;
                int dstIndex = (dstY * baseWidth + dstX) * 3;
                pixel_ptr[dstIndex] = data[srcIndex];
                pixel_ptr[dstIndex + 1] = data[srcIndex + 1];
                pixel_ptr[dstIndex + 2] = data[srcIndex + 2];
            }
        }

        SDL_UnlockTexture(texture);
    };
    
    std::thread emulatorThread([&]
    {
        try
        {
            constexpr int TARGET_FPS = 4;
            constexpr double FRAME_TIME_MS = 1000.0 / TARGET_FPS;
            constexpr int CYCLES_PER_FRAME = Cpu::TICKS / TARGET_FPS;
            auto nextFrameTime = std::chrono::high_resolution_clock::now();
            constexpr auto frameTimeDuration = std::chrono::duration_cast<std::chrono::nanoseconds>(
                std::chrono::duration<double, std::milli>(FRAME_TIME_MS)
            );
            
            while (running)
            {
                const int frameStartCycles = emulator.cycles;
                
                while (emulator.cycles - frameStartCycles < CYCLES_PER_FRAME) {
                    emulator.Step();
                }
                
                nextFrameTime += frameTimeDuration;
                const auto now = std::chrono::high_resolution_clock::now();
                const auto sleepTime = nextFrameTime - now;
                
                if (sleepTime > std::chrono::nanoseconds(0)) {
                    std::this_thread::sleep_for(sleepTime);
                }
            }
        }
        catch (const std::exception& e)
        {
            std::println("\033[31mERROR: {}\033[0m", e.what());
        }

        running = false;
    });
    
    SDL_Event e;
    while (running) {
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT)
                running = false;
            if (e.type == SDL_KEYDOWN)
            {
                switch(e.key.keysym.sym)
                {
                case SDLK_LEFT: {
                        emulator.board->ram->WriteByte(0xFFDE, 1 << 2);
                        break;
                }
                case SDLK_DOWN: {
                        //emulator.board->cpu->interrupts->flag1 |= InterruptFlags::FLAG_IRQ0;

                        emulator.board->ram->WriteByte(0xFFDE, 1 << 0);
                        break;
                }
                case SDLK_RIGHT: {
                        emulator.board->ram->WriteByte(0xFFDE, 1 << 4);
                        break;
                }
                }
            }
        }

        SDL_RenderClear(renderer);
        SDL_RenderCopy(renderer, texture, NULL, NULL);
        SDL_RenderPresent(renderer);
    }

    SDL_DestroyTexture(texture);
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();

    emulatorThread.join();

    return 0;
}
