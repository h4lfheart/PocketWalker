#include "Opcode.h"

#include "../../Board/Board.h"

Opcode::Opcode(Memory* ram) : ram(ram), currentAddress(0)
{
    for (bool& validFlag : validFlags)
    {
        validFlag = false;
    }
}

void Opcode::Update(const uint16_t address)
{
    currentAddress = address;
    
    for (bool& validFlag : validFlags)
    {
        validFlag = false;
    }
}

uint8_t Opcode::get_byte(int index) const
{
    if (!validFlags[index]) {
        cacheBytes[index] = ram->ReadByte(currentAddress + index);
        validFlags[index] = true;
    }
    return cacheBytes[index];
}

uint8_t Opcode::a() const { return get_byte(0); }
uint8_t Opcode::b() const { return get_byte(1); }
uint8_t Opcode::c() const { return get_byte(2); }
uint8_t Opcode::d() const { return get_byte(3); }
uint8_t Opcode::e() const { return get_byte(4); }
uint8_t Opcode::f() const { return get_byte(5); }
uint8_t Opcode::g() const { return get_byte(6); }
uint8_t Opcode::h() const { return get_byte(7); }

uint16_t Opcode::ab() const { return static_cast<uint16_t>(get_byte(0)) << 8 | get_byte(1); }
uint16_t Opcode::cd() const { return static_cast<uint16_t>(get_byte(2)) << 8 | get_byte(3); }
uint16_t Opcode::ef() const { return static_cast<uint16_t>(get_byte(4)) << 8 | get_byte(5); }
uint16_t Opcode::gh() const { return static_cast<uint16_t>(get_byte(6)) << 8 | get_byte(7); }

uint8_t Opcode::aH() const { return get_byte(0) >> 4 & 0xF; }
uint8_t Opcode::bH() const { return get_byte(1) >> 4 & 0xF; }
uint8_t Opcode::cH() const { return get_byte(2) >> 4 & 0xF; }
uint8_t Opcode::dH() const { return get_byte(3) >> 4 & 0xF; }
uint8_t Opcode::eH() const { return get_byte(4) >> 4 & 0xF; }
uint8_t Opcode::fH() const { return get_byte(5) >> 4 & 0xF; }
uint8_t Opcode::gH() const { return get_byte(6) >> 4 & 0xF; }
uint8_t Opcode::hH() const { return get_byte(7) >> 4 & 0xF; }

uint8_t Opcode::aL() const { return get_byte(0) & 0xF; }
uint8_t Opcode::bL() const { return get_byte(1) & 0xF; }
uint8_t Opcode::cL() const { return get_byte(2) & 0xF; }
uint8_t Opcode::dL() const { return get_byte(3) & 0xF; }
uint8_t Opcode::eL() const { return get_byte(4) & 0xF; }
uint8_t Opcode::fL() const { return get_byte(5) & 0xF; }
uint8_t Opcode::gL() const { return get_byte(6) & 0xF; }
uint8_t Opcode::hL() const { return get_byte(7) & 0xF; }