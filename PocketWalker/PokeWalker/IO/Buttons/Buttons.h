#pragma once
#include "../../../H8/IO/IOComponent.h"
#include "../../../H8/Memory/MemoryAccessor.h"

class Buttons : public IOComponent
{
public:
    enum Button : uint8_t
    {
        Center = 1 << 0,
        Left = 1 << 2,
        Right = 1 << 4
    };
    
    Buttons(MemoryAccessor<uint8_t> portB) : portB(portB)
    {
        
    }

    void Press(Button button);
    void Release(Button button);
    
private:
    MemoryAccessor<uint8_t> portB;
};
