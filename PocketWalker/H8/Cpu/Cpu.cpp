#include "Cpu.h"
#include <print>

size_t Cpu::Step()
{
    size_t cycleCount = 1;
    
    if (registers->pc == 0x0000)
    {
        throw std::runtime_error("Program finished execution.");
    }

    PCHandlerResult handlerResult = Continue;
    if (addressHandlers.contains(registers->pc))
    {
        handlerResult = addressHandlers[registers->pc](this);
    }
    
    if (!sleeping && handlerResult != SkipInstruction)
    {
        if (instructionCount % 10000 == 0)
            std::println("instr 0x{:04X}", registers->pc);
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

void Cpu::OnAddress(const uint16_t address, const PCHandler& handler)
{
    addressHandlers[address] = handler;
}
