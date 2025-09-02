#pragma once
#include "../../../H8/IO/IOComponent.h"

class Lcd;

class LcdData : public IOComponent
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

private:
    Lcd* lcd;
};
