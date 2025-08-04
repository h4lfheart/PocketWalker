#include <array>
#include <fstream>
#include <ios>
#include <print>
#include <cmath>
#include <atomic>

#define SDL_MAIN_HANDLED
#include <algorithm>
#include <thread>

#include "../external/SDL/include/SDL.h"

#include "Emulator/PocketWalker.h"

const std::string romPath = "C:/walker.bin";
const std::string eepromPath = "C:/Users/Max/Desktop/eep.rom";

const int AUDIO_RENDER_FREQUENCY = 256;
const int SAMPLE_RATE = 44100;
const int BASE_AMPLITUDE = 32768 / 2;
const int TARGET_LATENCY = 10;
const int MIN_FREQUENCY = 100;
const int MAX_FREQUENCY = 20000;

class WalkerAudio {
private:
    SDL_AudioDeviceID audioDevice;
    float currentPhase = 0.0f;
    float lastFreq = 0.0f;
    
public:
    WalkerAudio() {
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
    
    ~WalkerAudio() {
        if (audioDevice != 0) {
            SDL_CloseAudioDevice(audioDevice);
        }
    }
    
    void render(float frequency, float volumeMultiplier = 1.0f, float speed = 1.0f) {
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
};

int main(int argc, char* argv[])
{
    SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO);

    size_t margin = 4;
    size_t baseWidth = Lcd::WIDTH + margin * 2;
    size_t baseHeight = Lcd::HEIGHT + margin * 2;

    SDL_Window* window = SDL_CreateWindow(
        "Pocket Walker",
        SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
        baseWidth * 8, baseHeight * 8, 0
    );
    
    SDL_Renderer *renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);

    SDL_Texture *texture = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_RGB24, SDL_TEXTUREACCESS_STREAMING, baseWidth, baseHeight);

    void *pixels;
    int pitch;
    if (SDL_LockTexture(texture, NULL, &pixels, &pitch) != 0) {
        printf("SDL_LockTexture error: %s\n", SDL_GetError());
        return 1;
    }

    auto pixel_ptr = static_cast<uint8_t*>(pixels);
    int width = baseWidth;
    int height = baseHeight;

    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            int dstIndex = (y * width + x) * 3;
            pixel_ptr[dstIndex] = 0xCC;
            pixel_ptr[dstIndex + 1] = 0xCC;
            pixel_ptr[dstIndex + 2] = 0xCC;
        }
    }

    SDL_UnlockTexture(texture);

    bool running = true;
    
    std::array<uint8_t, 0xFFFF> romBuffer = {};
    std::ifstream romFile(romPath, std::ios::binary);
    romFile.read(reinterpret_cast<char*>(romBuffer.data()), romBuffer.size());

    std::array<uint8_t, 0xFFFF> eepromBuffer = {};
    std::ifstream eepromFile(eepromPath, std::ios::binary);
    eepromFile.read(reinterpret_cast<char*>(eepromBuffer.data()), eepromBuffer.size());
    
    PocketWalker emulator(romBuffer.data(), eepromBuffer.data());
    WalkerAudio audio; // Create audio instance

    emulator.board->lcd->onDraw = [&](uint8_t* data)
    {
        void *pixels;
        int pitch;
        if (SDL_LockTexture(texture, NULL, &pixels, &pitch) != 0) {
            printf("SDL_LockTexture error: %s\n", SDL_GetError());
            return 1;
        }

        auto pixel_ptr = static_cast<uint8_t*>(pixels);
        int width = 96;
        int height = 64;
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int srcIndex = (y * width + x) * 3;
                int dstX = margin + x;
                int dstY = margin + y;
                int dstIndex = (dstY * baseWidth + dstX) * 3;
                pixel_ptr[dstIndex] = data[srcIndex];
                pixel_ptr[dstIndex + 1] = data[srcIndex + 1];
                pixel_ptr[dstIndex + 2] = data[srcIndex + 2];
            }
        }

        SDL_UnlockTexture(texture);
    };
    
    std::thread emulatorThread([&]
    {
        try
        {
            constexpr int TARGET_FPS = 4;
            constexpr double FRAME_TIME_MS = 1000.0 / TARGET_FPS;
            constexpr int CYCLES_PER_FRAME = Cpu::TICKS / TARGET_FPS;
            auto nextFrameTime = std::chrono::high_resolution_clock::now();
            constexpr auto frameTimeDuration = std::chrono::duration_cast<std::chrono::nanoseconds>(
                std::chrono::duration<double, std::milli>(FRAME_TIME_MS)
            );

            emulator.board->renderAudio = [&](float frequency)
            {
                audio.render(frequency, 0.3f); // 0.3f volume multiplier
            };
            
            while (running)
            {
                const int frameStartCycles = emulator.cycles;
                
                while (emulator.cycles - frameStartCycles < CYCLES_PER_FRAME) {
                    emulator.Step();
                }
               
                
                nextFrameTime += frameTimeDuration;
                const auto now = std::chrono::high_resolution_clock::now();
                const auto sleepTime = nextFrameTime - now;
                
                if (sleepTime > std::chrono::nanoseconds(0)) {
                    std::this_thread::sleep_for(sleepTime);
                }
            }
        }
        catch (const std::exception& e)
        {
            std::println("\033[31mERROR: {}\033[0m", e.what());
        }

        running = false;
    });
    
    SDL_Event e;
    while (running) {
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT)
                running = false;
            if (e.type == SDL_KEYDOWN)
            {
                switch(e.key.keysym.sym)
                {
                case SDLK_LEFT: {
                        emulator.board->ram->WriteByte(0xFFDE, 1 << 2);
                        break;
                }
                case SDLK_DOWN: {
                        emulator.board->ram->WriteByte(0xFFDE, 1 << 0);
                        break;
                }
                case SDLK_RIGHT: {
                        emulator.board->ram->WriteByte(0xFFDE, 1 << 4);
                        break;
                }
                }
            }
        }

        SDL_RenderClear(renderer);
        SDL_RenderCopy(renderer, texture, NULL, NULL);
        SDL_RenderPresent(renderer);
    }
    
    SDL_DestroyTexture(texture);
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();

    emulatorThread.join();

    return 0;
}