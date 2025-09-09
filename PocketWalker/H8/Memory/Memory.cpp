#include "Memory.h"

#include <print>

std::string Memory::ReadString(uint16_t address, size_t size)
{
    const auto data = new char[size];
    for (auto offset = 0; offset < size; offset++)
    {
        data[offset] = ReadByte(address + offset);
    }
    
    return data;
}

uint8_t Memory::ReadByte(uint16_t address) const
{
    address &= 0xFFFF;
    const uint8_t value = this->buffer[address];
    
    if (const auto it = readHandlers.find(address); it != readHandlers.end())
    {
        it->second(value);
    }
    
    return value;
}

uint16_t Memory::ReadShort(uint16_t address) const
{
    address &= 0xFFFF;
    const uint16_t value = this->buffer[address] << 8 | this->buffer[address + 1];
    
    if (const auto it = readHandlers.find(address); it != readHandlers.end())
    {
        it->second(value);
    }
    
    return value;
}

uint32_t Memory::ReadInt(uint16_t address) const
{
    address &= 0xFFFF;
    
    const uint32_t value = this->buffer[address] << 24 | this->buffer[address + 1] << 16 | this->buffer[address + 2] << 8 | this->buffer[address + 3];
   
    if (const auto it = readHandlers.find(address); it != readHandlers.end())
    {
        it->second(value);
    }
    
    return value;
}

void Memory::WriteByte(uint16_t address, const uint8_t value) const
{
    this->buffer[address] = value;

    if (const auto it = writeHandlers.find(address); it != writeHandlers.end())
    {
        it->second(value);
    }
}

void Memory::WriteShort(uint16_t address, uint16_t value) const
{
    this->buffer[address] = value >> 8 & 0xFF;
    this->buffer[address + 1] = value & 0xFF;
    \
    if (const auto it = writeHandlers.find(address); it != writeHandlers.end())
    {
        it->second(value);
    }
}

void Memory::WriteInt(uint16_t address, uint32_t value) const
{
    this->buffer[address] = value >> 24 & 0xFF;
    this->buffer[address + 1] = value >> 16 & 0xFF;
    this->buffer[address + 2] = value >> 8 & 0xFF;
    this->buffer[address + 3] = value & 0xFF;
    
    if (const auto it = writeHandlers.find(address); it != writeHandlers.end())
    {
        it->second(value);
    }
}