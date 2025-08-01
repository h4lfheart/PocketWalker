#pragma once
#include <cstdint>

#include "../Board/Component.h"

class Ssu;

class PeripheralComponent : public Component
{
public:
    virtual void TransmitAndReceive(Ssu* ssu) { }
    virtual void Transmit(Ssu* ssu) { }
    virtual void Receive(Ssu* ssu) { }

    virtual void Reset() { }

    virtual bool IsData()
    {
        return false;
    }
    
    virtual bool IsProgressive()
    {
        return false;
    }

    size_t progress;

    static constexpr uint8_t PIN = 1 << 0;
};
