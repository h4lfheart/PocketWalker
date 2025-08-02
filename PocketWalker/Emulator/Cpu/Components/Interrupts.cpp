#include "Interrupts.h"

#include "../Cpu.h"

void Interrupts::Update(Cpu* cpu)
{
    if (enable1 & InterruptFlags::ENABLE_IRQ0 && flag1 & InterruptFlags::FLAG_IRQ0)
    {
        Interrupt(cpu, cpu->vectorTable->irq0);
    }
    else if (enable1 & InterruptFlags::ENABLE_IRQ1 && flag1 & InterruptFlags::FLAG_IRQ1)
    {
        Interrupt(cpu, cpu->vectorTable->irq1);
    }
    else if (enable2 & InterruptFlags::ENABLE_TIMER_B1 && flag2 & InterruptFlags::FLAG_TIMER_B1)
    {
        Interrupt(cpu, cpu->vectorTable->timerB1);
    }
}

void Interrupts::Interrupt(Cpu* cpu, uint16_t address)
{
    savedAddress = cpu->registers->pc;
    savedFlags = cpu->flags->ccr;

    cpu->registers->pc = address;
    cpu->flags->interrupt = true;
    cpu->sleeping = false;
}
