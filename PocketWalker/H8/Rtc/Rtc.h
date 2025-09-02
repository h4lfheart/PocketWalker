#pragma once
#include "../Board/Component.h"
#include "../Memory/Memory.h"
#include "../Cpu/Components/Interrupts.h"

class Interrupts;

class Rtc : public Component
{
public:
    Rtc(Memory* ram, Interrupts* interrupts) : ram(ram), interrupts(interrupts),
        second(ram->CreateAccessor<uint8_t>(SECOND_ADDR)),
        minute(ram->CreateAccessor<uint8_t>(MINUTE_ADDR)),
        hour(ram->CreateAccessor<uint8_t>(HOUR_ADDR)),
        day(ram->CreateAccessor<uint8_t>(DAY_ADDR))
    {
        
    }

    void Tick() override;

    bool isInitialized;
    size_t quarterCount;
    std::tm lastTime;
    
    MemoryAccessor<uint8_t> second;
    MemoryAccessor<uint8_t> minute;
    MemoryAccessor<uint8_t> day;
    MemoryAccessor<uint8_t> hour;

    static constexpr size_t TICKS = 4;

private:
    Memory* ram;
    Interrupts* interrupts;
    
    static constexpr uint16_t SECOND_ADDR = 0xF068;
    static constexpr uint16_t MINUTE_ADDR = 0xF069;
    static constexpr uint16_t HOUR_ADDR = 0xF06A;
    static constexpr uint16_t DAY_ADDR = 0xF06B;
};
