#pragma once
#include <cstdint>

#include "Components/Opcode.h"
#include "Components/Registers.h"
#include "Components/Flags.h"
#include "Components/VectorTable.h"
#include "Instructions/InstructionTable.h"

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
        opcodes = new Opcode(ram);
        instructions = new InstructionTable();
        registers = new Registers(ram);
        vectorTable = new VectorTable(ram);
        flags = new Flags();

        registers->pc = vectorTable->reset;
    }

    size_t Step();

    Memory* ram;
    
    Opcode* opcodes;
    InstructionTable* instructions;
    VectorTable* vectorTable;
    Registers* registers;
    Flags* flags;

    bool sleeping = false;

    static constexpr uint32_t TICKS = 3686400;
};
