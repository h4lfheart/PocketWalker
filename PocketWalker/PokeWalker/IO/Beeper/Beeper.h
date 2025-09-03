#pragma once
#include <functional>

#include "../../../H8/IO/IOComponent.h"
#include "../../../H8/Timers/Components/TimerW.h"
#include "../../../Utilities/EventHandler.h"

class Beeper : public IOComponent
{
public:
    Beeper(TimerW* timerW) : timerW(timerW)
    {
        
    }

    void Tick() override;

    bool DoesTick() override
    {
        return true;
    }

    size_t TickRate() override
    {
        return 256;
    }

    EventHandler<float> OnPlayFrequency;
private:
    TimerW* timerW;
};
