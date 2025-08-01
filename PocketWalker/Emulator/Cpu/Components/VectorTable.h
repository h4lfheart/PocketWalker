#pragma once
#include "../../Memory/Memory.h"

class VectorTable
{
public:
    VectorTable(Memory* ram) : ram(ram)
    {
        reset = ram->ReadShort(0x0000);
    }

    uint16_t reset;

private:
    Memory* ram;
};
