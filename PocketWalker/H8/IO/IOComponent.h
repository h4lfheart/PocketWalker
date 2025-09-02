#pragma once
#include <cstdint>

#include "../Board/Component.h"

class Ssu;

class IOComponent : public Component
{
public:
    virtual void TransmitAndReceive(Ssu* ssu) { }
    virtual void Transmit(Ssu* ssu) { }
    virtual void Receive(Ssu* ssu) { }

    virtual void Reset() { }

    virtual bool CanExecute(Ssu* ssu)
    {
        return true;
    }

    virtual bool IsData()
    {
        return false;
    }
    
    virtual bool IsProgressive()
    {
        return false;
    }
};
