#include "H8300H.h"

#include <thread>

#include "IO/IOComponent.h"

H8300H::H8300H(uint8_t* ramBuffer): board(new Board(ramBuffer))
{
    
}

void H8300H::StartAsync()
{
    isRunning = true;

    emulatorThread = std::thread(&H8300H::EmulatorLoop, this);
}

void H8300H::StartSync()
{
    isRunning = true;

    EmulatorLoop();
}

void H8300H::Stop()
{
    isRunning = false;
}

void H8300H::Pause()
{
    isPaused = true;
}

void H8300H::Resume()
{
    isPaused = false;
}

void H8300H::EmulatorLoop()
{
    auto loop = [&]()
    {
        constexpr double SECONDS_PER_CYCLE = 1.0 / Cpu::TICKS;
        constexpr int INSTRUCTIONS_PER_TIMING_CHECK = 1000;
        int instructionCount = 0;

        auto startTime = std::chrono::high_resolution_clock::now();

        while (isRunning) {
            Step();
            instructionCount++;

            if (isPaused) {
                auto pauseStart = std::chrono::high_resolution_clock::now();
                while (isPaused && isRunning) {
                    std::this_thread::sleep_for(std::chrono::milliseconds(10));
                }
                auto pauseEnd = std::chrono::high_resolution_clock::now();
        
                auto pausedDuration = pauseEnd - pauseStart;
                startTime += pausedDuration;
        
                continue;
            }

            if (instructionCount >= INSTRUCTIONS_PER_TIMING_CHECK) {
                auto currentTime = std::chrono::high_resolution_clock::now();
                std::chrono::duration<double> elapsedTime = currentTime - startTime;

                const auto expectedCycles = elapsedTime.count() / SECONDS_PER_CYCLE;
                if (elapsedCycles > expectedCycles) {
                    auto sleepTime = (elapsedCycles - expectedCycles) * SECONDS_PER_CYCLE;
                    std::this_thread::sleep_for(std::chrono::duration<double>(sleepTime));
                }
                
                instructionCount = 0;
            }
        }
    };

    if (isExceptionHandling)
    {
        try
        {
            loop();
        }
        catch (const std::exception& e)
        {
            std::println("\033[31m{}\033[0m", e.what());
            Stop();
        }
    }
    else
    {
        loop();
    }
}

uint8_t H8300H::Step()
{
    const uint8_t cpuCycles = board->cpu->Step();
    for (auto i = 0; i < cpuCycles; i++)
    {
        elapsedCycles++;

        Tick(elapsedCycles);
    }

    return cpuCycles;
}


void H8300H::Tick(uint64_t cycles)
{
    board->Tick(cycles);

    if (cycles % 64 == 0 && !board->cpu->flags->interrupt)
    {
        board->cpu->UpdateInterrupts();
    }
}

