#include <array>
#include <fstream>
#include <ios>
#include <print>
#include <cmath>
#include <atomic>
#include <chrono>
#include <mutex>
#include <cstring>

#define SDL_MAIN_HANDLED
#define NOMINMAX

#include <algorithm>
#include <thread>

#include "../external/SDL/include/SDL.h"

#include "Emulator/PocketWalker.h"
#include "Tcp/TcpSocket.h"

// TODO THIS IS ALL POC PLEASE REWRITE

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
    // Parse command line arguments
    bool serverMode = false;
    for (int i = 1; i < argc; i++) {
        if (std::string(argv[i]) == "-server") {
            serverMode = true;
            break;
        }
    }
    
    std::println("Starting Pocket Walker Emulator in {} mode", serverMode ? "SERVER" : "CLIENT");
    
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

    bool emulatorRunning = true;

    
    const std::string romPath = "C:/walker.bin";
    const std::string eepromPath = serverMode ? "C:/Users/Max/Downloads/pweep.rom" : "C:/Users/Max/Desktop/eep.rom";
    
    std::array<uint8_t, 0xFFFF> romBuffer = {};
    std::ifstream romFile(romPath, std::ios::binary);
    romFile.read(reinterpret_cast<char*>(romBuffer.data()), romBuffer.size());

    std::array<uint8_t, 0xFFFF> eepromBuffer = {};
    std::ifstream eepromFile(eepromPath, std::ios::binary);
    eepromFile.read(reinterpret_cast<char*>(eepromBuffer.data()), eepromBuffer.size());
    eepromFile.close();
    
    PocketWalker emulator(romBuffer.data(), eepromBuffer.data());
    WalkerAudio audio; // Create audio instance
    
    // Thread-safe LCD data buffer
    std::mutex lcdDataMutex;
    std::vector<uint8_t> lcdDataBuffer(96 * 64 * 3, 0xCC); // Initialize with gray
    std::atomic<bool> lcdDataUpdated{false};
    
    emulator.board->renderAudio = [&](float frequency)
    {
        audio.render(frequency, 0.3f); // 0.3f volume multiplier
    };

    emulator.board->lcd->onDraw = [&](uint8_t* data)
    {
        // Copy LCD data to thread-safe buffer instead of directly updating texture
        std::lock_guard<std::mutex> lock(lcdDataMutex);
        std::memcpy(lcdDataBuffer.data(), data, 96 * 64 * 3);
        lcdDataUpdated.store(true);
        // Debug: uncomment next line to verify LCD updates are being called
        // std::println("[LCD] Data updated");
    };

    // Timing debug variables for TCP communication
    std::chrono::high_resolution_clock::time_point lastReceiveTime;
    std::chrono::high_resolution_clock::time_point lastTransmitTime;
    bool firstReceive = true;
    bool firstTransmit = true;
    uint32_t receiveCount = 0;
    uint32_t transmitCount = 0;

    std::thread tcpThread([&]
    {
        bool connected = false;
        TcpSocket socket;

        socket.setOnConnect([&connected]() {
            connected = true;
            std::println("[TCP] Connected");
        });

        socket.setOnClose([&connected]() {
            connected = false;
            std::println("[TCP] Disconnected");
        });

        // Server-specific callback for client connections
        if (serverMode) {
            socket.setOnClientConnect([](const std::string& clientIP) {
                std::println("[TCP] Client connected from: {}", clientIP);
            });
        }

        socket.setOnData([&](const std::vector<uint8_t>& data) {
            emulator.board->sci3->Receive(data);

        });

        emulator.board->sci3->sendData = [&](uint8_t byte)
        {
            socket.send({byte});
        };

        // Initialize connection based on mode
        if (serverMode) {
            std::println("[TCP] Starting server on port 8081...");
            if (!socket.startServer(8081)) {
                std::println("[TCP] Failed to start server");
            }
        } else {
            std::println("[TCP] Connecting to server at 127.0.0.1:8081...");
            socket.connect("127.0.0.1", 8081);
        }

        while (emulatorRunning) {
            if (!socket.isConnected()) {
                if (serverMode) {
                    // For server mode, reconnect means restarting the server
                    std::println("[TCP] Attempting to restart server...");
                } else {
                    // For client mode, reconnect means trying to connect again
                    std::println("[TCP] Attempting to reconnect to server...");
                }
                socket.reconnect();
            }
            
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            
        }
    
        socket.close();
    });
    
    std::thread emulatorThread([&]
    {
        try
        {
            constexpr double SECONDS_PER_CYCLE = 1.0 / Cpu::TICKS;

            auto startTime = std::chrono::high_resolution_clock::now();
            double totalCyclesExecuted = 0.0;
            
            while (emulatorRunning) {
                uint8_t cycles = emulator.Step();
                totalCyclesExecuted += cycles;

                auto now = std::chrono::high_resolution_clock::now();
                std::chrono::duration<double> elapsed = now - startTime;
                double expectedCycles = elapsed.count() / SECONDS_PER_CYCLE;
                
                if (totalCyclesExecuted > expectedCycles) {
                    // Ahead - normal sleep logic
                    double secondsToSleep = (totalCyclesExecuted - expectedCycles) * SECONDS_PER_CYCLE;
                    if (secondsToSleep > 0.0002) {
                        std::this_thread::sleep_for(std::chrono::duration<double>(secondsToSleep));
                    }
                }
            }
        }
        catch (const std::exception& e)
        {
            std::println("\033[31mERROR: {}\033[0m", e.what());
        }

        emulatorRunning = false;
    });
    
    SDL_Event e;
    while (emulatorRunning) {
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT)
                emulatorRunning = false;
            if (e.type == SDL_KEYDOWN)
            {
                // TODO proper input peripheral
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

        // Update texture from LCD data buffer if needed (thread-safe)
        if (lcdDataUpdated.load()) {
            std::lock_guard<std::mutex> lock(lcdDataMutex);
            
            void *pixels;
            int pitch;
            if (SDL_LockTexture(texture, NULL, &pixels, &pitch) == 0) {
                auto pixel_ptr = static_cast<uint8_t*>(pixels);
                
                for (int y = 0; y < 64; y++) {
                    for (int x = 0; x < 96; x++) {
                        int srcIndex = (y * 96 + x) * 3;
                        int dstX = margin + x;
                        int dstY = margin + y;
                        int dstIndex = (dstY * baseWidth + dstX) * 3;
                        pixel_ptr[dstIndex] = lcdDataBuffer[srcIndex];
                        pixel_ptr[dstIndex + 1] = lcdDataBuffer[srcIndex + 1];
                        pixel_ptr[dstIndex + 2] = lcdDataBuffer[srcIndex + 2];
                    }
                }
                
                SDL_UnlockTexture(texture);
                lcdDataUpdated.store(false);
                // Debug: uncomment next line to verify texture updates
                // std::println("[RENDER] Texture updated");
            } else {
                std::println("SDL_LockTexture error: {}", SDL_GetError());
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
    tcpThread.join();

    std::ofstream eepromFileOut(eepromPath, std::ios::binary);
    eepromFileOut.write(reinterpret_cast<const char*>(emulator.board->eeprom->memory->buffer), eepromBuffer.size());
    eepromFileOut.close();

    return 0;
}