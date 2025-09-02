#pragma once
#include "../Board/Component.h"
#include "../Memory/Memory.h"
#include "Components/TimerB1.h"
#include "Components/TimerW.h"

class TimerW;
class Interrupts;
constexpr uint16_t CLOCK_STOP_1_ADDR = 0xFFFA;
constexpr uint16_t CLOCK_STOP_2_ADDR = 0xFFFB;

namespace TimerFlags
{
    enum ClockStop1 : uint8_t
    {
        STANDBY_SCI3 = 1 << 6,
        STANDBY_ADC = 1 << 5,
        STANDBY_TIMER_B1 = 1 << 2,
        STANDBY_RTC = 1 << 0
    };
    
    enum ClockStop2 : uint8_t
    {
        STANDBY_TIMER_W = 1 << 6,
    };
    
}

class Timer : public Component
{
public:
    Timer(Memory* ram, Interrupts* interrupts) : ram(ram), interrupts(interrupts),
        b1(new TimerB1(ram, interrupts)),
        w(new TimerW(ram, interrupts)),
        clockStop1(ram->CreateAccessor<uint8_t>(CLOCK_STOP_1_ADDR)),
        clockStop2(ram->CreateAccessor<uint8_t>(CLOCK_STOP_2_ADDR))
    {
        
    }

    void Tick() override;

    size_t clockCycles;

    TimerB1* b1;
    TimerW* w;

    MemoryAccessor<uint8_t> clockStop1;
    MemoryAccessor<uint8_t> clockStop2;

    static constexpr size_t TICKS = 32768;

private:
    Memory* ram;
    Interrupts* interrupts;
};
