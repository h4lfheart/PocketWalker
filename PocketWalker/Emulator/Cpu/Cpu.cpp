#include "Cpu.h"

size_t Cpu::Step()
{
    size_t cycleCount = 1;

    // TODO pc handlers
    if (registers->pc == 0x336) // factory tests
    {
        this->registers->pc += 4;
        return cycleCount;
    }

    if (registers->pc == 0x350) // battery check
    {
        this->registers->pc += 4;
        *this->registers->Register8(0b1000) = 0;
        return cycleCount;
    }
    
    if (!sleeping)
    {
        const Instruction* instruction = instructions->Execute(this);
        cycleCount = instruction->cycles;
    }

    return cycleCount;
}
