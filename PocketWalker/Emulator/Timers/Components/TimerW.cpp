#include "TimerW.h"

void TimerW::Tick()
{
    if (counter == std::numeric_limits<uint16_t>::max())
    {
        counter = 0;
    }
    else
    {
        counter += 1;
    }
}
