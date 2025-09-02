#pragma once
#include "../../Memory/Memory.h"

constexpr uint16_t VECTOR_RESET = 0x0000;

constexpr uint16_t VECTOR_IRQ0 = 0x0020;
constexpr uint16_t VECTOR_IRQ1 = 0x0022;

constexpr uint16_t VECTOR_TIMER_B1 = 0x0042;
constexpr uint16_t VECTOR_TIMER_W = 0x0046;


constexpr uint16_t VECTOR_RTC_QUARTER_SECOND = 0x002E;
constexpr uint16_t VECTOR_RTC_HALF_SECOND = 0x0030;
constexpr uint16_t VECTOR_RTC_SECOND = 0x0032;
constexpr uint16_t VECTOR_RTC_MINUTE = 0x0034;
constexpr uint16_t VECTOR_RTC_HOUR = 0x0036;
constexpr uint16_t VECTOR_RTC_DAY = 0x0038;
constexpr uint16_t VECTOR_RTC_WEEK = 0x0038;

class VectorTable
{
public:
    VectorTable(Memory* ram) : ram(ram)
    {
        reset = ram->ReadShort(VECTOR_RESET);
        irq0 = ram->ReadShort(VECTOR_IRQ0);
        irq1 = ram->ReadShort(VECTOR_IRQ1);
        timerB1 = ram->ReadShort(VECTOR_TIMER_B1);
        timerW = ram->ReadShort(VECTOR_TIMER_W);

        quarterSecond = ram->ReadShort(VECTOR_RTC_QUARTER_SECOND);
        halfSecond = ram->ReadShort(VECTOR_RTC_HALF_SECOND);
        second = ram->ReadShort(VECTOR_RTC_SECOND);
        minute = ram->ReadShort(VECTOR_RTC_MINUTE);
        hour = ram->ReadShort(VECTOR_RTC_HOUR);
        day = ram->ReadShort(VECTOR_RTC_DAY);
        week = ram->ReadShort(VECTOR_RTC_WEEK);
    }

    uint16_t reset;
    
    uint16_t irq0;
    uint16_t irq1;
    
    uint16_t timerB1;
    uint16_t timerW;
    
    uint16_t quarterSecond;
    uint16_t halfSecond;
    uint16_t second;
    uint16_t minute;
    uint16_t hour;
    uint16_t day;
    uint16_t week;

private:
    Memory* ram;
};
