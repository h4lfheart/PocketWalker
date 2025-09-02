#include "SdlWindow.h"
#include <print>

SdlWindow::SdlWindow() 
    : window(nullptr)
    , renderer(nullptr)
    , texture(nullptr)
    , lcdDataBuffer(LCD_WIDTH * LCD_HEIGHT * 3, 0xCC) // Initialize with gray
{
}

SdlWindow::~SdlWindow() {
    if (texture) {
        SDL_DestroyTexture(texture);
    }
    if (renderer) {
        SDL_DestroyRenderer(renderer);
    }
    if (window) {
        SDL_DestroyWindow(window);
    }
}

bool SdlWindow::Initialize() {
    window = SDL_CreateWindow(
        "Pocket Walker",
        SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
        BASE_WIDTH * SCALE_FACTOR, BASE_HEIGHT * SCALE_FACTOR, 0
    );
    
    if (!window) {
        std::println("Failed to create window: {}", SDL_GetError());
        return false;
    }
    
    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);
    if (!renderer) {
        std::println("Failed to create renderer: {}", SDL_GetError());
        return false;
    }
    
    texture = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_RGB24, SDL_TEXTUREACCESS_STREAMING, BASE_WIDTH, BASE_HEIGHT);
    if (!texture) {
        std::println("Failed to create texture: {}", SDL_GetError());
        return false;
    }
    
    InitializeRenderTexture();
    return true;
}

void SdlWindow::InitializeRenderTexture() {
    void* pixels;
    int pitch;
    if (SDL_LockTexture(texture, NULL, &pixels, &pitch) != 0) {
        std::println("SDL_LockTexture error: {}", SDL_GetError());
        return;
    }

    auto pixel_ptr = static_cast<uint8_t*>(pixels);
    int width = BASE_WIDTH;
    int height = BASE_HEIGHT;

    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            int dstIndex = (y * width + x) * 3;
            pixel_ptr[dstIndex] = 0xCC;
            pixel_ptr[dstIndex + 1] = 0xCC;
            pixel_ptr[dstIndex + 2] = 0xCC;
        }
    }

    SDL_UnlockTexture(texture);
}

void SdlWindow::Render(uint8_t* data) {
    std::lock_guard lock(lcdDataMutex);
    std::memcpy(lcdDataBuffer.data(), data, LCD_WIDTH * LCD_HEIGHT * 3);
    lcdDataUpdated.store(true);
}

void SdlWindow::Render() {
    if (lcdDataUpdated.load()) {
        std::lock_guard lock(lcdDataMutex);
        
        void *pixels;
        int pitch;
        if (SDL_LockTexture(texture, NULL, &pixels, &pitch) == 0) {
            auto pixel_ptr = static_cast<uint8_t*>(pixels);
            
            for (int y = 0; y < LCD_HEIGHT; y++) {
                for (int x = 0; x < LCD_WIDTH; x++) {
                    int srcIndex = (y * LCD_WIDTH + x) * 3;
                    int dstX = MARGIN + x;
                    int dstY = MARGIN + y;
                    int dstIndex = (dstY * BASE_WIDTH + dstX) * 3;
                    pixel_ptr[dstIndex] = lcdDataBuffer[srcIndex];
                    pixel_ptr[dstIndex + 1] = lcdDataBuffer[srcIndex + 1];
                    pixel_ptr[dstIndex + 2] = lcdDataBuffer[srcIndex + 2];
                }
            }
            
            SDL_UnlockTexture(texture);
            lcdDataUpdated.store(false);
        } else {
            std::println("SDL_LockTexture error: {}", SDL_GetError());
        }
    }

    SDL_RenderClear(renderer);
    SDL_RenderCopy(renderer, texture, NULL, NULL);
    SDL_RenderPresent(renderer);
}

void SdlWindow::Stop()
{
    if (texture) {
        SDL_DestroyTexture(texture);
        texture = nullptr;
    }
    if (renderer) {
        SDL_DestroyRenderer(renderer);
        renderer = nullptr;
    }
    if (window) {
        SDL_DestroyWindow(window);
        window = nullptr;
    }
}
