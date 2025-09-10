#include "Beeper.h"

void Beeper::Tick()
{
    auto frequency = timerW->isCounting ? 31500.0f / timerW->registerA : 0;
    auto isFullVolume = timerW->registerB == timerW->registerC;
    OnPlayAudio(AudioInformation(frequency, isFullVolume));
}
