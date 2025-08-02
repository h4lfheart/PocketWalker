#pragma once
#include <cstdint>

#include "Components/Opcode.h"
#include "Components/Registers.h"
#include "Components/Flags.h"
#include "Components/VectorTable.h"
#include "Components/Interrupts.h"
#include "Instructions/InstructionTable.h"

class Interrupts;
class Memory;
class Board;

class Opcode;
class Registers;
class Flags;

using PCHandler = std::function<void>;

class Cpu
{
public:
    Cpu(Memory* ram) : ram(ram)
    {
        instructions = new InstructionTable();
        opcodes = new Opcode(ram);
        registers = new Registers(ram);
        vectorTable = new VectorTable(ram);
        interrupts = new Interrupts(ram);
        flags = new Flags();

        registers->pc = vectorTable->reset;
    }

    size_t Step();

    Memory* ram;
    
    Opcode* opcodes;
    InstructionTable* instructions;
    VectorTable* vectorTable;
    Interrupts* interrupts;
    Registers* registers;
    Flags* flags;

    size_t instructionCount;
    bool sleeping = false;

    static constexpr uint32_t TICKS = 3686400;
};
