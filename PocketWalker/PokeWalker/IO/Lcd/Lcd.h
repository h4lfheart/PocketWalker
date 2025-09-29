#pragma once
#include <array>

#include "../../../H8/IO/IOComponent.h"
#include "../../../H8/Memory/Memory.h"
#include "../../../Utilities/EventHandler.h"

class Memory;

class Lcd : public IOComponent
{
public:
    Lcd()
    {
        memory = new Memory(0x3200);
    }
    
    void Transmit(Ssu* ssu) override;
    void Tick() override;
    bool CanExecute(Ssu* ssu) override;

    enum LcdState : uint8_t
    {
        Waiting,
        Contrast,
        PageOffset
    };
    
    Memory* memory;
    
    LcdState state;

    EventHandler<uint8_t*> OnDraw;

    size_t column = 0;
    size_t offset = 0;
    size_t page = 0;
    uint8_t contrast = 20;
    uint8_t pageOffset;
    bool powerSaveMode;

    static constexpr uint8_t WIDTH = 96;
    static constexpr uint8_t HEIGHT = 64;
    static constexpr uint8_t COLUMN_SIZE = 2;
    
    static constexpr uint8_t TOTAL_COLUMNS = 0xFF;
    
    static constexpr std::array<uint32_t, 4> PALETTE = {0xCCCCCC, 0x999999, 0x666666, 0x333333};
    
    static constexpr size_t TICKS = 4;
};