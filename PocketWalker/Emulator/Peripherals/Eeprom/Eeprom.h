#pragma once
#include "../PeripheralComponent.h"
#include "../../Memory/Memory.h"

class Memory;

enum EepromState
{
    Waiting,
    GettingStatus,
    GettingHighAddress,
    GettingLowAddress,
    GettingBytes
};

class Eeprom : public PeripheralComponent
{
public:
    Eeprom(uint8_t* eeprom_buffer)
    {
        memory = new Memory(eeprom_buffer);
    }
    
    void TransmitAndReceive(Ssu* ssu) override;
    void Transmit(Ssu* ssu) override;
    void Reset() override;

    bool IsProgressive() override
    {
        return true;
    }

    Memory* memory;
    EepromState state;
    uint8_t status;
    uint8_t highAddress;
    uint8_t lowAddress;
    uint16_t offset;

    static constexpr uint8_t PIN = 1 << 2;
};
