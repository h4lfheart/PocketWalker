#pragma once
#include "../PeripheralComponent.h"

class Buttons : PeripheralComponent
{
public:
    enum Button : uint8_t
    {
        Center = 1 << 0,
        Left = 1 << 2,
        Right = 1 << 4
    };
    
    Buttons(Ssu* ssu) : ssu(ssu)
    {
        
    }

    void Press(Button button);
    void Release(Button button);
    
private:
    Ssu* ssu;
};
