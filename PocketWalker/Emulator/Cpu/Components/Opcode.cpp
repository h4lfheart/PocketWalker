#include "Opcode.h"

#include "../../Board/Board.h"

Opcode::Opcode(Memory* ram) : ram(ram)
{
        
}

void Opcode::Update(const uint16_t address)
{
    a = ram->ReadByte(address);
    b = ram->ReadByte(address + 1);
    c = ram->ReadByte(address + 2);
    d = ram->ReadByte(address + 3);
    e = ram->ReadByte(address + 4);
    f = ram->ReadByte(address + 5);
    g = ram->ReadByte(address + 6);
    h = ram->ReadByte(address + 7);

    ab = a << 8 | b;
    cd = c << 8 | d;
    ef = e << 8 | f;
    gh = g << 8 | h;

    aH = a >> 4 & 0xF;
    aL = a & 0xF;
    
    bH = b >> 4 & 0xF;
    bL = b & 0xF;
    
    cH = c >> 4 & 0xF;
    cL = c & 0xF;
    
    dH = d >> 4 & 0xF;
    dL = d & 0xF;
    
    eH = e >> 4 & 0xF;
    eL = e & 0xF;
    
    fH = f >> 4 & 0xF;
    fL = f & 0xF;
    
    gH = g >> 4 & 0xF;
    gL = g & 0xF;
    
    hH = h >> 4 & 0xF;
    hL = h & 0xF;
}