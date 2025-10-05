#pragma once
#include "../H8/H8300H.h"

#include "IO/Accelerometer/Accelerometer.h"
#include "IO/Beeper/Beeper.h"
#include "IO/Eeprom/Eeprom.h"

class PokeWalker : public H8300H
{
public:
    PokeWalker(uint8_t* ramBuffer, uint8_t* eepromBuffer);

    void Tick(uint64_t cycles) override;
    
    void OnDraw(const EventHandlerCallback<uint8_t*>& handler) const;
    void OnAudio(const EventHandlerCallback<AudioInformation>& handler) const;

    void OnTransmitSci3(const EventHandlerCallback<uint8_t>& callback) const;
    void ReceiveSci3(uint8_t byte) const;
    
    void PressButton(Buttons::Button button) const;
    void ReleaseButton(Buttons::Button button) const;
    
    uint8_t* GetEepromBuffer() const;
    void SetEepromBuffer(uint8_t* buffer) const;

    uint8_t GetContrast() const;

private:
    void SetupAddressHandlers() const;
    
    Eeprom* eeprom;
    Accelerometer* accelerometer;
    Lcd* lcd;
    LcdData* lcdData;
    
    Beeper* beeper;
    Buttons* buttons;

};
