#include "Rtc.h"

#include <ctime>

void Rtc::Initialize()
{
    isInitialized = true;

    Tick();

    interrupts->rtcFlag |= InterruptFlags::FLAG_QUARTER_SECOND;
    interrupts->rtcFlag |= InterruptFlags::FLAG_HALF_SECOND;
    interrupts->rtcFlag |= InterruptFlags::FLAG_SECOND;
    interrupts->rtcFlag |= InterruptFlags::FLAG_MINUTE;
    interrupts->rtcFlag |= InterruptFlags::FLAG_HOUR;
}

void Rtc::Tick()
{
    const time_t currentTime = std::time(nullptr);
    std::tm localTime;
    localtime_s(&localTime, &currentTime);

    second = localTime.tm_sec;
    minute = localTime.tm_min;
    hour = localTime.tm_hour;
    day = localTime.tm_mday;

    quarterCount++;

    interrupts->rtcFlag |= InterruptFlags::FLAG_QUARTER_SECOND;

    if (quarterCount % 2 == 0)
    {
        interrupts->rtcFlag |= InterruptFlags::FLAG_HALF_SECOND;
    }

    if (localTime.tm_sec != lastTime.tm_sec)
    {
        interrupts->rtcFlag |= InterruptFlags::FLAG_SECOND;
    }
    
    if (localTime.tm_min != lastTime.tm_min)
    {
        interrupts->rtcFlag |= InterruptFlags::FLAG_MINUTE;
    }
    
    if (localTime.tm_hour != lastTime.tm_hour)
    {
        interrupts->rtcFlag |= InterruptFlags::FLAG_HOUR;
    }
    
    lastTime = localTime;
}
