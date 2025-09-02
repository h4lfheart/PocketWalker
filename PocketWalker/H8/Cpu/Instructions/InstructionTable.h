#pragma once
#include "InstructionContainer.h"

class InstructionTable
{
public:
    InstructionTable();

    Instruction* Execute(Cpu* cpu);

private:
    InstructionContainer aH_aL;
    InstructionContainer aHaL_bH;
    InstructionContainer aHaLbHbLcH_cL;
};
