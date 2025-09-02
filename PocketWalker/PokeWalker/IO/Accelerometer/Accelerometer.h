#pragma once
#include "../../../H8/IO/IOComponent.h"
#include "../../../H8/Memory/Memory.h"

class Accelerometer : public IOComponent
{
public:
    enum AccelerometerState
    {
        GettingAddress,
        ReadingData,
        WritingData,
    };

    
    Accelerometer()
    {
        memory = new Memory(0x7F);
    }
    
    void TransmitAndReceive(Ssu* ssu) override;
    void Transmit(Ssu* ssu) override;
    void Reset() override;

    AccelerometerState state;
    uint16_t address;
    uint16_t offset;
    
//private:
    Memory* memory;
};
