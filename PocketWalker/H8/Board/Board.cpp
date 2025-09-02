
#include <print>
#include "Board.h"

#include "../Rtc/Rtc.h"


void Board::Tick(uint64_t cycles)
{
    if (cycles % ssu->clockRate == 0)
    {
        ssu->Tick();
    }
    
    if (cycles % (Cpu::TICKS / Timer::TICKS) == 0)
    {
        timer->Tick();
    }

    if (cycles % (Cpu::TICKS / Sci3::TICKS) == 0 && timer->clockStop1 & TimerFlags::STANDBY_SCI3)
    {
        sci3->Tick();
    }
    
    if (cycles % (Cpu::TICKS / Adc::TICKS) == 0 && timer->clockStop1 & TimerFlags::STANDBY_ADC)
    {
        adc->Tick();
    }

    if (cycles % (Cpu::TICKS / Rtc::TICKS) == 0 && timer->clockStop1 & TimerFlags::STANDBY_RTC)
    {
        rtc->Tick();
    }
}
