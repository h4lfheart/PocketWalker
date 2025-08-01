#pragma once
#include <functional>
#include <string>

class InstructionContainer;
class Cpu;

using InstructionExecute = std::function<void(Cpu*)>;

struct Instruction
{
    std::string name;
    size_t bytes;
    size_t cycles;
    InstructionExecute execute;
    InstructionExecute postExecute;
    InstructionContainer* parentContainer;

    Instruction() = default;
    Instruction(const std::string& name, const int bytes, const int cycles, const InstructionExecute& execute, const InstructionExecute& postExecute = nullptr, InstructionContainer* parentContainer = nullptr)
        : name(name), bytes(bytes), cycles(cycles), execute(execute), postExecute(postExecute), parentContainer(parentContainer) { }
};
