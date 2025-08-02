#include "TimerB1.h"

#include "../../Cpu/Components/Interrupts.h"

void TimerB1::Tick()
{
    if (counter == std::numeric_limits<uint8_t>::max())
    {
        counter = 0;
        interrupts->flag2 |= InterruptFlags::ENABLE_TIMER_B1;
    }
    else
    {
        counter += 1;
    }
}
