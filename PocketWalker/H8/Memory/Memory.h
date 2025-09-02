#pragma once
#include <cstdint>
#include <functional>
#include <string>

#include "MemoryAccessor.h"

using MemoryHandler = std::function<void(uint32_t)>;

class Memory
{
public:
    Memory(uint8_t* buffer) 
    {
        this->buffer = buffer;
    }

    Memory(size_t size) 
    {
        this->buffer = new uint8_t[size]();
    }
    
    void OnRead(uint16_t address, const MemoryHandler& onRead)
    {
        readHandlers[address] = onRead;
    }
    
    void OnWrite(uint16_t address, const MemoryHandler& onWrite)
    {
        writeHandlers[address] = onWrite;
    }

    template<typename T>
    MemoryAccessor<T> CreateAccessor(uint16_t address) {
        return MemoryAccessor<T>(this, address);
    }

    std::string ReadString(uint16_t address, size_t size);
    uint8_t ReadByte(uint16_t address) const;
    uint16_t ReadShort(uint16_t address) const;
    uint32_t ReadInt(uint16_t address) const;
    
    void WriteByte(uint16_t address, uint8_t value) const;
    void WriteShort(uint16_t address, uint16_t value) const;
    void WriteInt(uint16_t address, uint32_t value) const;

    std::string name = "Memory";
    uint8_t* buffer;

private:
    std::unordered_map<uint16_t, MemoryHandler> readHandlers;
    std::unordered_map<uint16_t, MemoryHandler> writeHandlers;
};
