#pragma once
#include "../../Memory/Memory.h"

constexpr uint16_t VECTOR_RESET = 0x0000;

constexpr uint16_t VECTOR_IRQ0 = 0x0020;
constexpr uint16_t VECTOR_IRQ1 = 0x0022;

constexpr uint16_t VECTOR_TIMER_B1 = 0x0042;
constexpr uint16_t VECTOR_TIMER_W = 0x0046;

class VectorTable
{
public:
    VectorTable(Memory* ram) : ram(ram)
    {
        reset = ram->ReadShort(VECTOR_RESET);
        irq0 = ram->ReadShort(VECTOR_RESET);
        irq1 = ram->ReadShort(VECTOR_RESET);
        timerB1 = ram->ReadShort(VECTOR_TIMER_B1);
        timerW = ram->ReadShort(VECTOR_TIMER_W);
    }

    uint16_t reset;
    
    uint16_t irq0;
    uint16_t irq1;
    
    uint16_t timerB1;
    uint16_t timerW;

private:
    Memory* ram;
};
