#pragma once
#include <array>
#include <cstdint>

#include "../../Board/Component.h"
#include "../../Memory/Memory.h"
#include "../../Memory/MemoryAccessor.h"

class Interrupts;
class Memory;

namespace TimerWFlags
{
    enum Mode : uint8_t
    {
        MODE_COUNTING = 1 << 7
    };

    enum Control : uint8_t
    {
        CONTROL_COUNTER_CLEAR = 1 << 7
    };
}

class TimerW : public Component
{
public:
    TimerW(Memory* ram, Interrupts* interrupts) : ram(ram), interrupts(interrupts),
        mode(ram->CreateAccessor<uint8_t>(MODE_ADDR)),
        control(ram->CreateAccessor<uint8_t>(CONTROL_ADDR)),
        counter(ram->CreateAccessor<uint16_t>(COUNTER_ADDR)),
        registerA(ram->CreateAccessor<uint16_t>(REGISTER_A_ADDR)),
        registerB(ram->CreateAccessor<uint16_t>(REGISTER_B_ADDR)),
        registerC(ram->CreateAccessor<uint16_t>(REGISTER_C_ADDR)),
        registerD(ram->CreateAccessor<uint16_t>(REGISTER_D_ADDR))
    {
        ram->OnWrite(CONTROL_ADDR, [this](uint32_t control)
        {
            clockRate = clockRates[(control >> 4) & 0b111];
        });
    }

    void Tick() override;
    
    size_t clockRate = 16;
    bool isCounting;

    MemoryAccessor<uint8_t> mode;
    MemoryAccessor<uint8_t> control;
    MemoryAccessor<uint16_t> counter;
    
    MemoryAccessor<uint16_t> registerA; 
    MemoryAccessor<uint16_t> registerB;
    MemoryAccessor<uint16_t> registerC;
    MemoryAccessor<uint16_t> registerD;
    
private:
    Memory* ram;
    Interrupts* interrupts;
    
    static constexpr uint16_t MODE_ADDR = 0xF0F0;
    static constexpr uint16_t CONTROL_ADDR = 0xF0F1;
    static constexpr uint16_t COUNTER_ADDR = 0xF0F6;
    
    static constexpr uint16_t REGISTER_A_ADDR = 0xF0F8;
    static constexpr uint16_t REGISTER_B_ADDR = 0xF0FA;
    static constexpr uint16_t REGISTER_C_ADDR = 0xF0FC;
    static constexpr uint16_t REGISTER_D_ADDR = 0xF0FE;

    static constexpr std::array clockRates = {
        0,
        0,
        0,
        0,
        1,
        4,
        16,
        0,
    };
};
