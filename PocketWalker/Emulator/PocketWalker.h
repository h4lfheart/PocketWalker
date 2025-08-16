#pragma once
#include <cstdint>
#include <thread>

#include "Board/Board.h"

class PocketWalker
{
public:
    PocketWalker(uint8_t* ramBuffer, uint8_t* eepromBuffer);

    void Start();
    void Stop();
    bool IsPokewalkerRom() const;

    void OnDraw(std::function<void(uint8_t* buffer)> handler) const;
    void OnAudio(std::function<void(float frequency)> handler) const;
    
    Board* board;
    bool isRunning;

private:
    void EmulatorLoop();
    uint8_t Step();

    std::thread emulatorThread;

    uint64_t elapsedCycles;
};
