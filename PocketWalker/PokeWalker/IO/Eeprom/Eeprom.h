#pragma once
#include "../../../H8/Memory/Memory.h"
#include "../../../H8/IO/IOComponent.h"

namespace EepromFlags
{
    enum Commands : uint8_t
    {
        WRITE_ENABLE = 0b00000110,
        WRITE_DISABLE = 0b00000100,
        READ_STATUS = 0b00000101,
        WRITE_STATUS = 0b00000001,
        READ_MEMORY = 0b00000011,
        WRITE_MEMORY = 0b00000010
    };

    enum Status : uint8_t
    {
        WRITE_UNLOCK = 0b00000010
    };
}


enum EepromState
{
    Waiting,
    GettingStatus,
    GettingHighAddress,
    GettingLowAddress,
    GettingBytes
};

class Eeprom : public IOComponent
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

    EepromState state;
    uint8_t status;
    uint8_t highAddress;
    uint8_t lowAddress;
    uint16_t offset;
    
    Memory* memory;
};
