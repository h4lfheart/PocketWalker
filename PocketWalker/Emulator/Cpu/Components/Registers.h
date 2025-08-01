#pragma once
#include <cstdlib>
#include <cstdint>

class Memory;
class Board;

class Registers
{
public:
    Registers(Memory* ram) : ram(ram)
    {
        this->buffer = new uint8_t[32]();
        
        this->sp = Register32(7);
    }

    uint8_t* Register8(const uint8_t control) const;

    uint16_t* Register16(const uint8_t control) const;

    uint32_t* Register32(const uint8_t control) const;

    void PushStack() const;
    uint16_t PopStack() const;

    uint16_t pc;
    uint32_t* sp;

private:
    alignas(uint32_t) uint8_t* buffer;
    
    Memory* ram;
};
