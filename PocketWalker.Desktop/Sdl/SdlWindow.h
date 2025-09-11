#pragma once

#include <vector>
#include <mutex>
#include <atomic>
#include <cstring>
#include <array>
#include "../../external/SDL/include/SDL.h"

class SdlWindow {
private:
    static const size_t LCD_WIDTH = 96;
    static const size_t LCD_HEIGHT = 64;
    static const size_t MARGIN = 4;
    static const size_t BASE_WIDTH = LCD_WIDTH + MARGIN * 2;
    static const size_t BASE_HEIGHT = LCD_HEIGHT + MARGIN * 2;
    static const int SCALE_FACTOR = 8;
    
    static constexpr std::array<uint32_t, 4> PALETTE = {0xCCCCCC, 0x999999, 0x666666, 0x333333};
    
    SDL_Window* window;
    SDL_Renderer* renderer;
    SDL_Texture* texture;
    
    std::mutex lcdDataMutex;
    std::vector<uint8_t> lcdDataBuffer;
    std::atomic<bool> lcdDataUpdated{false};
    
    
public:
    SdlWindow();
    ~SdlWindow();
    
    bool Initialize();
    void InitializeRenderTexture();
    void Render(uint8_t* data);
    void Render();
    void Stop();
};