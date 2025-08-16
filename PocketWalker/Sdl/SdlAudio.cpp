#include "SdlAudio.h"
#include <print>

SdlAudio::SdlAudio() {
    SDL_AudioSpec desiredSpec, obtainedSpec;
    SDL_zero(desiredSpec);
    desiredSpec.freq = SAMPLE_RATE;
    desiredSpec.format = AUDIO_S16SYS;
    desiredSpec.channels = 1;
    desiredSpec.samples = 1024;
    desiredSpec.callback = nullptr;
    
    audioDevice = SDL_OpenAudioDevice(nullptr, 0, &desiredSpec, &obtainedSpec, 0);
    if (audioDevice == 0) {
        printf("Failed to open audio device: %s\n", SDL_GetError());
        return;
    }
    
    SDL_PauseAudioDevice(audioDevice, 0); // Start playback
}

SdlAudio::~SdlAudio() {
    if (audioDevice != 0) {
        SDL_CloseAudioDevice(audioDevice);
    }
}

void SdlAudio::Render(float frequency, float volumeMultiplier, float speed) {
    if (frequency != lastFreq) {
        lastFreq = frequency;
        currentPhase = 0.0f;
    }
    
    int sampleCount = static_cast<int>(std::ceil(SAMPLE_RATE / (AUDIO_RENDER_FREQUENCY * speed)));
    
    Uint32 queuedBytes = SDL_GetQueuedAudioSize(audioDevice);
    float latency = (queuedBytes / 2.0f) / (SAMPLE_RATE / 1000.0f);
    
    if (latency > TARGET_LATENCY) {
        sampleCount = std::max(1, sampleCount - 1);
    } else if (latency < TARGET_LATENCY / 2.0f) {
        sampleCount += 1;
    }
    
    std::vector<int16_t> audioBuffer(sampleCount);
    float targetAmplitude = BASE_AMPLITUDE * volumeMultiplier;
    
    if (frequency >= MIN_FREQUENCY && frequency <= MAX_FREQUENCY) {
        const float samplesPerCycle = SAMPLE_RATE / frequency;
        const float nyquistFreq = SAMPLE_RATE / 2.0f;
        const int maxHarmonic = static_cast<int>(std::floor(nyquistFreq / frequency));
        
        for (int i = 0; i < sampleCount; i++) {
            const float time = (currentPhase + i) / SAMPLE_RATE;
            float sample = 0.0f;
            
            for (int h = 1; h <= maxHarmonic; h += 2) {
                sample += std::sin(2.0f * M_PI * frequency * h * time) / h;
            }
            
            sample = (sample * 4.0f / M_PI) * targetAmplitude;
            audioBuffer[i] = static_cast<int16_t>(std::clamp(sample, -32768.0f, 32767.0f));
        }
        
        currentPhase += sampleCount;
        currentPhase = std::fmod(currentPhase, samplesPerCycle);
    } else {
        std::fill(audioBuffer.begin(), audioBuffer.end(), 0);
    }
    
    // Queue the audio data
    SDL_QueueAudio(audioDevice, audioBuffer.data(), audioBuffer.size() * sizeof(int16_t));
}