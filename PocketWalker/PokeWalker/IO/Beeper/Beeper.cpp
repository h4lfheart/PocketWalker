#include "Beeper.h"

void Beeper::Tick()
{
    renderAudio(timerW->isCounting ? 31500.0f / timerW->registerA : 0);
}
