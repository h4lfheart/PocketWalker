#pragma once
#include <cstdint>
#include <thread>

#include "Board/Board.h"

class H8300H
{
public:
    H8300H(uint8_t* ramBuffer);

    void StartAsync();
    void StartSync();
    void Stop();
    void Pause();
    void Resume();
    
    bool IsRunning() const { return isRunning; }
    bool IsPaused() const { return isPaused; }
    
    void SetExceptionHandling(const bool value) { isExceptionHandling = value; }


protected:
    
    template <typename T>
    void RegisterIOComponent(T* component, Ssu::Port port, uint8_t pin)
    {
        board->ssu->RegisterIOPeripheral(port, pin, component);
    }

    Board* board;

    virtual void Tick(uint64_t cycles);

private:
    void EmulatorLoop();
    uint8_t Step();

    std::thread emulatorThread;
    
    bool isExceptionHandling = true;
    bool isRunning = false;
    bool isPaused = false;

    uint64_t elapsedCycles = 0;
};