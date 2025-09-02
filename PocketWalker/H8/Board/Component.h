#pragma once

class Component
{
public:
    virtual ~Component() = default;
    
    virtual void Tick() { }

    virtual bool DoesTick() { return false; }
    virtual size_t TickRate() { return 0; }
    
};
