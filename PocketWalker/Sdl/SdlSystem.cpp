#include "SdlSystem.h"

bool SdlSystem::Initialize()
{
    SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO);

    window = new SdlWindow();
    audio = new SdlAudio();
    
    if (!window->Initialize()) {
        SDL_Quit();
        return false;
    }

    isRunning = true;

    return true;
}

void SdlSystem::Stop()
{
    window->Stop();
    SDL_Quit();
}
