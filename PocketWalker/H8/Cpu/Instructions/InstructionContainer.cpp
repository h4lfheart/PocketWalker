#include "InstructionContainer.h"

#include <format>
#include <stdexcept>
#include <print>
#include <queue>

#include "../Cpu.h"

Instruction* InstructionContainer::Execute(Cpu* cpu)
{
    const uint32_t firstValue = firstPredicate(cpu->opcodes);
    const uint32_t secondValue = secondPredicate(cpu->opcodes);

    Instruction* instruction = GetInstruction(firstValue, secondValue);
    if (instruction == nullptr) instruction = GetPatternInstruction(firstValue, secondValue);
    if (instruction == nullptr)
    {
        throw std::runtime_error(std::format("Instruction at 0x{:02X} with values 0x{:02X} and 0x{:02X} does not exist in table {}", cpu->registers->pc, firstValue, secondValue, tableName));
    }

    if (instruction->parentContainer != nullptr)
    {
        return instruction->parentContainer->Execute(cpu);
    }

    const uint16_t preExecuteLocation = cpu->registers->pc;
    if (instruction->execute != nullptr)
    {
        instruction->execute(cpu);
    }
    
    cpu->registers->pc += instruction->bytes;

    if (instruction->postExecute != nullptr)
    {
        instruction->postExecute(cpu);
    }

    //std::println("0x{:04X} {}", preExecuteLocation, instruction->name);
    
    return instruction;
}

void InstructionContainer::Register(const uint32_t first, const uint32_t second, const Instruction& instruction)
{
    if (!instructionTable.contains(first)) {
        instructionTable[first] = std::map<uint32_t, Instruction>();
    }
    instructionTable[first][second] = instruction;
}

void InstructionContainer::Register(uint32_t first, uint32_t second,InstructionContainer* container)
{
    Register(first, second, container->entryInstruction);
}

void InstructionContainer::Register(std::vector<uint32_t> first, std::vector<uint32_t> second, const Instruction& instruction)
{
    for (const uint8_t firstIndex : first)
    {
        for (const uint8_t secondIndex : second)
        {
            if (!instructionTable.contains(firstIndex)) {
                instructionTable[firstIndex] = std::map<uint32_t, Instruction>();
            }
            instructionTable[firstIndex][secondIndex] = instruction;
        }
    }
}

void InstructionContainer::Register(NumberMatch first, NumberMatch second, const Instruction& instruction)
{
    patternTable.push_back(PatternEntry(first, second, instruction));
}

Instruction* InstructionContainer::GetInstruction(uint32_t first, uint32_t second)
{
    const auto outer = instructionTable.find(first);
    if (outer == instructionTable.end()) return nullptr;

    const auto inner = outer->second.find(second);
    if (inner == outer->second.end()) return nullptr;

    return &inner->second;
}

Instruction* InstructionContainer::GetPatternInstruction(uint32_t first, uint32_t second)
{
    for (PatternEntry& entry : patternTable)
    {
        if (entry.firstMatch(first) && entry.secondMatch(second))
        {
            return &entry.instruction;
        }
    }
    
    return nullptr;
}
