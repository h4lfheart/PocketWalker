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

    SDL_Window* window = SDL_CreateWindow(
        "Pocket Walker",
        SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
        96 * 8, 64 * 8, 0
    );
    
    SDL_Renderer *renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);

    // Create a streaming texture where you can directly write pixels
    SDL_Texture *texture = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_RGB24, SDL_TEXTUREACCESS_STREAMING, 96, 64);

    // Lock texture to get pixel buffer
    void *pixels;
    int pitch;
    if (SDL_LockTexture(texture, NULL, &pixels, &pitch) != 0) {
        printf("SDL_LockTexture error: %s\n", SDL_GetError());
        return 1;
    }

    // pixels is a pointer to the pixel data; pitch is the length of a row in bytes
    // Let's set pixels manually

    auto pixel_ptr = static_cast<uint8_t*>(pixels);
    int width = 96;
    int height = 64;

    // Clear all pixels to black
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

        // pixels is a pointer to the pixel data; pitch is the length of a row in bytes
        // Let's set pixels manually

        auto pixel_ptr = static_cast<uint8_t*>(pixels);
        int width = 96;
        int height = 64;

        // Clear all pixels to black
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int srcIndex = (y * width + x) * 3;
                int dstIndex = (y * width + x) * 3;
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
            while (running)
            {
                emulator.Step();
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
