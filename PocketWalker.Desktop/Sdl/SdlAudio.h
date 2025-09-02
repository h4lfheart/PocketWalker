#pragma once

#include <vector>
#include <cmath>
#include <algorithm>
#include "../../external/SDL/include/SDL.h"

class SdlAudio {
private:
    static const int AUDIO_RENDER_FREQUENCY = 256;
    static const int SAMPLE_RATE = 44100;
    static const int BASE_AMPLITUDE = 32768 / 2;
    static const int TARGET_LATENCY = 10;
    static const int MIN_FREQUENCY = 100;
    static const int MAX_FREQUENCY = 20000;
    
    SDL_AudioDeviceID audioDevice;
    float currentPhase = 0.0f;
    float lastFreq = 0.0f;
    
public:
    SdlAudio();
    ~SdlAudio();
    
    void Render(float frequency, float volumeMultiplier = 1.0f, float speed = 1.0f);
};