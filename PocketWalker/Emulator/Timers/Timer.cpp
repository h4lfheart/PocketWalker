#include "Timer.h"

void Timer::Tick()
{
    clockCycles++;

    b1->isCounting = clockStop1 & TimerFlags::STANDBY_TIMER_B1 && b1->mode & TimerB1Flags::MODE_COUNTING;
    w->isCounting = clockStop2 & TimerFlags::STANDBY_TIMER_W && w->mode & TimerWFlags::MODE_COUNTING;

    if (b1->isCounting && clockCycles % b1->clockRate == 0)
    {
        b1->Tick();
    }
    
    if (w->isCounting && clockCycles % w->clockRate == 0)
    {
        w->Tick();
    }
}
