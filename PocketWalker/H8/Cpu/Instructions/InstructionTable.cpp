#include "InstructionTable.h"

#include <format>
#include <stdexcept>
#include <print>

#include "../Components/Opcode.h"
#include "../Cpu.h"

InstructionTable::InstructionTable() :
    aH_aL(InstructionContainer("aH/aL",
        [](const Opcode* opcode) { return opcode->aH(); },
        [](const Opcode* opcode) { return opcode->aL(); })),
    aHaL_bH(InstructionContainer("aHaL/bH",
            [](const Opcode* opcode) { return opcode->a(); },
            [](const Opcode* opcode) { return opcode->bH(); })),
    aHaLbHbLcH_cL(InstructionContainer("aHaLbHbLcH/cL",
            [](const Opcode* opcode) { return opcode->a() << 12 | opcode->b() << 4 | opcode->cH(); },
            [](const Opcode* opcode) { return opcode->cL(); }))
{

    aH_aL.Register({0x0}, {0x1, 0xA, 0xB, 0xF}, aHaL_bH.entryInstruction);
    aH_aL.Register({0x1}, {0x0, 0x1, 0x2, 0x3, 0x7, 0xA, 0xB, 0xF}, aHaL_bH.entryInstruction);
    aH_aL.Register(0x5, 0x8, aHaL_bH.entryInstruction);
    aH_aL.Register({0x7}, {0x9, 0xA}, aHaL_bH.entryInstruction);
    
    aH_aL.Register({0x7}, {0xC, 0xD, 0xE, 0xF}, aHaLbHbLcH_cL.entryInstruction);
    
    aHaL_bH.Register({0x1}, {0xC, 0xD, 0xF}, aHaLbHbLcH_cL.entryInstruction);

    aH_aL.Register(0x0, 0x0, Instruction(
                       "NOP",
                       2,
                       1,
                       [](const Cpu* cpu){ }
                   ));

    aH_aL.Register(0x0, 0x8, Instruction(
                       "ADD.B Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bH());
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
            
                           cpu->flags->Add(*rd, *rs);

                           *rd += *rs;
                       }
                   ));

    aH_aL.Register(0x0, 0x7, Instruction(
                       "LDC.B #xx:8, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t imm = cpu->opcodes->b();
                           cpu->flags->ccr = imm;
                       }
                   ));

    aH_aL.Register(0x0, 0x9, Instruction(
                       "ADD.W Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bH());
                           uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
            
                           cpu->flags->Add(*rd, *rs);

                           *rd += *rs;
                       }
                   ));

    aH_aL.Register(0x0, 0xC, Instruction(
                       "MOV.B Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bH());
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());

                           *rd = *rs;
                           cpu->flags->Mov(*rd);
                       }
                   ));

    aH_aL.Register(0x0, 0xD, Instruction(
                       "MOV.W Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bH());
                           uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
            
                           *rd = *rs;
                           cpu->flags->Mov(*rd);
                       }
                   ));
    
    aH_aL.Register(0x1, 0x4, Instruction(
                       "OR.B Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bH());
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
            
                           *rd |= *rs;

                           cpu->flags->Mov(*rd);
                       }
                   ));
    
    aH_aL.Register(0x1, 0x5, Instruction(
                       "XOR.B Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bH());
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
            
                           *rd ^= *rs;
            
                           cpu->flags->Mov(*rd);
                       }
                   ));
    
    aH_aL.Register(0x1, 0x6, Instruction(
                       "AND.B Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bH());
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
            
                           *rd &= *rs;
            
                           cpu->flags->Mov(*rd);
                       }
                   ));
    
    aH_aL.Register(0x1, 0x8, Instruction(
                       "SUB.B Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bH());
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
                           cpu->flags->Sub(*rd, *rs);

                           *rd -= *rs;
                       }
                   ));
    
    aH_aL.Register(0x1, 0x9, Instruction(
                       "SUB.W Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bH());
                           uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
                           cpu->flags->Sub(*rd, *rs);

                           *rd -= *rs;
                       }
                   ));

    aH_aL.Register(0x1, 0xC, Instruction(
                       "CMP.B Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bH());
                           const uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());

                           cpu->flags->Sub(*rd, *rs);
                       }
                   ));

    aH_aL.Register(0x1, 0xD, Instruction(
                       "CMP.W Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bH());
                           const uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                           cpu->flags->Sub(*rd, *rs);
                       }
                   ));

    aH_aL.Register(0x1, 0xE, Instruction(
                       "SUBX Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bH());
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());

                           cpu->flags->Sub(*rd, static_cast<uint8_t>(*rs + cpu->flags->carry));
            
                           *rd -= *rs + cpu->flags->carry;
                       }
                   ));
    
    aH_aL.Register({0x2}, {0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 0xF}, Instruction(
                       "MOV.B @aa:8, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->aL());
                           const uint16_t address = cpu->opcodes->b() | 0xFF00;

                           *rd = cpu->ram->ReadByte(address);
           
                           cpu->flags->Mov(*rd);
                       }
                   ));
    
    aH_aL.Register({0x3}, {0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 0xF}, Instruction(
                       "MOV.B Rs, @aa:8",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->aL());
                           const uint16_t address = cpu->opcodes->b() | 0xFF00;

                           cpu->ram->WriteByte(address, *rs);
                           cpu->flags->Mov(*rs);
                       }
                   ));

    aH_aL.Register(0x4, 0x0, Instruction(
                       "BRA d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           cpu->registers->pc += disp;
                       }
                   ));

    aH_aL.Register(0x4, 0x2, Instruction(
                       "BHI d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           if (!(cpu->flags->carry || cpu->flags->zero))
                               cpu->registers->pc += disp;
                       }
                   ));

    aH_aL.Register(0x4, 0x3, Instruction(
                       "BLS d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           if (cpu->flags->carry || cpu->flags->zero)
                               cpu->registers->pc += disp;
                       }
                   ));

    aH_aL.Register(0x4, 0x4, Instruction(
                       "BCC d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           if (!cpu->flags->carry)
                               cpu->registers->pc += disp;
                       }
                   ));

    aH_aL.Register(0x4, 0x5, Instruction(
                       "BCS d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           if (cpu->flags->carry)
                               cpu->registers->pc += disp;
                       }
                   ));

    aH_aL.Register(0x4, 0x6, Instruction(
                       "BNE d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           if (!cpu->flags->zero)
                               cpu->registers->pc += disp;
                       }
                   ));
    
    aH_aL.Register(0x4, 0x7, Instruction(
                       "BEQ d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           if (cpu->flags->zero)
                               cpu->registers->pc += disp;
                       }
                   ));
    
    aH_aL.Register(0x4, 0xA, Instruction(
                       "BPL d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           if (!cpu->flags->negative)
                               cpu->registers->pc += disp;
                       }
                   ));
    
    aH_aL.Register(0x4, 0xB, Instruction(
                       "BMI d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           if (cpu->flags->negative)
                               cpu->registers->pc += disp;
                       }
                   ));
    
    aH_aL.Register(0x4, 0xC, Instruction(
                       "BGE d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           if (cpu->flags->negative == cpu->flags->overflow)
                               cpu->registers->pc += disp;
                       }
                   ));
    
    aH_aL.Register(0x4, 0xD, Instruction(
                       "BLT d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           if (cpu->flags->negative != cpu->flags->overflow)
                               cpu->registers->pc += disp;
                       }
                   ));
    
    aH_aL.Register(0x4, 0xE, Instruction(
                       "BGT d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           if (!(cpu->flags->zero || (cpu->flags->negative != cpu->flags->overflow)))
                               cpu->registers->pc += disp;
                       }
                   ));
    
    aH_aL.Register(0x4, 0xF, Instruction(
                       "BLE d:8",
                       2,
                       2,
                       [](const Cpu* cpu)
                       {
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           if (cpu->flags->zero || (cpu->flags->negative != cpu->flags->overflow))
                               cpu->registers->pc += disp;
                       }
                   ));
    
    aH_aL.Register(0x5, 0x0, Instruction(
                       "MULXU.B Rs, Rd",
                       2,
                       1 + 12,
                       [](const Cpu* cpu)
                       {
                           uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bH());
                           uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                           *rd = (*rd & 0xFF) * *rs;
           
                       }
                   ));
    
    aH_aL.Register(0x5, 0x1, Instruction(
                       "DIVXU.B Rs, Rd",
                       2,
                       1 + 12,
                       [](const Cpu* cpu)
                       {
                           const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bH());
                           uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                           const uint16_t quotient = *rd / *rs;
                           const uint16_t remainder = *rd % *rs;

                           *rd = (remainder << 8) | quotient;

                           cpu->flags->zero = quotient == 0;
                           cpu->flags->negative = quotient & Flags::NegativeMask(8);
           
                       }
                   ));
    
    aH_aL.Register(0x5, 0x2, Instruction(
                       "MULXU.W Rs, ERd",
                       2,
                       1 + 20,
                       [](const Cpu* cpu)
                       {
                           const uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bH());
                           uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());

                           *erd = (*erd & 0xFFFF) * (*rs);
           
                       }
                   ));
    
    aH_aL.Register(0x5, 0x3, Instruction(
                       "DIVXU.W Rs, ERd",
                       2,
                       1 + 20,
                       [](const Cpu* cpu)
                       {
                           uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bH());
                           uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());

                           const uint32_t quotient = *erd / *rs;
                           const uint32_t remainder = *erd % *rs;

                           *erd = (remainder << 16) | quotient;

                           cpu->flags->zero = quotient == 0;
                           cpu->flags->negative = quotient & Flags::NegativeMask(16);
           
                       }
                   ));

    aH_aL.Register(0x5, 0x4, Instruction(
                       "RTS",
                       2,
                       2 + 1 + 2,
                       nullptr,
                       [](const Cpu* cpu)
                       {
                           cpu->registers->pc = cpu->registers->PopStack();
                       }
                   ));
    
    aH_aL.Register(0x5, 0x5, Instruction(
                       "BSR d:8",
                       2,
                       2 + 1,
                       nullptr,
                       [](const Cpu* cpu)
                       {
                           cpu->registers->PushStack();
            
                           const int8_t disp = static_cast<int8_t>(cpu->opcodes->b());
                           cpu->registers->pc += disp;
                       }
                   ));

    aH_aL.Register(0x5, 0x6, Instruction(
                       "RTE",
                       2,
                       2 + 2 + 2,
                       nullptr,
                       [](const Cpu* cpu)
                       {
                           cpu->registers->pc = cpu->interrupts->savedAddress;
                           cpu->flags->ccr = cpu->interrupts->savedFlags;
                       }
                   ));
    
    
    aH_aL.Register(0x5, 0x9, Instruction(
                       "JMP @ERn",
                       2,
                       2 + 2,
                       nullptr,
                       [](const Cpu* cpu)
                       {
                           const uint32_t* ern = cpu->registers->Register32(cpu->opcodes->bH());
                           cpu->registers->pc = *ern & 0xFFFF;
                       }   
                   ));
    
    aH_aL.Register(0x5, 0xA, Instruction(
                       "JMP @aa:24",
                       4,
                       2 + 2,
                       nullptr,
                       [](const Cpu* cpu)
                       {
                           const uint32_t address = (cpu->opcodes->b() << 16) | cpu->opcodes->cd();
                           cpu->registers->pc = address;
                       }
                   ));
    
    aH_aL.Register(0x5, 0xD, Instruction(
                       "JSR @ERn",
                       2,
                       2 + 1,
                       nullptr,
                       [](const Cpu* cpu)
                       {
                           cpu->registers->PushStack();
            
                           const uint32_t* ern = cpu->registers->Register32(cpu->opcodes->bH());
                           cpu->registers->pc = *ern & 0xFFFF;
                       }
                   ));
    
    aH_aL.Register(0x5, 0xE, Instruction(
                       "JSR @aa:24",
                       4,
                       2 + 1 + 2,
                       nullptr,
                       [](const Cpu* cpu)
                       {
                           cpu->registers->PushStack();
            
                           const uint32_t address = (cpu->opcodes->b() << 16) | cpu->opcodes->cd();
                           cpu->registers->pc = address;
                       }
                   ));

    aH_aL.Register(0x6, 0x4, Instruction(
                       "OR.W Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bH());
                           uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                           *rd |= *rs;

                           cpu->flags->Mov(*rd);
                       }
                   ));
    
    aH_aL.Register(0x6, 0x0, Instruction(
                       "BSET Rn, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           uint8_t* rn = cpu->registers->Register8(cpu->opcodes->bH());
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());

                           *rd |= 1 << *rn;
                       }
                   ));

    aH_aL.Register(0x6, 0x5, Instruction(
                       "XOR.W Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bH());
                           uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                           *rd ^= *rs;

                           cpu->flags->Mov(*rd);
                       }
                   ));

    aH_aL.Register(0x6, 0x6, Instruction(
                       "AND.W Rs, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bH());
                           uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                           *rd &= *rs;

                           cpu->flags->Mov(*rd);
                       }
                   ));

    aH_aL.Register(0x6, 0x7, Instruction(
                       "BST #xx:3, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t imm = cpu->opcodes->bH() & 0b111;
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());

                           bool isOne = cpu->flags->carry;
            
                           const bool isInverted = cpu->opcodes->bH() & 0b1000;
                           if (isInverted)
                           {
                               isOne = !isOne;
                           }
            
                           if (isOne)
                           {
                               *rd |= (1 << imm);
                           }
                           else
                           {
                               *rd &= ~(1 << imm);
                           }
                       }
                   ));
    
    
    aH_aL.Register(0x6, 0x8, new InstructionContainer(
        "MOV.B @ERs, Rd / MOV.B Rs, @ERd",
        [](const Opcode* opcode) { return opcode->bH() >> 3 & 1; },
        [](const Opcode*) { return 0; },
        [](InstructionContainer* container)
        {
            container->Register(true, 0, Instruction(
                                    "MOV.B Rs, @ERd",
                                    2,
                                    1 + 1,
                                    [](const Cpu* cpu)
                                    {
                                        uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bL());
                                        uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bH());

                                        cpu->ram->WriteByte(*erd, *rs);
                                        cpu->flags->Mov(*rs);
                                    }
                                ));

            container->Register(false, 0, Instruction(
                                    "MOV.B @ERs, Rd",
                                    2,
                                    1 + 1,
                                    [](const Cpu* cpu)
                                    {
                                        uint32_t* ers = cpu->registers->Register32(cpu->opcodes->bH());
                                        uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
                                        *rd = cpu->ram->ReadByte(*ers);

                                        cpu->flags->Mov(*rd);
                                    }
                                ));
        })
    );

    
    aH_aL.Register(0x6, 0x9, new InstructionContainer(
        "MOV.W @ERs, Rd / MOV.W Rs, @ERd",
        [](const Opcode* opcode) { return opcode->bH() >> 3 & 1; },
        [](const Opcode*) { return 0; },
        [](InstructionContainer* container)
        {
            container->Register(true, 0, Instruction(
                                    "MOV.W Rs, @ERd",
                                    2,
                                    1 + 1,
                                    [](const Cpu* cpu)
                                    {
                                        uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bL());
                                        uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bH());

                                        cpu->ram->WriteShort(*erd, *rs);
                                        cpu->flags->Mov(*rs);
                                    }
                                ));

            container->Register(false, 0, Instruction(
                                    "MOV.W @ERs, Rd",
                                    2,
                                    1 + 1,
                                    [](const Cpu* cpu)
                                    {
                                        uint32_t* ers = cpu->registers->Register32(cpu->opcodes->bH());
                                        uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
                                        *rd = cpu->ram->ReadShort(*ers);

                                        cpu->flags->Mov(*rd);
                                    }
                                ));
        })
    );

    aH_aL.Register(0x6, 0xA, new InstructionContainer(
            "MOV.B Rs, @aa:16/24 / MOV.B @aa:16/24, Rd",
            [](const Opcode* opcode) { return opcode->a(); },
        [](const Opcode* opcode) { return opcode->bH(); },
        [](InstructionContainer* container)
        {
            container->Register(0x6A, 0x0, Instruction(
                                    "MOV.B @aa:16, Rd",
                                    4,
                                    2+1,
                                    [](const Cpu* cpu)
                                    {
                                        uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
                                        const uint16_t address = cpu->opcodes->cd();
                    
                                        *rd = cpu->ram->ReadByte(address);

                                        cpu->flags->Mov(*rd);
                                    }
                                ));

            container->Register(0x6A, 0x2, Instruction(
                                    "MOV.B @aa:24, Rd",
                                    4,
                                    2+1,
                                    [](const Cpu* cpu)
                                    {
                                        uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
                                        const uint32_t address = (cpu->opcodes->cd() << 16) | cpu->opcodes->ef();
                    
                                        *rd = cpu->ram->ReadByte(address);

                                        cpu->flags->Mov(*rd);
                                    }
                                ));
            
            container->Register(0x6A, 0x8, Instruction(
                                    "MOV.B Rs, @aa:16",
                                    4,
                                    2+1,
                                    [](const Cpu* cpu)
                                    {
                                        const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bL());
                                        const uint16_t address = cpu->opcodes->cd();
                                        cpu->ram->WriteByte(address, *rs);


                                        cpu->flags->Mov(*rs);
                                    }
                                ));
            
            container->Register(0x6A, 0xA, Instruction(
                                    "MOV.B Rs, @aa:24",
                                    4,
                                    2+1,
                                    [](const Cpu* cpu)
                                    {
                                        const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bL());
                                        const uint32_t address = (cpu->opcodes->cd() << 16) | cpu->opcodes->ef();
                                        cpu->ram->WriteByte(address, *rs);
                   
                                        cpu->flags->Mov(*rs);
                                    }
                                )); 
        })
    );

    aH_aL.Register(0x6, 0xB, new InstructionContainer(
            "MOV.W Rs, @aa:16/24 / MOV.W @aa:16/24, Rd",
            [](const Opcode* opcode) { return opcode->a(); },
        [](const Opcode* opcode) { return opcode->bH(); },
        [](InstructionContainer* container)
        {
            container->Register(0x6B, 0x0, Instruction(
                                    "MOV.W @aa:16, Rd",
                                    4,
                                    2+1,
                                    [](const Cpu* cpu)
                                    {
                                        uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
                                        const uint16_t address = cpu->opcodes->cd();
                    
                                        *rd = cpu->ram->ReadShort(address);

                                        cpu->flags->Mov(*rd);
                                    }
                                ));

            container->Register(0x6B, 0x2, Instruction(
                                    "MOV.W @aa:24, Rd",
                                    4,
                                    2+1,
                                    [](const Cpu* cpu)
                                    {
                                        uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
                                        const uint32_t address = (cpu->opcodes->cd() << 16) | cpu->opcodes->ef();

                                        *rd = cpu->ram->ReadShort(address);

                                        cpu->flags->Mov(*rd);
                                    }
                                ));
            
            container->Register(0x6B, 0x8, Instruction(
                                    "MOV.W Rs, @aa:16",
                                    4,
                                    2+1,
                                    [](const Cpu* cpu)
                                    {
                                        const uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bL());
                                        const uint16_t address = cpu->opcodes->cd();
                                        cpu->ram->WriteShort(address, *rs);

                                        cpu->flags->Mov(*rs);
                                    }
                                ));
            
            container->Register(0x6B, 0xA, Instruction(
                                    "MOV.W Rs, @aa:24",
                                    4,
                                    2+1,
                                    [](const Cpu* cpu)
                                    {
                                        const uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bL());
                                        const uint32_t address = cpu->opcodes->cd() << 16 | cpu->opcodes->ef();
                                        cpu->ram->WriteShort(address, *rs);
                   
                                        cpu->flags->Mov(*rs);
                                    }
                                )); 
        })
    );

    aH_aL.Register(0x6, 0xC, new InstructionContainer(
        "MOV.B @ERs+, Rd / MOV.B Rs, @-ERd",
        [](const Opcode* opcode) { return opcode->bH() >> 3 & 1; },
        [](const Opcode* opcode) { return 0; },
        [](InstructionContainer* container)
        {
            container->Register(true, 0, Instruction(
                                    "MOV.B Rs, @-ERd",
                                    2,
                                    1 + 1 + 2,
                                    [](const Cpu* cpu)
                                    {
                                        const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bL());
                                        uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bH());

                                        *erd -= 1;

                                        cpu->ram->WriteByte(*erd, *rs);
                                        cpu->flags->Mov(*rs);
                                    }
                                ));

            container->Register(false, 0, Instruction(
                                    "MOV.B @ERs+, Rd",
                                    2,
                                    1 + 1 + 2,
                                    [](const Cpu* cpu)
                                    {
                                        uint32_t* ers = cpu->registers->Register32(cpu->opcodes->bH());
                                        uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
                    
                                        *rd = cpu->ram->ReadByte(*ers);
                                        *ers += 1;

                                        cpu->flags->Mov(*rd);
                                    }
                                ));
        })
    );

    aH_aL.Register(0x6, 0xD, new InstructionContainer(
        "MOV.W @ERs+, Rd / MOV.W Rs, @-ERd",
        [](const Opcode* opcode) { return opcode->a(); },
        [](const Opcode* opcode) { return opcode->bH() >> 3 & 1; },
        [](InstructionContainer* container)
        {
            container->Register(0x6D, true, Instruction(
                                    "MOV.W Rs, @-ERd",
                                    2,
                                    1 + 1 + 2,
                                    [](const Cpu* cpu)
                                    {
                                        const uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bL());
                                        uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bH());

                                        *erd -= 2;

                                        cpu->ram->WriteShort(*erd, *rs);
                                        cpu->flags->Mov(*rs);
                                    }
                                ));

            container->Register(0x6D, false, Instruction(
                                    "MOV.W @ERs+, Rd",
                                    2,
                                    1 + 1 + 2,
                                    [](const Cpu* cpu)
                                    {
                                        uint32_t* ers = cpu->registers->Register32(cpu->opcodes->bH());
                                        uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
                    
                                        *rd = cpu->ram->ReadShort(*ers);
                                        *ers += 2;
                    
                                        cpu->flags->Mov(*rd);
                                    }
                                ));
        })
    );

    aH_aL.Register(0x6, 0xE, new InstructionContainer(
        "MOV.B @(d:16, ERs), Rd / MOV.B Rs, @(d:16, ERd)",
        [](const Opcode* opcode) { return opcode->bH() >> 3 & 1; },
        [](const Opcode*) { return 0; },
        [](InstructionContainer* container)
        {
            container->Register(true, 0, Instruction(
                                    "MOV.B Rs, @(d:16,ERd)",
                                    4,
                                    2 + 1,
                                    [](const Cpu* cpu)
                                    {
                                        const int16_t disp = cpu->opcodes->cd();
                    
                                        const uint8_t* rs = cpu->registers->Register8(cpu->opcodes->bL());
                                        uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bH());

                                        cpu->ram->WriteByte(*erd + disp, *rs);

                                        cpu->flags->Mov(*rs);
                                    }
                                ));

            container->Register(false, 0, Instruction(
                                    "MOV.B @(d:16,ERs), Rd ",
                                    4,
                                    2 + 1,
                                    [](const Cpu* cpu)
                                    {
                                        const int16_t disp = cpu->opcodes->cd();

                                        uint32_t* ers = cpu->registers->Register32(cpu->opcodes->bH());
                                        uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());

                                        *rd = cpu->ram->ReadByte(*ers + disp);

                                        cpu->flags->Mov(*rd);
                    
                                    }
                                ));
        })
    );

    aH_aL.Register(0x6, 0xF, new InstructionContainer(
        "MOV.W @(d:16, ERs), Rd / MOV.W Rs, @(d:16, ERd)",
        [](const Opcode* opcode) { return opcode->bH() >> 3 & 1; },
        [](const Opcode*) { return 0; },
        [](InstructionContainer* container)
        {
            container->Register(true, 0, Instruction(
                                    "MOV.W Rs, @(d:16,ERd)",
                                    4,
                                    2 + 1,
                                    [](const Cpu* cpu)
                                    {
                                        const int16_t disp = cpu->opcodes->cd();
                    
                                        const uint16_t* rs = cpu->registers->Register16(cpu->opcodes->bL());
                                        uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bH());

                                        cpu->ram->WriteShort(*erd + disp, *rs);

                                        cpu->flags->Mov(*rs);
                                    }
                                ));

            container->Register(false, 0, Instruction(
                                    "MOV.W @(d:16,ERs), Rd ",
                                    4,
                                    2 + 1,
                                    [](const Cpu* cpu)
                                    {
                                        const int16_t disp = cpu->opcodes->cd();

                                        uint32_t* ers = cpu->registers->Register32(cpu->opcodes->bH());
                                        uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                                        *rd = cpu->ram->ReadShort(*ers + disp);

                                        cpu->flags->Mov(*rd);
                    
                                    }
                                ));
        })
    );
    
    aH_aL.Register(0x7, 0x0, Instruction(
                       "BSET #xx:3, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t imm = cpu->opcodes->bH() & 0b111;
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());

                           *rd |= 1 << imm;
                       }
                   ));
    
    aH_aL.Register(0x7, 0x3, Instruction(
                       "BTST #xx:3, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t imm = cpu->opcodes->bH() & 0b111;
                           const uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());

                           cpu->flags->zero = !((*rd >> imm) & 1);
                       }
                   ));

    aH_aL.Register(0x7, 0x7, Instruction(
                       "BLD.B #xx:3, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           if (cpu->opcodes->bH() & 0b1000)
                           {
                               throw std::runtime_error(std::format("Unimplemented BILD instruction at 0x{:04X}", cpu->registers->pc));
                           }
           
                           const uint8_t imm = cpu->opcodes->bH() & 0b111;
                           const uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());

                           cpu->flags->carry =(*rd >> imm) & 1;
                       }
                   ));
    
    aH_aL.Register({0x8}, {0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 0xF}, Instruction(
                       "ADD.B #xx:8, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t imm = cpu->opcodes->b();
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->aL());

                           cpu->flags->Add(*rd, imm);

                           *rd += imm;
                       }
                   ));
    
    aH_aL.Register({0xA}, {0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 0xF}, Instruction(
                       "CMP.B #xx:8, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t imm = cpu->opcodes->b();
                           const uint8_t* rd = cpu->registers->Register8(cpu->opcodes->aL());

                           cpu->flags->Sub(*rd, imm);
                       }
                   ));

    aH_aL.Register({0xC}, {0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 0xF}, Instruction(
                       "OR.B #xx:8, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t imm = cpu->opcodes->b();
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->aL());

                           *rd |= imm;

                           cpu->flags->Mov(*rd);
                       }
                   ));

    aH_aL.Register({0xD}, {0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 0xF}, Instruction(
                       "XOR.B #xx:8, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t imm = cpu->opcodes->b();
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->aL());

                           *rd ^= imm;

                           cpu->flags->Mov(*rd);
                       }
                   ));

    aH_aL.Register({0xE}, {0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 0xF}, Instruction(
                       "AND.B #xx:8, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t imm = cpu->opcodes->b();
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->aL());

                           *rd &= imm;
                           cpu->flags->Mov(*rd);
                       }
                   ));

    aH_aL.Register({0xF}, {0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 0xF}, Instruction(
                       "MOV.B #xx:8, Rd",
                       2,
                       1,
                       [](const Cpu* cpu)
                       {
                           const uint8_t imm = cpu->opcodes->b();
                           uint8_t* rd = cpu->registers->Register8(cpu->opcodes->aL());

                           *rd = imm;
                           cpu->flags->Mov(*rd);
                       }
                   ));

    aHaL_bH.Register(0x1, 0x0, new InstructionContainer(
        "MOV.L Mega-Table",
        [](const Opcode* opcode) { return opcode->c(); },
        [](const Opcode* opcode) { return 0; },
        [](InstructionContainer* container)
        {
            container->Register(0x69, 0, new InstructionContainer(
                "MOV.L ERs, @ERd / MOV.L @ERs, ERd",
                [](const Opcode* opcode) { return opcode->dH() >> 3 & 1; },
                [](const Opcode*) { return 0; },
                [](InstructionContainer* container)
                {
                    container->Register(true, 0, Instruction(
                                            "MOV.L ERs, @ERd",
                                            4,
                                            2 + 2,
                                            [](const Cpu* cpu)
                                            {
                                                const uint32_t* ers = cpu->registers->Register32(cpu->opcodes->dL());
                                                const uint32_t* erd = cpu->registers->Register32(cpu->opcodes->dH());

                                                cpu->ram->WriteInt(*erd, *ers);

                                                cpu->flags->Mov(*ers);
                                            }
                                        ));

                    container->Register(false, 0, Instruction(
                                            "MOV.L @ERs, ERd",
                                            4,
                                            2 + 2,
                                            [](const Cpu* cpu)
                                            {
                                                const uint32_t* ers = cpu->registers->Register32(cpu->opcodes->dH());
                                                uint32_t* erd = cpu->registers->Register32(cpu->opcodes->dL());
                            
                                                *erd = cpu->ram->ReadInt(*ers);
                            
                                                cpu->flags->Mov(*erd);
                                            }
                                        ));
                }
            ));
            
            container->Register(0x6B, 0, new InstructionContainer(
                "MOV.L ERs, @aa:16/32 / MOV.L @aa:16/32, ERd",
                [](const Opcode* opcode) { return opcode->dH(); },
                [](const Opcode*) { return 0; },
                [](InstructionContainer* container)
                {
                    container->Register(0x0, 0, Instruction(
                                            "MOV.L @aa:16, ERd",
                                            6,
                                            3 + 2,
                                            [](const Cpu* cpu)
                                            {
                                                const uint16_t address = cpu->opcodes->ef();
                                                uint32_t* erd = cpu->registers->Register32(cpu->opcodes->dL());
                          
                                                *erd = cpu->ram->ReadInt(address);

                                                cpu->flags->Mov(*erd);
                                            }
                                        ));

                    container->Register(0x2, 0, Instruction(
                                            "MOV.L @aa:32, ERd",
                                            8,
                                            3 + 2,
                                            [](const Cpu* cpu)
                                            {
                                                const uint32_t address = (cpu->opcodes->ef() << 16) | cpu->opcodes->gh();
                                                uint32_t* erd = cpu->registers->Register32(cpu->opcodes->dL());
                          
                                                *erd = cpu->ram->ReadInt(address);

                                                cpu->flags->Mov(*erd);
                                            }
                                        ));
                    
                    container->Register(0x8, 0, Instruction(
                                            "MOV.L ERs, @aa:16",
                                            6,
                                            3 + 2,
                                            [](const Cpu* cpu)
                                            {
                                                const uint32_t* ers = cpu->registers->Register32(cpu->opcodes->dL());
                                                const uint16_t address = cpu->opcodes->ef();

                                                cpu->ram->WriteInt(address, *ers);

                                                cpu->flags->Mov(*ers);
                                            }
                                        ));

                    container->Register(0xA, 0, Instruction(
                                            "MOV.L ERs, @aa:32",
                                            8,
                                            3 + 2,
                                            [](const Cpu* cpu)
                                            {
                                                const uint32_t* ers = cpu->registers->Register32(cpu->opcodes->dL());
                                                const uint32_t address = (cpu->opcodes->ef() << 16) | cpu->opcodes->gh();

                                                cpu->ram->WriteInt(address, *ers);

                            
                                                cpu->flags->Mov(*ers);
                                            }
                                        ));
                }
            ));

            container->Register(0x6D, 0, new InstructionContainer(
                "MOV.L ERs, @-ERd / MOV.L @ERs+, ERd",
                [](const Opcode* opcode) { return opcode->dH() >> 3 & 1; },
                [](const Opcode*) { return 0; },
                [](InstructionContainer* container)
                {
                    container->Register(true, 0, Instruction(
                                            "MOV.L ERs, @-ERd",
                                            4,
                                            2 + 2 + 2,
                                            [](const Cpu* cpu)
                                            {
                                                const uint32_t* ers = cpu->registers->Register32(cpu->opcodes->dL());
                                                uint32_t* erd = cpu->registers->Register32(cpu->opcodes->dH());

                                                *erd -= 4;

                                                cpu->ram->WriteInt(*erd, *ers);

                                                cpu->flags->Mov(*ers);
                                            }
                                        ));

                    container->Register(false, 0, Instruction(
                                            "MOV.L @ERs+, ERd",
                                            4,
                                            2 + 2 + 2,
                                            [](const Cpu* cpu)
                                            {
                                                uint32_t* ers = cpu->registers->Register32(cpu->opcodes->dH());
                                                uint32_t* erd = cpu->registers->Register32(cpu->opcodes->dL());
                            
                                                *erd = cpu->ram->ReadInt(*ers);
                            
                                                *ers += 4;
                            
                                                cpu->flags->Mov(*erd);
                                            }
                                        ));
                }
            ));

            container->Register(0x6F, 0, new InstructionContainer(
                "MOV.L ERs, @(d:16,ERd) / MOV.L @(d:16,ERs), ERd",
                [](const Opcode* opcode) { return opcode->dH() >> 3 & 1; },
                [](const Opcode*) { return 0; },
                [](InstructionContainer* container)
                {
                    container->Register(true, 0, Instruction(
                                            "MOV.L ERs, @(d:16,ERd)",
                                            6,
                                            3 + 2,
                                            [](const Cpu* cpu)
                                            {
                                                const int16_t disp = cpu->opcodes->ef();
                    
                                                const uint32_t* ers = cpu->registers->Register32(cpu->opcodes->dL());
                                                const uint32_t* erd = cpu->registers->Register32(cpu->opcodes->dH());

                                                cpu->ram->WriteInt(*erd + disp, *ers);

                                                cpu->flags->Mov(*ers);
                                            }
                                        ));

                    container->Register(false, 0, Instruction(
                                            "MOV.L @(d:16,ERs), ERd",
                                            6,
                                            3 + 2 ,
                                            [](const Cpu* cpu)
                                            {
                                                const int16_t disp = cpu->opcodes->ef();

                                                const uint32_t* ers = cpu->registers->Register32(cpu->opcodes->dH());
                                                uint32_t* erd = cpu->registers->Register32(cpu->opcodes->dL());

                                                *erd = cpu->ram->ReadInt(*ers + disp);

                                                cpu->flags->Mov(*erd);
                                            }
                                        ));
                }
            ));
        }
    ));

    aHaL_bH.Register(0x1, 0x8, Instruction(
                         "SLEEP",
                         2,
                         1,
                         [](Cpu* cpu)
                         {
                             cpu->sleeping = true;
                         }
                     ));

    aHaL_bH.Register(0xA, 0x0, Instruction(
                         "INC.B Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
                             cpu->flags->Inc(*rd, 1);
        
                             *rd += 1;
                         }
                     ));

    aHaL_bH.Register({0xA}, {0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 0xF}, Instruction(
                         "ADD.L ERs, ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             const uint32_t* ers = cpu->registers->Register32(cpu->opcodes->bH());
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());
            
                             cpu->flags->Add(*erd, *ers);

                             *erd += *ers;
                         }
                     ));

    aHaL_bH.Register(0xB, 0x0, Instruction(
                         "ADDS #1, ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());
                             *erd += 1;
                         }
                     ));

    aHaL_bH.Register(0xB, 0x5, Instruction(
                         "INC.W #1, Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
                             cpu->flags->Inc(*rd, 1);
        
                             *rd += 1;
                         }
                     ));

    aHaL_bH.Register(0xB, 0x7, Instruction(
                         "INC.L #1, Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* rd = cpu->registers->Register32(cpu->opcodes->bL());
                             cpu->flags->Inc(*rd, 1);
        
                             *rd += 1;
                         }
                     ));

    aHaL_bH.Register(0xB, 0x8, Instruction(
                         "ADDS #2, ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());
                             *erd += 2;
                         }
                     ));

    aHaL_bH.Register(0xB, 0x9, Instruction(
                         "ADDS #4, ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());
                             *erd += 4;
                         }
                     ));

    aHaL_bH.Register(0xB, 0xD, Instruction(
                         "INC.W #2, Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
                             cpu->flags->Inc(*rd, 2);
        
                             *rd += 2;
                         }
                     ));
    
    aHaL_bH.Register({0xF}, {0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 0xF}, Instruction(
                         "MOV.L ERs, ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());
                             uint32_t* ers = cpu->registers->Register32(cpu->opcodes->bH());

                             *erd = *ers;

                             cpu->flags->Mov(*erd);
                         }
                     ));
    
    aHaL_bH.Register(0x10, 0x0, Instruction(
                         "SHLL.B Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
                             cpu->flags->carry = *rd & Flags::NegativeMask(8);
                             *rd <<= 1;
                             cpu->flags->Mov(*rd);

                         }
                     ));
    
    aHaL_bH.Register(0x10, 0x1, Instruction(
                         "SHLL.W Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
                             cpu->flags->carry = *rd & Flags::NegativeMask(16);
                             *rd <<= 1;
                             cpu->flags->Mov(*rd);

                         }
                     ));
    
    aHaL_bH.Register(0x10, 0x3, Instruction(
                         "SHLL.L ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* rd = cpu->registers->Register32(cpu->opcodes->bL());
                             cpu->flags->carry = *rd & Flags::NegativeMask(32);
                             *rd <<= 1;
                             cpu->flags->Mov(*rd);

                         }
                     ));
    
    aHaL_bH.Register(0x11, 0x0, Instruction(
                         "SHLR.B Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
                             cpu->flags->carry = *rd & 1;
                             *rd >>= 1;
                             cpu->flags->Mov(*rd);

                         }
                     ));
    
    aHaL_bH.Register(0x11, 0x1, Instruction(
                         "SHLR.W Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
                             cpu->flags->carry = *rd & 1;
                             *rd >>= 1;
                             cpu->flags->Mov(*rd);

                         }
                     ));
    
    aHaL_bH.Register(0x11, 0x3, Instruction(
                         "SHLR.L ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* rd = cpu->registers->Register32(cpu->opcodes->bL());
                             cpu->flags->carry = *rd & 1;
                             *rd >>= 1;
                             cpu->flags->Mov(*rd);

                         }
                     ));
    
    aHaL_bH.Register(0x11, 0x9, Instruction(
                         "SHAR.W Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
           
                             cpu->flags->carry = *rd & 1;
           
                             *rd = (*rd >> 1) | (*rd & Flags::NegativeMask(16));
           
                             cpu->flags->Mov(*rd);

                         }
                     ));
    
    aHaL_bH.Register(0x11, 0xB, Instruction(
                         "SHAR.L Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* rd = cpu->registers->Register32(cpu->opcodes->bL());
           
                             cpu->flags->carry = *rd & 1;
           
                             *rd = (*rd >> 1) | (*rd & Flags::NegativeMask(32));
           
                             cpu->flags->Mov(*rd);

                         }
                     ));
    
    aHaL_bH.Register(0x12, 0x8, Instruction(
                         "ROTL.B Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());

                             const uint8_t msb = (*rd >> 7) & 1;
                             *rd = (*rd << 1) | msb;
           
                             cpu->flags->carry = msb;
                             cpu->flags->Mov(*rd);

                         }
                     ));
    
    aHaL_bH.Register(0x12, 0x9, Instruction(
                         "ROTL.W Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                             const uint8_t msb = (*rd >> 15) & 1;
                             *rd = (*rd << 1) | msb;
           
                             cpu->flags->carry = msb;
                             cpu->flags->Mov(*rd);

                         }
                     ));

    
    aHaL_bH.Register(0x13, 0x8, Instruction(
                         "ROTR.B Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());

                             const uint8_t lsb = *rd & 1;
                             *rd = (*rd >> 1) | (lsb << 7);
           
                             cpu->flags->carry = lsb;
                             cpu->flags->Mov(*rd);

                         }
                     ));
    
    aHaL_bH.Register(0x17, 0x0, Instruction(
                         "NOT.B Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
                             *rd = ~*rd;

                             cpu->flags->Mov(*rd);

                         }
                     ));
    
    aHaL_bH.Register(0x17, 0x5, Instruction(
                         "EXTU.W Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
                             *rd &= 0xFF;

                             cpu->flags->Mov(*rd);

                         }
                     ));

    aHaL_bH.Register(0x17, 0x7, Instruction(
                         "EXTU.L ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());
                             *erd &= 0xFFFF;

                             cpu->flags->Mov(*erd);

                         }
                     ));

    aHaL_bH.Register(0x17, 0x8, Instruction(
                         "NEG.B",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
                             cpu->flags->Sub(static_cast<uint8_t>(0), *rd);
            
                             if (*rd != Flags::NegativeMask(8))
                             {
                                 *rd = -*rd;
                             }
            
                         }
                     ));

    aHaL_bH.Register(0x17, 0x9, Instruction(
                         "NEG.W Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
                             cpu->flags->Sub(static_cast<uint16_t>(0), *rd);
            
                             if (*rd != Flags::NegativeMask(16))
                             {
                                 *rd = -*rd;
                             }
            
                         }
                     ));
    
    aHaL_bH.Register(0x17, 0xD, Instruction(
                         "EXTS.W Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                             const int8_t firstPart = static_cast<int8_t>(*rd & 0xFF);
                             *rd = static_cast<int16_t>(firstPart);

                             cpu->flags->Mov(*rd);

                         }
                     ));
    
    aHaL_bH.Register(0x17, 0xF, Instruction(
                         "EXTS.L Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* rd = cpu->registers->Register32(cpu->opcodes->bL());

                             const int16_t firstPart = static_cast<int16_t>(*rd & 0xFFFF);
                             *rd = static_cast<int32_t>(firstPart);

                             cpu->flags->Mov(*rd);

                         }
                     ));
    

    aHaL_bH.Register(0x1A, 0x0, Instruction(
                         "DEC.B ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint8_t* rd = cpu->registers->Register8(cpu->opcodes->bL());
                             cpu->flags->Dec(*rd, 1);
           
                             *rd -= 1;

                         }
                     ));
    
    aHaL_bH.Register({0x1A}, {0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 0xF}, Instruction(
                         "SUB.L ERs, ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* ers = cpu->registers->Register32(cpu->opcodes->bH());
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());
                             cpu->flags->Sub(*erd, *ers);

                             *erd -= *ers;
           
                         }
                     ));
    
    aHaL_bH.Register(0x1B, 0x5, Instruction(
                         "DEC.W #1, Rd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());
                             cpu->flags->Dec(*rd, 1);
           
                             *rd -= 1;
                         }
                     ));
    
    aHaL_bH.Register(0x1B, 0x8, Instruction(
                         "SUBS #2, ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());
                             *erd -= 2;
                         }
                     ));

    aHaL_bH.Register(0x1B, 0x9, Instruction(
                         "SUBS #4, ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());
                             *erd -= 4;
                         }
                     ));

    aHaL_bH.Register({0x1F}, {0x8, 0x9, 0xA, 0xB, 0xC, 0xD, 0xE, 0xF}, Instruction(
                         "CMP.L ERs, ERd",
                         2,
                         1,
                         [](const Cpu* cpu)
                         {
                             uint32_t* ers = cpu->registers->Register32(cpu->opcodes->bH());
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());

                             cpu->flags->Sub(*erd, *ers);
                         }
                     ));

    aHaL_bH.Register(0x58, 0x2, Instruction(
                         "BHI d:16",
                         4,
                         2 + 2,
                         [](const Cpu* cpu)
                         {
                             const int16_t disp = static_cast<int16_t>(cpu->opcodes->cd());
                             if (!(cpu->flags->carry || cpu->flags->zero))
                                 cpu->registers->pc += disp;
                         }
                     ));

    aHaL_bH.Register(0x58, 0x3, Instruction(
                         "BLS d:16",
                         4,
                         2 + 2,
                         [](const Cpu* cpu)
                         {
                             const int16_t disp = static_cast<int16_t>(cpu->opcodes->cd());
                             if (cpu->flags->carry || cpu->flags->zero)
                                 cpu->registers->pc += disp;
                         }
                     ));

    aHaL_bH.Register(0x58, 0x4, Instruction(
                         "BCC d:16",
                         4,
                         2 + 2,
                         [](const Cpu* cpu)
                         {
                             const int16_t disp = static_cast<int16_t>(cpu->opcodes->cd());
                             if (!cpu->flags->carry)
                                 cpu->registers->pc += disp;
                         }
                     ));

    aHaL_bH.Register(0x58, 0x5, Instruction(
                         "BCS d:16",
                         4,
                         2 + 2,
                         [](const Cpu* cpu)
                         {
                             const int16_t disp = static_cast<int16_t>(cpu->opcodes->cd());
                             if (cpu->flags->carry)
                                 cpu->registers->pc += disp;
                         }
                     ));

    aHaL_bH.Register(0x58, 0x6, Instruction(
                         "BNE d:16",
                         4,
                         2 + 2,
                         [](const Cpu* cpu)
                         {
                             const int16_t disp = static_cast<int16_t>(cpu->opcodes->cd());
                             if (!cpu->flags->zero)
                                 cpu->registers->pc += disp;
                         }
                     ));

    aHaL_bH.Register(0x58, 0x7, Instruction(
                         "BEQ d:16",
                         4,
                         2 + 2,
                         [](const Cpu* cpu)
                         {
                             const int16_t disp = static_cast<int16_t>(cpu->opcodes->cd());
                             if (cpu->flags->zero)
                                 cpu->registers->pc += disp;
                         }
                     ));

    aHaL_bH.Register(0x58, 0xC, Instruction(
                         "BGE d:16",
                         4,
                         2 + 2,
                         [](const Cpu* cpu)
                         {
                             const int16_t disp = static_cast<int16_t>(cpu->opcodes->cd());
                             if (cpu->flags->negative == cpu->flags->overflow)
                                 cpu->registers->pc += disp;
                         }
                     ));

    aHaL_bH.Register(0x58, 0xD, Instruction(
                         "BLT d:16",
                         4,
                         2 + 2,
                         [](const Cpu* cpu)
                         {
                             const int16_t disp = static_cast<int16_t>(cpu->opcodes->cd());
                             if (cpu->flags->negative != cpu->flags->overflow)
                                 cpu->registers->pc += disp;
                         }
                     ));

    aHaL_bH.Register(0x58, 0xE, Instruction(
                         "BGT d:16",
                         4,
                         2 + 2,
                         [](const Cpu* cpu)
                         {
                             const int16_t disp = static_cast<int16_t>(cpu->opcodes->cd());
                             if (!(cpu->flags->zero || (cpu->flags->negative != cpu->flags->overflow)))
                                 cpu->registers->pc += disp;
                         }
                     ));

    aHaL_bH.Register(0x79, 0x0, Instruction(
                         "MOV.W #xx:16, Rd",
                         4,
                         2,
                         [](const Cpu* cpu)
                         {
                             const uint16_t imm = cpu->opcodes->cd();
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                             *rd = imm;
                             cpu->flags->Mov(imm);
                         }
                     ));

    aHaL_bH.Register(0x79, 0x1, Instruction(
                         "ADD.W #xx:16, Rd",
                         4,
                         2,
                         [](const Cpu* cpu)
                         {
                             const uint16_t imm = cpu->opcodes->cd();
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                             cpu->flags->Add(*rd, imm);

                             *rd += imm;
                         }
                     ));

    aHaL_bH.Register(0x79, 0x2, Instruction(
                         "CMP.W #xx:16, Rd",
                         4,
                         2,
                         [](const Cpu* cpu)
                         {
                             const uint16_t imm = cpu->opcodes->cd();
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                             cpu->flags->Sub(*rd, imm);
                         }
                     ));

    aHaL_bH.Register(0x79, 0x3, Instruction(
                         "SUB.W #xx:16, Rd",
                         4,
                         2,
                         [](const Cpu* cpu)
                         {
                             const uint16_t imm = cpu->opcodes->cd();
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                             cpu->flags->Sub(*rd, imm);

                             *rd -= imm;
                         }
                     ));

    aHaL_bH.Register(0x79, 0x4, Instruction(
                         "OR.W #xx:16, Rd",
                         4,
                         2,
                         [](const Cpu* cpu)
                         {
                             const uint16_t imm = cpu->opcodes->cd();
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                             *rd |= imm;
            
                             cpu->flags->Mov(*rd);
                         }
                     ));

    aHaL_bH.Register(0x79, 0x6, Instruction(
                         "AND.W #xx:16, Rd",
                         4,
                         2,
                         [](const Cpu* cpu)
                         {
                             const uint16_t imm = cpu->opcodes->cd();
                             uint16_t* rd = cpu->registers->Register16(cpu->opcodes->bL());

                             *rd &= imm;
            
                             cpu->flags->Mov(*rd);
                         }
                     ));

    aHaL_bH.Register(0x7A, 0x0, Instruction(
                         "MOV.L #xx:32, ERd",
                         6,
                         3,
                         [](const Cpu* cpu)
                         {
                             const uint32_t imm = cpu->opcodes->cd() << 16 | cpu->opcodes->ef();
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());

                             *erd = imm;
           
                             cpu->flags->Mov(*erd);
                         }
                     ));

    aHaL_bH.Register(0x7A, 0x1, Instruction(
                         "ADD.L #xx:32, ERd",
                         6,
                         3,
                         [](const Cpu* cpu)
                         {
                             const uint32_t imm = cpu->opcodes->cd() << 16 | cpu->opcodes->ef();
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());
           
                             cpu->flags->Add(*erd, imm);

                             *erd += imm;
                         }
                     ));

    aHaL_bH.Register(0x7A, 0x2, Instruction(
                         "CMP.L #xx:32, ERd",
                         6,
                         3,
                         [](const Cpu* cpu)
                         {
                             const uint32_t imm = cpu->opcodes->cd() << 16 | cpu->opcodes->ef();
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());
           
                             cpu->flags->Sub(*erd, imm);
                         }
                     ));

    aHaL_bH.Register(0x7A, 0x6, Instruction(
                         "AND.L #xx:32, ERd",
                         6,
                         3,
                         [](const Cpu* cpu)
                         {
                             const uint32_t imm = cpu->opcodes->cd() << 16 | cpu->opcodes->ef();
                             uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bL());
           
                             *erd &= imm;

                             cpu->flags->Mov(*erd);
                         }
                     ));

    aHaLbHbLcH_cL.Register(0x1C05, 0x2, Instruction(
                               "MULXS.W Rs, ERd",
                               4,
                               2 + 20,
                               [](const Cpu* cpu)
                               {
                                   uint16_t* rs = cpu->registers->Register16(cpu->opcodes->dH());
                                   uint32_t* erd = cpu->registers->Register32(cpu->opcodes->dL());

                                   *erd = (*erd & 0xFFFF) * *rs;

                                   cpu->flags->zero = *erd == 0;
                                   cpu->flags->negative = *erd & Flags::NegativeMask(32);
                               }
                           ));

    aHaLbHbLcH_cL.Register(0x1D05, 0x3, Instruction(
                               "DIVXS.W Rs, ERd",
                               4,
                               2 + 20,
                               [](const Cpu* cpu)
                               {
                                   const uint16_t* rs = cpu->registers->Register16(cpu->opcodes->dH());
                                   uint32_t* erd = cpu->registers->Register32(cpu->opcodes->dL());

                                   const int16_t quotient = static_cast<int16_t>(static_cast<int32_t>(*erd) / static_cast<int16_t>(*rs));
                                   const int16_t remainder = static_cast<int16_t>(static_cast<int32_t>(*erd) % static_cast<int16_t>(*rs));

                                   *erd = (remainder << 16) | quotient;

                                   cpu->flags->zero = quotient == 0;
                                   cpu->flags->negative = quotient < 0;
            
                               }
                           ));
    
    aHaLbHbLcH_cL.Register(0x1F06, 0x5, Instruction(
                               "XOR.L ERs, ERd",
                               4,
                               2,
                               [](const Cpu* cpu)
                               {
                                   uint32_t* ers = cpu->registers->Register32(cpu->opcodes->dH());
                                   uint32_t* erd = cpu->registers->Register32(cpu->opcodes->dL());

                                   *erd = *ers ^ *erd;

                                   cpu->flags->Mov(*erd);
            
                               }
                           ));
    
    aHaLbHbLcH_cL.Register(
      [](const uint32_t value) { return (value >> 12 & 0xFF) == 0x7C && (value & 0xFF) == 0x07;},
      [](const uint32_t value) { return value == 0x7;},
      Instruction(
          "BLD #xx:3, @ERd",
          4,
          2 + 2,
          [](const Cpu* cpu)
          {
              if (cpu->opcodes->dH() & 0b1000)
              {
                  throw std::runtime_error(std::format("Unimplemented BILD instruction at 0x{:04X}", cpu->registers->pc));
              }

              const uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bH());
              const uint8_t memoryValue = cpu->ram->ReadByte(*erd);
              const uint8_t imm = cpu->opcodes->dH() & 0b111;
              
              cpu->flags->carry = (memoryValue >> imm) & 1;
          }
      )
    );
    
    aHaLbHbLcH_cL.Register(
      [](const uint32_t value) { return (value >> 12 & 0xFF) == 0x7D && (value & 0xF) == 0x6;},
      [](const uint32_t value) { return value == 0x7;},
      Instruction(
          "BST #xx:3, @ERd",
          4,
          2 + 2,
          [](const Cpu* cpu)
          {
              if (cpu->opcodes->dH() & 0b1000)
              {
                  throw std::runtime_error(std::format("Unimplemented BIST instruction at 0x{:04X}", cpu->registers->pc));
              }

              const uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bH());
              const uint8_t memoryValue = cpu->ram->ReadByte(*erd);
              const uint8_t imm = cpu->opcodes->dH() & 0b111;

              if (cpu->flags->carry) {
                  cpu->ram->WriteByte(*erd, memoryValue | 1 << imm);
              } else {
                  cpu->ram->WriteByte(*erd, memoryValue & ~(1 << imm));
              }
          }
      )
    );

    aHaLbHbLcH_cL.Register(
       [](const uint32_t value) { return (value >> 12 & 0xFF) == 0x7D && (value & 0xF) == 0x7;},
       [](const uint32_t value) { return value == 0x0;},
       Instruction(
           "BSET #xx:3 @ERd",
           4,
           2 + 2,
           [](const Cpu* cpu)
           {
               const uint8_t imm = cpu->opcodes->dH() & 0b111;
               const uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bH());
               
               cpu->ram->WriteByte(*erd, cpu->ram->ReadByte(*erd) | 1 << imm);
           }
       )
    );

    aHaLbHbLcH_cL.Register(
       [](const uint32_t value) { return (value >> 12 & 0xFF) == 0x7D && (value & 0xF) == 0x7;},
       [](const uint32_t value) { return value == 0x1;},
       Instruction(
           "BNOT #xx:3 @ERd",
           4,
           2 + 2,
           [](const Cpu* cpu)
           {
               const uint8_t imm = cpu->opcodes->dH() & 0b111;
               const uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bH());
               
               cpu->ram->WriteByte(*erd, cpu->ram->ReadByte(*erd) ^ (1 << imm));
           }
       )
    );
    
    aHaLbHbLcH_cL.Register(
      [](const uint32_t value) { return (value >> 12 & 0xFF) == 0x7D && (value & 0xF) == 0x7;},
      [](const uint32_t value) { return value == 0x2;},
      Instruction(
          "BCLR #xx:3, @ERd",
          4,
          2 + 2,
          [](const Cpu* cpu)
          {
              const uint8_t imm = cpu->opcodes->dH() & 0b111;
              const uint32_t* erd = cpu->registers->Register32(cpu->opcodes->bH());
                
              cpu->ram->WriteByte(*erd, cpu->ram->ReadByte(*erd) & ~(1 << imm));
          }
      )
    );

    aHaLbHbLcH_cL.Register(
       [](const uint32_t value) { return (value >> 12 & 0xFF) == 0x7E && (value & 0xF) == 0x7;},
       [](const uint32_t value) { return value == 0x7;},
       Instruction(
           "BLD #xx:3 @aa:8",
           4,
           2 + 1,
           [](const Cpu* cpu)
           {
               if (cpu->opcodes->dH() & 0b1000)
               {
                   throw std::runtime_error(std::format("Unimplemented BILD instruction at 0x{:04X}", cpu->registers->pc));
               }
               
               const uint8_t imm = cpu->opcodes->dH() & 0b111;
               const uint16_t address = cpu->opcodes->b() | 0xFF00;

               const uint8_t memoryValue = cpu->ram->ReadByte(address);
               
               cpu->flags->carry = (memoryValue >> imm) & 1;
           }
       )
    );
    
    aHaLbHbLcH_cL.Register(
        [](const uint32_t value) { return (value >> 12 & 0xFF) == 0x7F && (value & 0xF) == 0x7;},
        [](const uint32_t value) { return value == 0x0;},
        Instruction(
            "BSET #xx:3, @aa:8",
            4,
            2 + 2,
            [](const Cpu* cpu)
            {
                const uint8_t imm = cpu->opcodes->dH() & 0b111;
                const uint16_t address = cpu->opcodes->b() | 0xFF00;
                
                cpu->ram->WriteByte(address, cpu->ram->ReadByte(address) | 1 << imm);
            }
        )
    );

    aHaLbHbLcH_cL.Register(
       [](const uint32_t value) { return (value >> 12 & 0xFF) == 0x7F && (value & 0xF) == 0x7;},
       [](const uint32_t value) { return value == 0x2;},
       Instruction(
           "BCLR #xx:3 @aa:8",
           4,
           2 + 2,
           [](const Cpu* cpu)
           {
               const uint8_t imm = cpu->opcodes->dH() & 0b111;
               const uint16_t address = cpu->opcodes->b() | 0xFF00;

               cpu->ram->WriteByte(address, cpu->ram->ReadByte(address) & ~(1 << imm));
           }
       )
    );
}

Instruction* InstructionTable::Execute(Cpu* cpu)
{
    cpu->opcodes->Update(cpu->registers->pc);
    return aH_aL.Execute(cpu);
}
