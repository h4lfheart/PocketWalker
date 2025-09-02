#pragma once
#include <functional>
#include <map>
#include <string>

#include "Instruction.h"

class Opcode;
using OpcodeMatch = std::function<uint32_t(Opcode*)>;
using NumberMatch = std::function<uint32_t(uint32_t)>;

struct PatternEntry
{
    NumberMatch firstMatch;
    NumberMatch secondMatch;
    Instruction instruction;
};

class InstructionContainer
{
public:
    std::string tableName;
    Instruction entryInstruction;

    OpcodeMatch firstPredicate;
    OpcodeMatch secondPredicate;

    InstructionContainer() = default;
    InstructionContainer(const std::string& name, const OpcodeMatch& firstPredicate, const OpcodeMatch& secondPredicate)
        : tableName(name), firstPredicate(firstPredicate), secondPredicate(secondPredicate)
    {
        entryInstruction = Instruction(tableName, 0, 0, nullptr, nullptr, this);
    }

    InstructionContainer(const std::string& name, const OpcodeMatch& firstPredicate, const OpcodeMatch& secondPredicate, std::function<void(InstructionContainer*)> setup)
       : tableName(name), firstPredicate(firstPredicate), secondPredicate(secondPredicate)
    {
        entryInstruction = Instruction(tableName, 0, 0, nullptr, nullptr, this);

        setup(this);
    }

    Instruction* Execute(Cpu* cpu);

    void Register(uint32_t first, uint32_t second, const Instruction& instruction);
    void Register(uint32_t first, uint32_t second, InstructionContainer* container);
    void Register(std::vector<uint32_t> first, std::vector<uint32_t> second, const Instruction& instruction);
    void Register(NumberMatch first, NumberMatch second, const Instruction& instruction);

    Instruction* GetInstruction(uint32_t first, uint32_t second);
    Instruction* GetPatternInstruction(uint32_t first, uint32_t second);

private:
    std::map<uint32_t, std::map<uint32_t, Instruction>> instructionTable;
    std::vector<PatternEntry> patternTable;
    
};
