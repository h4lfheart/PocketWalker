#pragma once
#include <cstdint>
#include <thread>

#include "Board/Board.h"

class H8300H
{
public:
    H8300H(uint8_t* ramBuffer);

    void Start();
    void Stop();
    
    bool isRunning;

protected:
    
    template <typename T>
    void RegisterIOComponent(T* component, Ssu::Port port, uint8_t pin)
    {
        ioComponents.push_back(component);
        board->ssu->RegisterIOPeripheral(port, pin, component);
    }

    Board* board;

private:
    void EmulatorLoop();
    uint8_t Step();

    std::thread emulatorThread;

    uint64_t elapsedCycles;

    std::vector<IOComponent*> ioComponents;
};

struct IOComponentContainer
{
    IOComponent* component;
    Ssu::Port port;
    uint8_t pin;
};