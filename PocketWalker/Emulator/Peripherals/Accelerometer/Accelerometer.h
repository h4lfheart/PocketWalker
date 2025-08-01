#pragma once
#include "../PeripheralComponent.h"
#include "../../Memory/Memory.h"
#include "../../Ssu/Ssu.h"

class Memory;

enum AccelerometerState
{
    GettingAddress,
    GettingData
};

class Accelerometer : public PeripheralComponent
{
public:
    Accelerometer()
    {
        memory = new Memory(0x7F);
    }
    
    void TransmitAndReceive(Ssu* ssu) override;
    void Transmit(Ssu* ssu) override;
    void Reset() override;

    Memory* memory;
    AccelerometerState state;
    uint16_t address;
    uint16_t offset;
};
