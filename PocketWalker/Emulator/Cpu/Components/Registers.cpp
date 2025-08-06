#include "Registers.h"

#include <print>

#include "../../Memory/Memory.h"

uint8_t* Registers::Register8(const uint8_t control) const
{
    const uint8_t regIndex = control & 0b111;
    const uint8_t offset = ~(control >> 3) & 1;
    return &this->buffer[regIndex * 4 + offset];
}

uint16_t* Registers::Register16(const uint8_t control) const
{
    const uint8_t regIndex = control & 0b111;
    const uint8_t offset = control >> 3 & 1;
    return &reinterpret_cast<uint16_t*>(this->buffer)[regIndex * 2 + offset];
}

uint32_t* Registers::Register32(const uint8_t control) const
{
    const uint8_t regIndex = control & 0b111;
    return &reinterpret_cast<uint32_t*>(this->buffer)[regIndex];
}

void Registers::PushStack() const
{
    
    *sp -= 2;
    ram->WriteShort(*sp, pc);
}

uint16_t Registers::PopStack() const
{
    const uint16_t addr = ram->ReadShort(*sp);
    *sp += 2;
    return addr;
}
