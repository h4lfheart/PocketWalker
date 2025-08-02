#include "Timer.h"

void Timer::Tick()
{
    clockCycles++;

    b1->isCounting = clockStop1 & TimerFlags::STANDBY_TIMER_B1 && b1->mode & TimerB1Flags::MODE_COUNTING;

    if (b1->isCounting && clockCycles % b1->clockRate == 0)
    {
        b1->Tick();
    }
}
