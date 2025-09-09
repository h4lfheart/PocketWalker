#pragma once
#include <cstdint>

class Memory;

class Opcode
{
public:
    Opcode(Memory* ram);

    void Update(uint16_t address);
    
    uint8_t a() const;
    uint8_t b() const;
    uint8_t c() const;
    uint8_t d() const;
    uint8_t e() const;
    uint8_t f() const;
    uint8_t g() const;
    uint8_t h() const;
    
    uint16_t ab() const;
    uint16_t cd() const;
    uint16_t ef() const;
    uint16_t gh() const;
    
    uint8_t aH() const;
    uint8_t aL() const;
    uint8_t bH() const;
    uint8_t bL() const;
    uint8_t cH() const;
    uint8_t cL() const;
    uint8_t dH() const;
    uint8_t dL() const;
    uint8_t eH() const;
    uint8_t eL() const;
    uint8_t fH() const;
    uint8_t fL() const;
    uint8_t gH() const;
    uint8_t gL() const;
    uint8_t hH() const;
    uint8_t hL() const;
    
private:
    Memory* ram;
    uint16_t currentAddress;
    
    mutable uint8_t cacheBytes[8];
    mutable bool validFlags[8];
    
    uint8_t get_byte(int index) const;
};