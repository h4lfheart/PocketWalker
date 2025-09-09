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

    EventHandler<float> OnPlayFrequency;

    static constexpr size_t TICKS = 256;
private:
    TimerW* timerW;
};
