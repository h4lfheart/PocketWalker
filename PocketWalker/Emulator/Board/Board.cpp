
#include "Board.h"

#include "../Rtc/Rtc.h"


void Board::Tick(uint64_t cycles)
{
    if (cycles % ssu->clockRate == 0)
    {
        ssu->Tick();
    }

    if (cycles % (Cpu::TICKS / Lcd::TICKS) == 0)
    {
        lcd->Tick();
    }
    
    if (cycles % (Cpu::TICKS / Timer::TICKS) == 0)
    {
        timer->Tick();
    }

    if (cycles % (Cpu::TICKS / Rtc::TICKS) == 0)
    {
        rtc->Tick();
    }
}
