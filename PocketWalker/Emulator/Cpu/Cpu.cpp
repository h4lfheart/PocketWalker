#include "Cpu.h"
#include <print>

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

    // TODO proper interrupt for accelerometer
    if (registers->pc == 0x7700) // accelerometer sleep
    {
        this->registers->pc += 2;
        return cycleCount;
    }
    
    if (registers->pc == 0x8EE) // hacky fix for ir sending
    {
        this->registers->pc += 2;
        return cycleCount;
    }

    // remove input
    if (registers->pc == 0x9C3E)
    {
        if (ram->ReadByte(0xFFDE) != 0)
        {
            ram->WriteByte(0xFFDE, 0);
        }
    }

    // add watts
    if (registers->pc == 0x9A4E)
    {
        if (ram->ReadShort(0xF78E) == 0)
        {
            ram->WriteShort(0xF78E, 0xFFFF);
        }
    }
    
    if (!sleeping)
    {
        const Instruction* instruction = instructions->Execute(this);
        cycleCount = instruction->cycles;
        instructionCount++;
    }

    if (!flags->interrupt)
    {
        interrupts->Update(this);
    }

    return cycleCount;
}
