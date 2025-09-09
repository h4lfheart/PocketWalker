#include "Rtc.h"

#include <ctime>

#include "../../Utilities/BitUtilities.h"

void Rtc::Tick()
{
    if (!isInitialized)
    {
        interrupts->rtcFlag |= InterruptFlags::FLAG_QUARTER_SECOND;
        interrupts->rtcFlag |= InterruptFlags::FLAG_HALF_SECOND;
        interrupts->rtcFlag |= InterruptFlags::FLAG_SECOND;
        interrupts->rtcFlag |= InterruptFlags::FLAG_MINUTE;
        interrupts->rtcFlag |= InterruptFlags::FLAG_HOUR;
        
        isInitialized = true;
    }
    
    const time_t currentTime = std::time(nullptr);
    std::tm localTime;
#if ANDROID
    localtime_r(&currentTime, &localTime);
#else
    localtime_s(&localTime, &currentTime);
#endif

    second = BitUtilities::BinaryEncodedDecimal(localTime.tm_sec);
    minute = BitUtilities::BinaryEncodedDecimal(localTime.tm_min);
    hour = BitUtilities::BinaryEncodedDecimal(localTime.tm_hour);
    day = BitUtilities::BinaryEncodedDecimal(localTime.tm_mday);

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
