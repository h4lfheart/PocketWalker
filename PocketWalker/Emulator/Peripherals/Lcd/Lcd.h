#pragma once
#include <array>

#include "../PeripheralComponent.h"
#include "../../Memory/Memory.h"

class Memory;

class Lcd : public PeripheralComponent
{
public:
    Lcd()
    {
        memory = new Memory(0x1600);
    }
    
    void Transmit(Ssu* ssu) override;
    void Tick() override;

    enum LcdState : uint8_t
    {
        Waiting,
        GettingContrast
    };
    
    Memory* memory;
    
    LcdState state;

    uint8_t column;
    uint8_t offset;
    uint8_t page;
    uint8_t bufferIndex;
    uint8_t contrast;

    static constexpr uint32_t TICKS = 4;
    
    static constexpr uint8_t PIN = 1 << 0;

    static constexpr uint8_t WIDTH = 96;
    static constexpr uint8_t HEIGHT = 64;
    static constexpr uint8_t COLUMN_SIZE = 2;
    static constexpr uint8_t BUFFER_SEPARATION = 16;
    
    static constexpr std::array<uint32_t, 4> PALETTE = {0xCCCCCC, 0x999999, 0x666666, 0x333333};
};