#pragma once
#include <cstdint>

#include "../Instructions/Instruction.h"


class Memory;

class Opcode
{
public:
    Opcode(Memory* ram);

    void Update(uint16_t address);
    
    uint16_t ab, cd, ef, gh;
    uint8_t a, b, c, d, e, f, g, h;
    uint8_t aH, aL, bH, bL, cH, cL, dH, dL, eH, eL, fH, fL, gH, gL, hH, hL;
    
private:
    Memory* ram;
};
