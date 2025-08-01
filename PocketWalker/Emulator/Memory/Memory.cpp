#include "Memory.h"

uint8_t Memory::ReadByte(uint16_t address) const
{
    address &= 0xFFFF;
    const uint8_t value = this->buffer[address];
    
    if (readHandlers.contains(address))
        readHandlers.at(address)(value);
    
    return value;
}

uint16_t Memory::ReadShort(uint16_t address) const
{
    address &= 0xFFFF;
    const uint16_t value = this->buffer[address] << 8 | this->buffer[address + 1];
    if (readHandlers.contains(address))
        readHandlers.at(address)(value);
    
    return value;
}

uint32_t Memory::ReadInt(uint16_t address) const
{
    address &= 0xFFFF;
    
    const uint32_t value = this->buffer[address] << 24 | this->buffer[address + 1] << 16 | this->buffer[address + 2] << 8 | this->buffer[address + 3];
    if (readHandlers.contains(address))
        readHandlers.at(address)(value);
    
    return value;
}

void Memory::WriteByte(uint16_t address, const uint8_t value) const
{
    address &= 0xFFFF;
    this->buffer[address] = value;

    if (writeHandlers.contains(address))
        writeHandlers.at(address)(value);
}

void Memory::WriteShort(uint16_t address, uint16_t value) const
{
    address &= 0xFFFF;
    this->buffer[address] = value >> 8 & 0xFF;
    this->buffer[address + 1] = value & 0xFF;
    
    if (writeHandlers.contains(address))
        writeHandlers.at(address)(value);
}

void Memory::WriteInt(uint16_t address, uint32_t value) const
{
    address &= 0xFFFF;
    this->buffer[address] = value >> 24 & 0xFF;
    this->buffer[address + 1] = value >> 16 & 0xFF;
    this->buffer[address + 2] = value >> 8 & 0xFF;
    this->buffer[address + 3] = value & 0xFF;
    
    if (writeHandlers.contains(address))
        writeHandlers.at(address)(value);
}