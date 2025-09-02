#pragma once

#include "Flags.h"
#include "../../Memory/Memory.h"

class Cpu;
class Memory;


constexpr uint16_t IENR1_ADDR = 0xFFF3;
constexpr uint16_t IENR2_ADDR = 0xFFF4;
constexpr uint16_t IRR1_ADDR = 0xFFF6;
constexpr uint16_t IRR2_ADDR = 0xFFF7;

constexpr uint16_t RTC_ADDR = 0xF067;

constexpr uint16_t TIMER_W_ENABLE_ADDR = 0xF0F2;
constexpr uint16_t TIMER_W_FLAG_ADDR = 0xF0F3;

namespace InterruptFlags
{
    enum Enable1 : uint8_t
    {
        ENABLE_RTC = 1 << 7,
        ENABLE_IRQ1 = 1 << 1,
        ENABLE_IRQ0 = 1 << 0
    };

    enum Enable2 : uint8_t
    {
        ENABLE_TIMER_B1 = 1 << 2,
    };

    enum Flag1 : uint8_t
    {
        FLAG_IRQ1 = 1 << 1,
        FLAG_IRQ0 = 1 << 0
    };
    
    enum Flag2 : uint8_t
    {
        FLAG_TIMER_B1 = 1 << 2
    };

    enum RtcFlag : uint8_t
    {
        FLAG_HOUR = 1 << 4,
        FLAG_MINUTE = 1 << 3,
        FLAG_SECOND = 1 << 2,
        FLAG_HALF_SECOND = 1 << 1,
        FLAG_QUARTER_SECOND = 1 << 0
    };

    enum EnableTimerW : uint8_t
    {
        ENABLE_TIMER_W_OVERFLOW = 1 << 7,
        ENABLE_TIMER_W_REGISTER_D = 1 << 3,
        ENABLE_TIMER_W_REGISTER_C = 1 << 2,
        ENABLE_TIMER_W_REGISTER_B = 1 << 1,
        ENABLE_TIMER_W_REGISTER_A = 1 << 0,
    };

    enum FlagTimerW : uint8_t
    {
        FLAG_TIMER_W_OVERFLOW = 1 << 7,
        FLAG_TIMER_W_REGISTER_D = 1 << 3,
        FLAG_TIMER_W_REGISTER_C = 1 << 2,
        FLAG_TIMER_W_REGISTER_B = 1 << 1,
        FLAG_TIMER_W_REGISTER_A = 1 << 0,
    };
}


class Interrupts
{
public:
    Interrupts(Memory* ram) : ram(ram),
        enable1(ram->CreateAccessor<uint8_t>(IENR1_ADDR)),
        enable2(ram->CreateAccessor<uint8_t>(IENR2_ADDR)),
        flag1(ram->CreateAccessor<uint8_t>(IRR1_ADDR)),
        flag2(ram->CreateAccessor<uint8_t>(IRR2_ADDR)),
        rtcFlag(ram->CreateAccessor<uint8_t>(RTC_ADDR)),
        enableTimerW(ram->CreateAccessor<uint8_t>(TIMER_W_ENABLE_ADDR)),
        flagTimerW(ram->CreateAccessor<uint8_t>(TIMER_W_FLAG_ADDR))
    {
        
    }

    void Update(Cpu* cpu);
    void Interrupt(Cpu* cpu, uint16_t address);

    uint8_t savedFlags;
    uint16_t savedAddress;
    
    MemoryAccessor<uint8_t> enable1;
    MemoryAccessor<uint8_t> enable2;
    MemoryAccessor<uint8_t> flag1;
    MemoryAccessor<uint8_t> flag2;
    
    MemoryAccessor<uint8_t> rtcFlag;
    MemoryAccessor<uint8_t> enableTimerW;
    MemoryAccessor<uint8_t> flagTimerW;

private:
    Memory* ram;
};
