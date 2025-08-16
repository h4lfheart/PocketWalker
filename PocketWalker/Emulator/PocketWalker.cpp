#include "PocketWalker.h"

#include <thread>

PocketWalker::PocketWalker(uint8_t* ramBuffer, uint8_t* eepromBuffer): board(new Board(ramBuffer, eepromBuffer))
{
    
}

void PocketWalker::Start()
{
    isRunning = true;
    
    emulatorThread = std::thread(&PocketWalker::EmulatorLoop, this);
}

void PocketWalker::Stop()
{
    isRunning = false;

    emulatorThread.join();
}

bool PocketWalker::IsPokewalkerRom() const
{
    return board->ram->ReadString(0xBF98, 9).contains("nintendo");
}

void PocketWalker::OnDraw(std::function<void(uint8_t*)> handler) const
{
    board->lcd->onDraw = handler;
}

void PocketWalker::OnAudio(std::function<void(float)> handler) const
{
    board->renderAudio = handler;
}

void PocketWalker::EmulatorLoop()
{
    try
    {
        constexpr double SECONDS_PER_CYCLE = 1.0 / Cpu::TICKS;
        const auto startTime = std::chrono::high_resolution_clock::now();
        while (isRunning)
        {
            Step();

            auto currentTime = std::chrono::high_resolution_clock::now();
            std::chrono::duration<double> elapsedTime = currentTime - startTime;
        
            const auto expectedCycles = elapsedTime.count() / SECONDS_PER_CYCLE;
            if (elapsedCycles > expectedCycles)
            {
                auto sleepTime = (elapsedCycles - expectedCycles) * SECONDS_PER_CYCLE;
                    std::this_thread::sleep_for(std::chrono::duration<double>(sleepTime));
            }
        }    
    }
    catch (const std::exception& e)
    {
        std::println("\033[31m{}\033[0m", e.what());
        Stop();
    }
}

uint8_t PocketWalker::Step()
{
    const uint8_t cpuCycles = board->cpu->Step();
    for (auto i = 0; i < cpuCycles; i++)
    {
        elapsedCycles++;
        board->Tick(elapsedCycles);
    }

    return cpuCycles;
}
