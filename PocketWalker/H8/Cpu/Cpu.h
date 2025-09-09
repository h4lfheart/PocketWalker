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

enum PCHandlerResult : uint8_t
{
    Continue,
    SkipInstruction
};

using PCHandler = std::function<PCHandlerResult(Cpu*)>;

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
    void UpdateInterrupts();
    void OnAddress(uint16_t address, const PCHandler& handler);

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

private:
    std::map<uint16_t, PCHandler> addressHandlers;
};
