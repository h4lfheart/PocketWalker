#pragma once
#include "SdlAudio.h"
#include "SdlWindow.h"

class SdlSystem
{
public:
    SdlSystem() = default;

    SdlWindow* window;
    SdlAudio* audio;

    bool Initialize();
    void Stop();
private:
    bool isRunning;
};
