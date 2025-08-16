#pragma once
#include <array>

#include "../../Board/Component.h"
#include "../../Memory/Memory.h"
#include "../../Memory/MemoryAccessor.h"

class Interrupts;
class Memory;

namespace TimerB1Flags
{
    enum Mode : uint8_t
    {
        MODE_COUNTING = 1 << 6
    };
}

class TimerB1 : public Component
{
public:
    TimerB1(Memory* ram, Interrupts* interrupts) : ram(ram), interrupts(interrupts),
        mode(ram->CreateAccessor<uint8_t>(MODE_ADDR)),
        counter(ram->CreateAccessor<uint8_t>(COUNTER_ADDR))
    {
        ram->OnWrite(MODE_ADDR, [this](uint32_t mode)
        {
            clockRate = clockRates[mode & 0b111];
        });
    }

    void Tick() override;

    size_t clockRate = 256;
    bool isCounting;

    MemoryAccessor<uint8_t> mode;
    MemoryAccessor<uint8_t> counter;

private:
    Memory* ram;
    Interrupts* interrupts;
    
    static constexpr uint16_t MODE_ADDR = 0xF0D0;
    static constexpr uint16_t COUNTER_ADDR = 0xF0D1;

    static constexpr std::array clockRates = {
        8192,
        2048,
        256,
        64,
        16,
        4,
        1024,
        256
    };
};
