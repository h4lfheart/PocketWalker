#pragma once
#include "../PeripheralComponent.h"

class Lcd;

class LcdData : public PeripheralComponent
{
public:
    LcdData(Lcd* lcd) : lcd(lcd)
    {
        
    }
    
    void Transmit(Ssu* ssu) override;

    bool IsData() override
    {
        return true;
    }

    static constexpr uint8_t PIN = 1 << 1;

private:
    Lcd* lcd;
};
