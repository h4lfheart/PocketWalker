#pragma once
#include "../H8/H8300H.h"

#include "IO/Accelerometer/Accelerometer.h"
#include "IO/Beeper/Beeper.h"
#include "IO/Eeprom/Eeprom.h"

class PokeWalker : public H8300H
{
public:
    PokeWalker(uint8_t* ramBuffer, uint8_t* eepromBuffer);
    
    void OnDraw(std::function<void(uint8_t* buffer)> handler) const;
    void OnAudio(std::function<void(float frequency)> handler) const;
    void PressButton(Buttons::Button button) const;
    void ReleaseButton(Buttons::Button button) const;
    void SetEepromBuffer(uint8_t* buffer);

    uint8_t* GetEepromBuffer();

private:
    void SetupAddressHandlers();

    
    Eeprom* eeprom;
    Accelerometer* accelerometer;
    Lcd* lcd;
    LcdData* lcdData;
    
    Beeper* beeper;
    Buttons* buttons;

};
