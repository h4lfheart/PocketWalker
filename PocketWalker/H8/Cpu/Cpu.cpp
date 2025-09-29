#include "Cpu.h"
#include <print>

size_t Cpu::Step()
{
    size_t cycleCount = 1;
    
    if (registers->pc == 0x0000)
    {
        throw std::runtime_error("Program finished execution.");
    }

    opcodes->Update(registers->pc);
    
    PCHandlerResult handlerResult = Continue;
    if (addressHandlers.contains(registers->pc))
    {
        handlerResult = addressHandlers[registers->pc](this);
    }
    
    if (!sleeping && handlerResult != SkipInstruction)
    {
        const Instruction* instruction = instructions->Execute(this);
        cycleCount = instruction->cycles;
        instructionCount++;
    }

    return cycleCount;
}

void Cpu::UpdateInterrupts()
{
    interrupts->Update(this);
}

void Cpu::OnAddress(const uint16_t address, const PCHandler& handler)
{
    addressHandlers[address] = handler;
}
