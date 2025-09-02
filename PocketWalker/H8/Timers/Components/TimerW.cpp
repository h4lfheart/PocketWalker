#include "TimerW.h"

#include "../../Cpu/Components/Interrupts.h"

void TimerW::Tick()
{
    if (counter == std::numeric_limits<uint16_t>::max())
    {
        counter = 0;
        interrupts->flagTimerW |= InterruptFlags::FLAG_TIMER_W_OVERFLOW;
    }
    else
    {
        counter += 1;
    }

    if (counter >= registerA)
    {
        if (control & TimerWFlags::CONTROL_COUNTER_CLEAR)
        {
            counter = 0;
        }

        interrupts->flagTimerW |= InterruptFlags::FLAG_TIMER_W_REGISTER_A;
    }
}
