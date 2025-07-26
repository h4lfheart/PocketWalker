import {InstructionContainer} from "./container.ts"
import {range} from "../../../extensions/collection-extensions.ts"
import {setAddFlags, setDecFlags, setIncFlags, setMovFlags, setSubFlags} from "./flags.ts"
import {toSignedByte, toSignedShort, toUnsignedInt, toUnsignedShort, toSignedInt} from "../../../extensions/bit-extensions.ts"
import {Board} from "../../board/board.ts"
import {Opcodes} from "../components/opcodes.ts"

export const InstructionTable = {
    aH_aL: new InstructionContainer("aH/aL", opcodes => opcodes.aH, opcodes => opcodes.aL),
    aHaL_bH:new InstructionContainer("aHaL/bH", opcodes => (opcodes.aH << 4) | opcodes.aL, opcodes => opcodes.bH),
    aHaLbHbLcH_cL: new InstructionContainer("aHaLbHbLcH/cL", opcodes => (opcodes.a << 12) | (opcodes.b << 4) | opcodes.cH, opcodes => opcodes.cL)
}

InstructionTable.aH_aL.register(0x0, [0x1, 0xA, 0xB, 0xF], InstructionTable.aHaL_bH.tableInstruction)
InstructionTable.aH_aL.register(0x1, [...range(0x0, 0x3), 0x7, 0xA, 0xB, 0xF], InstructionTable.aHaL_bH.tableInstruction)
InstructionTable.aH_aL.register(0x5, 0x8, InstructionTable.aHaL_bH.tableInstruction)
InstructionTable.aH_aL.register(0x7, [0x9, 0xA], InstructionTable.aHaL_bH.tableInstruction)
InstructionTable.aH_aL.register(0x7, range(0xC, 0xF), InstructionTable.aHaLbHbLcH_cL.tableInstruction)

InstructionTable.aHaL_bH.register(0x1, 0xC, InstructionTable.aHaLbHbLcH_cL.tableInstruction)
InstructionTable.aHaL_bH.register(0x1, 0xD, InstructionTable.aHaLbHbLcH_cL.tableInstruction)
InstructionTable.aHaL_bH.register(0x1, 0xF, InstructionTable.aHaLbHbLcH_cL.tableInstruction)

//region InstructionTable.aH_aL
InstructionTable.aH_aL.register(0x0, 0x0, {
    name: "NOP",
    bytes: 2,
    cycles: 1,
    execute: () => "NOP"
})

InstructionTable.aH_aL.register(0x0, 0x2, {
    name: "STC.B CCR, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        board.cpu.registers.setRegister8(rd, board.cpu.flags.ccr)
    }
})

InstructionTable.aH_aL.register(0x0, 0x3, {
    name: "LDC.B Rs, CCR",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bL
        board.cpu.flags.ccr = board.cpu.registers.getRegister8(rs)
    }
})

InstructionTable.aH_aL.register(0x0, 0x4, {
    name: "ORC #xx:8, CCR",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const imm = opcodes.b
        board.cpu.flags.ccr |= imm
    }
})

InstructionTable.aH_aL.register(0x0, 0x5, {
    name: "XORC #xx:8, CCR",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const imm = opcodes.b
        board.cpu.flags.ccr ^= imm
    }
})

InstructionTable.aH_aL.register(0x0, 0x6, {
    name: "ANDC #xx:8, CCR",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const imm = opcodes.b

        board.cpu.flags.ccr &= imm
    }
})

InstructionTable.aH_aL.register(0x0, 0x7, {
    name: "LDC.B #xx:8, CCR",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        board.cpu.flags.ccr = opcodes.b
    }
})

InstructionTable.aH_aL.register(0x0, 0x8, {
    name: "ADD.B Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister8(rs)
        const rdValue = board.cpu.registers.getRegister8(rd)

        const value = rdValue + rsValue
        board.cpu.registers.setRegister8(rd, value)

        setAddFlags(board.cpu, rdValue, rsValue, 8)

        return `ADD.B ${board.cpu.registers.getDisplay8(rs)}, ${board.cpu.registers.getDisplay8(rd)}`
    }
})

InstructionTable.aH_aL.register(0x0, 0x9, {
    name: "ADD.W Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister16(rs)
        const rdValue = board.cpu.registers.getRegister16(rd)

        const value = rdValue + rsValue
        board.cpu.registers.setRegister16(rd, value)

        setAddFlags(board.cpu, rdValue, rsValue, 16)

        return `ADD.W ${board.cpu.registers.getDisplay16(rs)}, ${board.cpu.registers.getDisplay16(rd)}`
    }
})

InstructionTable.aH_aL.register(0x0, 0xC, {
    name: "MOV.B Rs,Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister8(rs)

        board.cpu.registers.setRegister8(rd, rsValue)

        setMovFlags(board.cpu, rsValue, 8)

        return `MOV.B ${board.cpu.registers.getDisplay8(rs)}, ${board.cpu.registers.getDisplay8(rd)}`
    }
})

InstructionTable.aH_aL.register(0x0, 0xD, {
    name: "MOV.W Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister16(rs)

        board.cpu.registers.setRegister16(rd, rsValue)

        setMovFlags(board.cpu, rsValue, 16)

        return `MOV.W ${board.cpu.registers.getDisplay16(rs)}, ${board.cpu.registers.getDisplay16(rd)}`
    }
})

InstructionTable.aH_aL.register(0x0, 0xE, {
    name: "ADDX Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister8(rs)
        const rdValue = board.cpu.registers.getRegister8(rd)

        const value = rdValue + rsValue + Number(board.cpu.flags.C)
        board.cpu.registers.setRegister8(rd, value)

        setAddFlags(board.cpu, rdValue, rsValue + Number(board.cpu.flags.C), 8)
    }
})

InstructionTable.aH_aL.register(0x1, 0x4, {
    name: "OR.B Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister8(rs)
        const rdValue = board.cpu.registers.getRegister8(rd)

        const value = rsValue | rdValue
        board.cpu.registers.setRegister8(rd, value)

        setMovFlags(board.cpu, value, 8)
    }
})

InstructionTable.aH_aL.register(0x1, 0x5, {
    name: "XOR.B Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister8(rs)
        const rdValue = board.cpu.registers.getRegister8(rd)

        const value = rsValue ^ rdValue
        board.cpu.registers.setRegister8(rd, value)

        setMovFlags(board.cpu, value, 8)
    }
})

InstructionTable.aH_aL.register(0x1, 0x6, {
    name: "AND.B Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister8(rs)
        const rdValue = board.cpu.registers.getRegister8(rd)

        const value = rsValue & rdValue
        board.cpu.registers.setRegister8(rd, value)

        setMovFlags(board.cpu, value, 8)
    }
})

InstructionTable.aH_aL.register(0x1, 0x8, {
    name: "SUB.B Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister8(rs)
        const rdValue = board.cpu.registers.getRegister8(rd)

        board.cpu.registers.setRegister8(rd, rdValue - rsValue)

        setSubFlags(board.cpu, rdValue, rsValue, 8)
    }
})

InstructionTable.aH_aL.register(0x1, 0x9, {
    name: "SUB.W Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister16(rs)
        const rdValue = board.cpu.registers.getRegister16(rd)

        board.cpu.registers.setRegister16(rd, rdValue - rsValue)

        setSubFlags(board.cpu, rdValue, rsValue, 16)
    }
})

InstructionTable.aH_aL.register(0x1, 0xC, {
    name: "CMP.B Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rsValue = board.cpu.registers.getRegister8(opcodes.bH)
        const rdValue = board.cpu.registers.getRegister8(opcodes.bL)

        setSubFlags(board.cpu, rdValue, rsValue, 8)
    }
})

InstructionTable.aH_aL.register(0x1, 0xD, {
    name: "CMP.W Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL
        const rsValue = board.cpu.registers.getRegister16(rs)
        const rdValue = board.cpu.registers.getRegister16(rd)

        setSubFlags(board.cpu, rdValue, rsValue, 16)

        return `CMP.W ${board.cpu.registers.getDisplay16(rs)}, ${board.cpu.registers.getDisplay16(rd)}`
    }
})

InstructionTable.aH_aL.register(0x1, 0xE, {
    name: "SUBX Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = board.cpu.registers.getRegister8(opcodes.bH)
        const rd = board.cpu.registers.getRegister8(opcodes.bL)

        const value = rd - rs - Number(board.cpu.flags.C)
        board.cpu.registers.setRegister8(opcodes.bL, value)

        setSubFlags(board.cpu, rd, rs + Number(board.cpu.flags.C), 8)
    }
})

InstructionTable.aH_aL.register(0x2, range(0x0, 0xF), {
    name: "MOV.B @aa:8, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.aL;

        const addr = (opcodes.b & 0xFF) | 0xFF00
        const value = board.ram.readByte(addr)

        board.cpu.registers.setRegister8(rd, value)

        setMovFlags(board.cpu, value, 8)
    }
})

InstructionTable.aH_aL.register(0x3, range(0x0, 0xF), {
    name: "MOV.B Rs, @aa:8",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.aL;
        const value = board.cpu.registers.getRegister8(rs)

        const addr = (opcodes.b & 0xFF) | 0xFF00
        board.ram.writeByte(addr, value)

        setMovFlags(board.cpu, value, 8)
    }
})

InstructionTable.aH_aL.register(0x4, 0x0, {
    name: "BRA d:8",
    bytes: 2,
    cycles: 2,
    execute: (board, opcodes) => {
        board.cpu.registers.pc += toSignedByte(opcodes.b)

    }
})

InstructionTable.aH_aL.register(0x4, 0x2, {
    name: "BHI d:8",
    bytes: 2,
    cycles: 2,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)
        if (!(board.cpu.flags.C || board.cpu.flags.Z))
            board.cpu.registers.pc += disp

        return `BHI ${disp}`
    }
})

InstructionTable.aH_aL.register(0x4, 0x3, {
    name: "BLS d:8",
    bytes: 2,
    cycles: 2,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)
        if (board.cpu.flags.C || board.cpu.flags.Z)
            board.cpu.registers.pc += disp

        return `BLS ${disp}`
    }
})

InstructionTable.aH_aL.register(0x4, 0x4, {
    name: "BCC d:8",
    bytes: 2,
    cycles: 2,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)
        if (!board.cpu.flags.C)
            board.cpu.registers.pc += disp

        return `BCC ${disp}`
    }
})

InstructionTable.aH_aL.register(0x4, 0x5, {
    name: "BCS d:8",
    bytes: 2,
    cycles: 2,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)
        if (board.cpu.flags.C)
            board.cpu.registers.pc += disp

        return `BCS ${disp}`
    }
})

InstructionTable.aH_aL.register(0x4, 0x6, {
    name: "BNE d:8",
    bytes: 2,
    cycles: 2,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)
        if (!board.cpu.flags.Z)
            board.cpu.registers.pc += disp

        return `BNE ${disp}`
    }
})

InstructionTable.aH_aL.register(0x4, 0x7, {
    name: "BEQ d:8",
    bytes: 2,
    cycles: 2,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)
        if (board.cpu.flags.Z)
            board.cpu.registers.pc += disp

        return `BEQ ${disp}`
    }
})

InstructionTable.aH_aL.register(0x4, 0xA, {
    name: "BPL d:8",
    bytes: 2,
    cycles: 2,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)
        if (!board.cpu.flags.N)
            board.cpu.registers.pc += disp

        return `BPL ${disp}`
    }
})

InstructionTable.aH_aL.register(0x4, 0xB, {
    name: "BMI d:8",
    bytes: 2,
    cycles: 2,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)
        if (board.cpu.flags.N)
            board.cpu.registers.pc += disp

        return `BMI ${disp}`
    }
})

InstructionTable.aH_aL.register(0x4, 0xC, {
    name: "BGE d:8",
    bytes: 2,
    cycles: 2,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)
        if (board.cpu.flags.N == board.cpu.flags.V)
            board.cpu.registers.pc += disp

        return `BGE ${disp}`
    }
})

InstructionTable.aH_aL.register(0x4, 0xD, {
    name: "BLT d:8",
    cycles: 2,
    bytes: 2,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)
        if (board.cpu.flags.N != board.cpu.flags.V)
            board.cpu.registers.pc += disp

        return `BLT ${disp}`
    }
})

InstructionTable.aH_aL.register(0x4, 0xE, {
    name: "BGT d:8",
    cycles: 2,
    bytes: 2,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)
        if (!(board.cpu.flags.Z || (board.cpu.flags.N != board.cpu.flags.V)))
            board.cpu.registers.pc += disp

        return `BGT ${disp}`
    }
})

InstructionTable.aH_aL.register(0x4, 0xF, {
    name: "BLE d:8",
    cycles: 2,
    bytes: 2,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)
        if (board.cpu.flags.Z || (board.cpu.flags.N != board.cpu.flags.V))
            board.cpu.registers.pc += disp

        return `BLE ${disp}`
    }
})

InstructionTable.aH_aL.register(0x5, 0x0, {
    name: "MULXU.B Rs, Rd",
    bytes: 2,
    cycles: 1 + 12,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rsValue = board.cpu.registers.getRegister8(rs)

        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd)

        board.cpu.registers.setRegister16(rd, (rdValue & 0xFF) * (rsValue))
    }
})

InstructionTable.aH_aL.register(0x5, 0x1, {
    name: "DIVXU.B Rs, Rd",
    bytes: 2,
    cycles: 1 + 12,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rsValue = board.cpu.registers.getRegister8(rs)

        const erd = opcodes.bL
        const erdValue = board.cpu.registers.getRegister16(erd)

        const quotient = toUnsignedShort(erdValue / rsValue)
        const remainder = toUnsignedShort(erdValue % rsValue)

        board.cpu.registers.setRegister16(erd, (remainder << 8) | quotient)

        board.cpu.flags.Z = quotient == 0
        board.cpu.flags.N = Boolean(quotient & 0x80)
    }
})

InstructionTable.aH_aL.register(0x5, 0x2, {
    name: "MULXU.W Rs, ERd",
    bytes: 2,
    cycles: 1 +  20,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rsValue = board.cpu.registers.getRegister16(rs)

        const erd = opcodes.bL
        const erdValue = board.cpu.registers.getRegister32(erd)

        board.cpu.registers.setRegister32(erd, (erdValue & 0xFFFF) * (rsValue))
    }
})

InstructionTable.aH_aL.register(0x5, 0x3, {
    name: "DIVXU.W Rs, ERd",
    bytes: 2,
    cycles: 1 + 20,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rsValue = board.cpu.registers.getRegister16(rs)

        const erd = opcodes.bL
        const erdValue = board.cpu.registers.getRegister32(erd)

        const quotient = toUnsignedInt(erdValue / rsValue)
        const remainder = toUnsignedInt(erdValue % rsValue)

        board.cpu.registers.setRegister32(erd, (remainder << 16) | quotient)

        board.cpu.flags.Z = quotient == 0
        board.cpu.flags.N = Boolean(quotient & 0x8000)
    }
})

InstructionTable.aH_aL.register(0x5, 0x4, {
    name: "RTS",
    bytes: 0,
    cycles: 2 + 1 + 2,
    execute: (board, opcodes) => {
        board.cpu.registers.pc = board.cpu.registers.popStack()
    }
})

InstructionTable.aH_aL.register(0x5, 0x5, {
    name: "BSR d:8",
    bytes: 2,
    cycles: 2 + 1,
    execute: (board, opcodes) => {
        const disp = toSignedByte(opcodes.b)

        board.cpu.registers.pushStack(board.cpu.registers.pc + 2)

        board.cpu.registers.pc += disp

        return `BSR ${disp}`
    }
})


InstructionTable.aH_aL.register(0x5, 0x6, {
    name: "RTE",
    bytes: 0,
    cycles: 2 + 2 + 2,
    execute: (board, opcodes) => {
        board.cpu.registers.pc = board.cpu.interrupts.savedAddress
        board.cpu.flags = board.cpu.interrupts.savedFlags
    }
})

InstructionTable.aH_aL.register(0x5, 0x9, {
    name: "JMP @ERn",
    bytes: 0,
    cycles: 2,
    execute: (board, opcodes) => {
        const ern = opcodes.bH
        const ernValue = board.cpu.registers.getRegister32(ern)

        board.cpu.registers.pc = ernValue & 0xFFFF

        return `JMP @0x${board.cpu.registers.pc.toString(16)}`
    }
})

InstructionTable.aH_aL.register(0x5, 0xA, {
    name: "JMP @aa:24",
    bytes: 0,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        board.cpu.registers.pc = (opcodes.b << 16) | opcodes.cd

        return `JMP @0x${board.cpu.registers.pc.toString(16)}`
    }
})

InstructionTable.aH_aL.register(0x5, 0xD, {
    name: "JSR @ERn",
    bytes: 0,
    cycles: 2 + 1,
    execute: (board, opcodes) => {
        const ern = opcodes.bH
        const ernValue = board.cpu.registers.getRegister32(ern) & 0xFFFF

        board.cpu.registers.pushStack(board.cpu.registers.pc + 2)

        board.cpu.registers.pc = ernValue

        return `JSR @${board.cpu.registers.getRegister32(ern)}`
    }
})

InstructionTable.aH_aL.register(0x5, 0xE, {
    name: "JSR @aa:24",
    bytes: 0,
    cycles: 2 + 1 + 2,
    execute: (board, opcodes) => {
        board.cpu.registers.pushStack(board.cpu.registers.pc + 4)

        const addr = (opcodes.b << 16) | opcodes.cd
        board.cpu.registers.pc = addr

        return `JSR 0x${addr.toString(16)}`
    }
})

InstructionTable.aH_aL.register(0x6, 0x0, {
    name: "BSET #xx:3, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rn = opcodes.bH
        const rnValue = board.cpu.registers.getRegister8(rn)

        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister8(rd)

        board.cpu.registers.setRegister8(rd, rdValue | (1 << rnValue))

        return `BSET #${rnValue}, ${board.cpu.registers.getDisplay8(rd)}`
    }
})

InstructionTable.aH_aL.register(0x6, 0x4, {
    name: "OR.W Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister16(rs)
        const rdValue = board.cpu.registers.getRegister16(rd)

        const value = rsValue | rdValue
        board.cpu.registers.setRegister16(rd, value)

        setMovFlags(board.cpu, value, 16)
    }
})

InstructionTable.aH_aL.register(0x6, 0x5, {
    name: "XOR.W Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister16(rs)
        const rdValue = board.cpu.registers.getRegister16(rd)

        const value = rsValue ^ rdValue
        board.cpu.registers.setRegister16(rd, value)

        setMovFlags(board.cpu, value, 16)
    }
})

InstructionTable.aH_aL.register(0x6, 0x6, {
    name: "AND.W Rs, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rs = opcodes.bH
        const rd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister16(rs)
        const rdValue = board.cpu.registers.getRegister16(rd)

        const value = rsValue & rdValue
        board.cpu.registers.setRegister16(rd, value)

        setMovFlags(board.cpu, value, 16)
    }
})

InstructionTable.aH_aL.register(0x6, 0x7, {
    name: "BST #xx:3, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const isInverse = opcodes.bH >> 3 == 1
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister8(rd)

        const imm = opcodes.bH & 0b111

        let isOne = board.cpu.flags.C
        if (isInverse)
            isOne = !isOne

        if (isOne) {
            board.cpu.registers.setRegister8(rd, rdValue | (1 << imm))
        } else {
            board.cpu.registers.setRegister8(rd, rdValue& ~(1 << imm))
        }
    }
})

InstructionTable.aH_aL.register(0x6, 0x8, {
    name: "MOV.B @ERs,Rd / MOV.B Rs, @ERd",
    bytes: 2,
    cycles: 1 + 1,
    execute: (board, opcodes) => {
        const toMemory = (opcodes.bH >> 3) & 1
        if (toMemory) {
            const rs = opcodes.bL
            const rsValue = board.cpu.registers.getRegister8(rs)

            const erd = opcodes.bH
            const erdValue = board.cpu.registers.getRegister32(erd)

            board.ram.writeByte(erdValue, rsValue)
            setMovFlags(board.cpu, rsValue, 8)

            return `MOV.B ${board.cpu.registers.getDisplay8(rs)}, @${board.cpu.registers.getDisplay32(erd)}`
        } else {

            const ers = opcodes.bH
            const ersValue = board.cpu.registers.getRegister32(ers)
            const memoryValue = board.ram.readByte(ersValue)

            const rd = opcodes.bL
            board.cpu.registers.setRegister8(rd, memoryValue)
            setMovFlags(board.cpu, memoryValue, 8)
            return `MOV.B @${board.cpu.registers.getDisplay32(ers)}, ${board.cpu.registers.getDisplay8(rd)}`
        }
    }
})

InstructionTable.aH_aL.register(0x6, 0x9, {
    name: "MOV.W @ERs,Rd / MOV.W Rs, @ERd",
    bytes: 2,
    cycles: 1 + 1,
    execute: (board, opcodes) => {
        const toMemory = (opcodes.bH >> 3) & 1
        if (toMemory) {
            const rs = opcodes.bL
            const rsValue = board.cpu.registers.getRegister16(rs)

            const erd = opcodes.bH
            const erdValue = board.cpu.registers.getRegister32(erd)

            board.ram.writeShort(erdValue, rsValue)
            setMovFlags(board.cpu, rsValue, 16)

            return `MOV.W ${board.cpu.registers.getDisplay16(rs)}, @${board.cpu.registers.getDisplay32(erd)}`
        } else {

            const ers = opcodes.bH
            const ersValue = board.cpu.registers.getRegister32(ers)
            const memoryValue = board.ram.readShort(ersValue)

            const rd = opcodes.bL
            board.cpu.registers.setRegister16(rd, memoryValue)
            setMovFlags(board.cpu, memoryValue, 16)
            return `MOV.W @${board.cpu.registers.getDisplay32(ers)}, ${board.cpu.registers.getDisplay16(rd)}`
        }
    }
})

InstructionTable.aH_aL.register(0x6, 0xA, {
    name: "MOV.B Rs, @aa:16/24 / MOV.B @aa:16/24, Rd",
    bytes: 0, // inc pc within execute func
    cycles: 2, // TODO sub tables for cycles
    execute: (board, opcodes) => {
        switch (opcodes.bH) {
            case 0x8: // Rs, @aa:16
            {
                const rs = opcodes.bL;
                const value = board.cpu.registers.getRegister8(rs)
                const addr = opcodes.cd
                board.ram.writeByte(addr, value)
                setMovFlags(board.cpu, value, 8)

                board.cpu.registers.pc += 4
                //board.cpu.cyclesCompleted += 2 + 1

                return `MOV.B ${board.cpu.registers.getDisplay8(rs)}, @0x${addr.toString(16)}`
            }
            case 0xA: // Rs, @aa:24
            {
                const rs = opcodes.bL;
                const value = board.cpu.registers.getRegister8(rs)
                const addr = (opcodes.cd << 16) | opcodes.ef
                board.ram.writeByte(addr, value)
                setMovFlags(board.cpu, value, 8)

                board.cpu.registers.pc += 6
                //board.cpu.cyclesCompleted += 3 + 1

                return `MOV.B ${board.cpu.registers.getDisplay8(rs)}, @0x${addr.toString(16)}`
            }
            case 0x0: // @aa:16, Rd
            {
                const rd = opcodes.bL;

                const addr = opcodes.cd
                const memoryValue = board.ram.readByte(addr)
                board.cpu.registers.setRegister8(rd, memoryValue)
                setMovFlags(board.cpu, memoryValue, 8)

                board.cpu.registers.pc += 4
                //board.cpu.cyclesCompleted += 2 + 1

                return `MOV.B @0x${addr.toString(16)}, ${board.cpu.registers.getDisplay8(rd)}`
            }
            case 0x2: // @aa:24, Rd
            {
                const rd = opcodes.bL;

                const addr = (opcodes.cd << 16) | opcodes.ef
                const memoryValue = board.ram.readByte(addr)
                board.cpu.registers.setRegister8(rd, memoryValue)
                setMovFlags(board.cpu, memoryValue, 8)

                board.cpu.registers.pc += 6
                //board.cpu.cyclesCompleted += 3 + 1

                return `MOV.B @0x${addr.toString(16)}, ${board.cpu.registers.getDisplay8(rd)}`
            }
            default: {
                return
            }
        }
    }
})


InstructionTable.aH_aL.register(0x6, 0xB, {
    name: "MOV.W Rs, @aa:16/24 / MOV.W @aa:16/24, Rd",
    bytes: 0,
    cycles: 2, // TODO sub table for cycles
    execute: (board, opcodes) => {
        switch (opcodes.bH) {
            case 0x8: // Rs, @aa:16
            {
                const rs = opcodes.bL;
                const value = board.cpu.registers.getRegister16(rs)
                const addr = opcodes.cd
                board.ram.writeShort(addr, value)
                setMovFlags(board.cpu, value, 16)

                board.cpu.registers.pc += 4
                //board.cpu.cyclesCompleted += 2 + 1

                return `MOV.W ${board.cpu.registers.getDisplay16(rs)}, @0x${addr.toString(16)}`
            }
            case 0xA: // Rs, @aa:24
            {
                const rs = opcodes.bL;
                const value = board.cpu.registers.getRegister16(rs)
                const addr = (opcodes.cd << 16) | opcodes.ef
                board.ram.writeShort(addr, value)
                setMovFlags(board.cpu, value, 16)

                board.cpu.registers.pc += 6
                //board.cpu.cyclesCompleted += 3 + 1

                return `MOV.W ${board.cpu.registers.getDisplay16(rs)}, @0x${addr.toString(16)}`
            }
            case 0x0: // @aa:16, Rd
            {
                const rd = opcodes.bL;

                const addr = opcodes.cd
                const memoryValue = board.ram.readShort(addr)
                board.cpu.registers.setRegister16(rd, memoryValue)
                setMovFlags(board.cpu, memoryValue, 16)

                board.cpu.registers.pc += 4
                //board.cpu.cyclesCompleted += 2 + 1

                return `MOV.W @0x${addr.toString(16)}, ${board.cpu.registers.getDisplay16(rd)}`
            }
            case 0x2: // @aa:24, Rd
            {
                const rd = opcodes.bL;

                const addr = (opcodes.cd << 16) | opcodes.ef
                const memoryValue = board.ram.readShort(addr)
                board.cpu.registers.setRegister16(rd, memoryValue)
                setMovFlags(board.cpu, memoryValue, 16)

                board.cpu.registers.pc += 6
                //board.cpu.cyclesCompleted += 3 + 1

                return `MOV.W @0x${addr.toString(16)}, ${board.cpu.registers.getDisplay16(rd)}`
            }
            default: {
                return
            }
        }
    }
})

InstructionTable.aH_aL.register(0x6, 0xC, {
    name: "MOV.B @ERs+, Rd / MOV.B Rs, @-ERd",
    bytes: 2,
    cycles: 1 + 1 + 2,
    execute: (board, opcodes) => {

        const decrement = (opcodes.bH >> 3) & 1
        if (decrement) {
            const rs = opcodes.bL
            const rsValue = board.cpu.registers.getRegister8(rs)

            const erd = opcodes.bH
            const erdValue = board.cpu.registers.getRegister32(erd)
            const erdAdjustValue = toUnsignedInt(erdValue - 1)
            board.cpu.registers.setRegister32(erd, erdAdjustValue)

            board.ram.writeByte(erdAdjustValue, rsValue)

            setMovFlags(board.cpu, rsValue, 8)
        }
        else {
            const ers = opcodes.bH
            const ersRegValue = board.cpu.registers.getRegister32(ers)
            const ersMemoryValue = board.ram.readByte(ersRegValue)

            board.cpu.registers.setRegister32(ers, toUnsignedInt(ersRegValue + 1))

            const rd = opcodes.bL
            board.cpu.registers.setRegister8(rd, ersMemoryValue)
            setMovFlags(board.cpu, ersMemoryValue, 8)
        }

    }
})

InstructionTable.aH_aL.register(0x6, 0xD, {
    name: "MOV.W @ERs+, Rd / MOV.W Rs, @-ERd",
    bytes: 2,
    cycles: 1 + 1 + 2,
    execute: (board, opcodes) => {

        const decrement = (opcodes.bH >> 3) & 1
        if (decrement) {
            const rs = opcodes.bL
            const rsValue = board.cpu.registers.getRegister16(rs)

            const erd = opcodes.bH
            const erdValue = board.cpu.registers.getRegister32(erd)
            const newAddr = toUnsignedInt(erdValue - 2)
            board.cpu.registers.setRegister32(erd, newAddr)

            board.ram.writeShort(newAddr, rsValue)

            setMovFlags(board.cpu, rsValue, 16)
        }
        else {
            const ers = opcodes.bH
            const ersRegValue = board.cpu.registers.getRegister32(ers)
            const ersMemoryValue = board.ram.readShort(ersRegValue)

            const newValue = toUnsignedInt(ersRegValue + 2)
            board.cpu.registers.setRegister32(ers, newValue)

            const rd = opcodes.bL
            board.cpu.registers.setRegister16(rd, ersMemoryValue)
            setMovFlags(board.cpu, ersMemoryValue, 16)
        }

    }
})

InstructionTable.aH_aL.register(0x6, 0xE, {
    name: "MOV.B @(d:16,ERs),Rd / MOV.B Rs,@(d:16,ERd)",
    bytes: 4,
    cycles: 2 + 1,
    execute: (board, opcodes) => {
        const disp = toSignedShort(opcodes.cd)

        const toMemory = (opcodes.bH >> 3) & 1
        if (toMemory) {
            const rs = opcodes.bL
            const rsValue = board.cpu.registers.getRegister8(rs)

            const erd = opcodes.bH
            const erdValue = board.cpu.registers.getRegister32(erd)

            board.ram.writeByte(erdValue + disp, rsValue)

            setMovFlags(board.cpu, rsValue, 8)
        }
        else {
            const ers = opcodes.bH
            const ersRegValue = board.cpu.registers.getRegister32(ers)
            const memoryValue = board.ram.readByte(ersRegValue + disp)

            const rd = opcodes.bL
            board.cpu.registers.setRegister8(rd, memoryValue)

            setMovFlags(board.cpu, memoryValue, 8)
        }

    }
})

InstructionTable.aH_aL.register(0x6, 0xF, {
    name: "MOV.W @(d:16,ERs),Rd / MOV.W Rs,@(d:16,ERd)",
    bytes: 4,
    cycles: 2 + 1,
    execute: (board, opcodes) => {
        const disp = toSignedShort(opcodes.cd)
        const toMemory = (opcodes.bH >> 3) & 1
        if (toMemory) {
            const rs = opcodes.bL
            const rsValue = board.cpu.registers.getRegister16(rs)

            const erd = opcodes.bH
            const erdValue = board.cpu.registers.getRegister32(erd)

            board.ram.writeShort(erdValue + disp, rsValue)

            setMovFlags(board.cpu, rsValue, 16)
        }
        else {
            const ers = opcodes.bH
            const ersRegValue = board.cpu.registers.getRegister32(ers)
            const memoryValue = board.ram.readShort(ersRegValue + disp)

            const rd = opcodes.bL
            board.cpu.registers.setRegister16(rd, memoryValue)

            setMovFlags(board.cpu, memoryValue, 16)
        }

    }
})


InstructionTable.aH_aL.register(0x7, 0x0, {
    name: "BSET #xx:3, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister8(rd)

        const bit = opcodes.bH & 0b111

        board.cpu.registers.setRegister8(rd, rdValue | (1 << bit))

        return `BSET #${bit}, ${board.cpu.registers.getDisplay8(rd)}`
    }
})


InstructionTable.aH_aL.register(0x7, 0x3, {
    name: "BTST #xx:3, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const bit = opcodes.bH & 0b111
        const rd = board.cpu.registers.getRegister8(opcodes.bL)

        board.cpu.flags.Z = !Boolean((rd >> bit) & 1)
    }
})

InstructionTable.aH_aL.register(0x7, 0x7, {
    name: "BLD #xx:3, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        if (opcodes.bH >> 3 == 1) { // BILD ??
            debugger
        }

        const bit = opcodes.bH & 0b111
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister8(rd)

        board.cpu.flags.C = Boolean((rdValue >> bit) & 1)

        return `BLD #${bit}, ${board.cpu.registers.getDisplay8(rd)}`

    }
})

InstructionTable.aH_aL.register(0x8, range(0x0, 0xF), {
    name: "ADD.B #xx:8, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.aL
        const rdValue = board.cpu.registers.getRegister8(rd)

        const imm = opcodes.b

        const value = imm + rdValue
        board.cpu.registers.setRegister8(rd, value)

        setAddFlags(board.cpu, rdValue, imm, 8)
    }
})

InstructionTable.aH_aL.register(0x9, range(0x0, 0xF), {
    name: "ADDX #xx:8, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.aL
        const rdValue = board.cpu.registers.getRegister8(rd)

        const imm = opcodes.b

        const value = imm + rdValue
        board.cpu.registers.setRegister8(rd, value)
    }
})

InstructionTable.aH_aL.register(0xA, range(0x0, 0xF), {
    name: "CMP.B #xx:8, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.aL
        const rdValue = board.cpu.registers.getRegister8(rd)

        const imm = opcodes.b

        setSubFlags(board.cpu, rdValue, imm, 8)

        return `CMP.B 0x${imm}, ${board.cpu.registers.getDisplay8(rd)}`
    }
})

InstructionTable.aH_aL.register(0xB, range(0x0, 0xF), {
    name: "SUBX #xx:8, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.aL
        const rdValue = board.cpu.registers.getRegister8(rd)

        const imm = opcodes.b

        const value = rdValue - imm - Number(board.cpu.flags.C)
        board.cpu.registers.setRegister8(rd, value)

        setSubFlags(board.cpu, rdValue, imm + Number(board.cpu.flags.C), 8)
    }
})

InstructionTable.aH_aL.register(0xC, range(0x0, 0xF), {
    name: "OR.B #xx:8, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.aL
        const rdValue = board.cpu.registers.getRegister8(rd)

        const value = opcodes.b | rdValue
        board.cpu.registers.setRegister8(rd, value)

        setMovFlags(board.cpu, value, 8)
    }
})

InstructionTable.aH_aL.register(0xD, range(0x0, 0xF), {
    name: "XOR.B #xx:8, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.aL
        const rdValue = board.cpu.registers.getRegister8(rd)

        const value = opcodes.b ^ rdValue
        board.cpu.registers.setRegister8(rd, value)

        setMovFlags(board.cpu, value, 8)
    }
})


InstructionTable.aH_aL.register(0xE, range(0x0, 0xF), {
    name: "AND.B #xx:8, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.aL
        const rdValue = board.cpu.registers.getRegister8(rd)

        const imm = opcodes.b

        const value = imm & rdValue
        board.cpu.registers.setRegister8(rd, value)

        setMovFlags(board.cpu, value, 8)

        return `AND.B 0x${imm.toString(16)}, ${board.cpu.registers.getDisplay8(rd)}`
    }
})


InstructionTable.aH_aL.register(0xF, range(0x0, 0xF), {
    name: "MOV.B #xx:8, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.aL;
        const value = opcodes.b

        board.cpu.registers.setRegister8(rd, value)

        setMovFlags(board.cpu, value, 8)

        return `MOV.B 0x${value.toString(16)}, ${board.cpu.registers.getDisplay8(rd)}`
    }
})
//endregion

//region InstructionTable.aHaL_bH

// TODO create a sub-table for nested entries like these
InstructionTable.aHaL_bH.register(0x1, 0x0, {
    name: "MOV.L",
    bytes: 0, // decide in execute func
    cycles: 2, // TODO do proper cycles when adding sub-table
    execute: (board, opcodes) => {
        switch (opcodes.c) {
            case 0x69: {
                const toMemory = (opcodes.dH >> 3) & 1
                if (toMemory) {
                    const ers = opcodes.dL
                    const ersValue = board.cpu.registers.getRegister32(ers)

                    const erd = opcodes.dH
                    const erdValue = board.cpu.registers.getRegister32(erd)

                    board.ram.writeInt(erdValue, ersValue)

                    setMovFlags(board.cpu, ersValue, 32)
                }
                else {
                    const ers = opcodes.dH
                    const ersValue = board.cpu.registers.getRegister32(ers)
                    const memoryValue = board.ram.readInt(ersValue)

                    const rd = opcodes.dL
                    board.cpu.registers.setRegister32(rd, memoryValue)

                    setMovFlags(board.cpu, memoryValue, 32)
                }

                board.cpu.registers.pc += 4

                break
            }
            case 0x6B: {
                switch (opcodes.dH) {
                    case 0x8: // ERs, @aa:16
                    {
                        const ers = opcodes.dL;
                        const value = board.cpu.registers.getRegister32(ers)
                        const addr = opcodes.ef
                        board.ram.writeInt(addr, value)
                        setMovFlags(board.cpu, value, 32)

                        board.cpu.registers.pc += 6

                        return `MOV.L ${board.cpu.registers.getDisplay32(ers)}, @0x${addr.toString(16)}`
                    }
                    case 0xA: // ERs, @aa:32
                    {
                        const ers = opcodes.dL;
                        const value = board.cpu.registers.getRegister32(ers)
                        const addr = (opcodes.ef << 16) | opcodes.gh
                        board.ram.writeInt(addr, value)
                        setMovFlags(board.cpu, value, 32)

                        board.cpu.registers.pc += 8

                        return `MOV.L ${board.cpu.registers.getDisplay32(ers)}, @0x${addr.toString(16)}`
                    }
                    case 0x0: // @aa:16, ERd
                    {
                        const erd = opcodes.dL;

                        const addr = opcodes.ef
                        const memoryValue = board.ram.readInt(addr)
                        board.cpu.registers.setRegister32(erd, memoryValue)
                        setMovFlags(board.cpu, memoryValue, 32)

                        board.cpu.registers.pc += 6

                        return `MOV.L @0x${addr.toString(16)}, ${board.cpu.registers.getDisplay32(erd)}`
                    }
                    case 0x2: // @aa:24, ERd
                    {
                        const erd = opcodes.dL;

                        const addr = (opcodes.ef << 16) | opcodes.gh
                        const memoryValue = board.ram.readInt(addr)
                        board.cpu.registers.setRegister32(erd, memoryValue)
                        setMovFlags(board.cpu, memoryValue, 32)

                        board.cpu.registers.pc += 8

                        return `MOV.L @0x${addr.toString(16)}, ${board.cpu.registers.getDisplay32(erd)}`
                    }
                    default: {
                        debugger
                        return
                    }
                }
            }
            case 0x6D:
            {
                const decrement = (opcodes.dH >> 3) & 1
                if (decrement) {
                    const ers = opcodes.dL
                    const ersValue = board.cpu.registers.getRegister32(ers)

                    const erd = opcodes.dH
                    const erdValue = board.cpu.registers.getRegister32(erd)
                    const newAddr = toUnsignedInt(erdValue - 4)
                    board.cpu.registers.setRegister32(erd, newAddr)

                    board.ram.writeInt(newAddr, ersValue)

                    setMovFlags(board.cpu, ersValue, 32)
                }
                else {
                    const ers = opcodes.dH
                    const ersRegValue = board.cpu.registers.getRegister32(ers)

                    const ersMemoryValue = board.ram.readInt(ersRegValue)

                    board.cpu.registers.setRegister32(ers, toUnsignedInt(ersRegValue + 4))

                    const erd = opcodes.dL
                    board.cpu.registers.setRegister32(erd, ersMemoryValue)

                    setMovFlags(board.cpu, ersMemoryValue, 32)
                }

                board.cpu.registers.pc += 4
                break
            }
            case 0x6F:
            {
                const disp = toSignedShort(opcodes.ef)

                const toMemory = (opcodes.dH >> 3) & 1
                if (toMemory) {
                    const rs = opcodes.dL
                    const rsValue = board.cpu.registers.getRegister32(rs)

                    const erd = opcodes.dH
                    const erdValue = board.cpu.registers.getRegister32(erd)

                    board.ram.writeInt(erdValue + disp, rsValue)

                    setMovFlags(board.cpu, rsValue, 32)
                }
                else {
                    const ers = opcodes.dH
                    const ersRegValue = board.cpu.registers.getRegister32(ers)
                    const memoryValue = board.ram.readInt(ersRegValue + disp)

                    const rd = opcodes.dL
                    board.cpu.registers.setRegister32(rd, memoryValue)

                    setMovFlags(board.cpu, memoryValue, 32)
                }

                board.cpu.registers.pc += 6

                break
            }
            default:
                throw Error(`MOV.L opcode for 0x${opcodes.c.toString(16)} not found`)
        }
    }
})

InstructionTable.aHaL_bH.register(0x1, 0x8, {
    name: "SLEEP",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        board.cpu.sleep = true
    }
})

InstructionTable.aHaL_bH.register(0x0A, 0x0, {
    name: "INC.B Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister8(rd)
        const value = rdValue + 1
        board.cpu.registers.setRegister8(rd, value)

        setIncFlags(board.cpu, rdValue, 8)

        return `INC.B ${board.cpu.registers.getDisplay8(rd)}`
    }
})

InstructionTable.aHaL_bH.register(0x0A, range(0x8, 0xF), {
    name: "ADD.L ERs, ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const erd = opcodes.bL
        const ers = opcodes.bH

        const erdValue = board.cpu.registers.getRegister32(erd)
        const ersValue = board.cpu.registers.getRegister32(ers)

        const value = erdValue + ersValue
        board.cpu.registers.setRegister32(erd, value)

        setAddFlags(board.cpu, erdValue, ersValue, 32)

        return `ADD.L ${board.cpu.registers.getDisplay32(ers)}, ${board.cpu.registers.getDisplay32(erd)}`
    }
})

InstructionTable.aHaL_bH.register(0xB, 0x0, {
    name: "ADDS #1, ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister32(rd)
        board.cpu.registers.setRegister32(rd, rdValue + 1)
    }
})

InstructionTable.aHaL_bH.register(0x0B, 0x5, {
    name: "INC.W #1, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd)
        const value = rdValue + 1
        board.cpu.registers.setRegister16(rd, value)

        setIncFlags(board.cpu, rdValue, 16)
    }
})

InstructionTable.aHaL_bH.register(0x0B, 0x7, {
    name: "INC.L #1, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const erd = opcodes.bL
        const erdValue = board.cpu.registers.getRegister32(erd)
        const value = erdValue + 1
        board.cpu.registers.setRegister32(erd, value)

        setIncFlags(board.cpu, erdValue, 32)
    }
})

InstructionTable.aHaL_bH.register(0x0B, 0xD, {
    name: "INC.W #2, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd)
        const value = rdValue + 2
        board.cpu.registers.setRegister16(rd, value)

        setIncFlags(board.cpu, rdValue, 16)
    }
})

InstructionTable.aHaL_bH.register(0xB, 0x8, {
    name: "ADDS #2, ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister32(rd)
        board.cpu.registers.setRegister32(rd, rdValue + 2)
    }
})

InstructionTable.aHaL_bH.register(0xB, 0x9, {
    name: "ADDS #4, ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister32(rd)
        board.cpu.registers.setRegister32(rd, rdValue + 4)
    }
})

InstructionTable.aHaL_bH.register(0xF, range(0x8, 0xF), {
    name: "MOV.L ERs, ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rs = opcodes.bH

        const rsValue = board.cpu.registers.getRegister32(rs)

        board.cpu.registers.setRegister32(rd, rsValue)
        setMovFlags(board.cpu, rsValue, 32)
    }
})

InstructionTable.aHaL_bH.register(0x10, 0x0, {
    name: "SHLL.B Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister8(rd)
        const value = rdValue << 1
        board.cpu.registers.setRegister8(rd, value)

        board.cpu.flags.C = Boolean(rdValue & 0x80)
        setMovFlags(board.cpu, value, 8)
    }
})

InstructionTable.aHaL_bH.register(0x10, 0x1, {
    name: "SHLL.W Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = board.cpu.registers.getRegister16(opcodes.bL)
        const value = rd << 1
        board.cpu.registers.setRegister16(opcodes.bL, value)

        board.cpu.flags.C = ((rd >> 15) & 1) == 1
        setMovFlags(board.cpu, value, 16)
    }
})

InstructionTable.aHaL_bH.register(0x10, 0x3, {
    name: "SHLL.L ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const erd = opcodes.bL
        const erdValue = board.cpu.registers.getRegister32(erd)

        const value = erdValue << 1
        board.cpu.registers.setRegister32(erd, value)

        board.cpu.flags.C = Boolean(erdValue & 0x80000000)
        setMovFlags(board.cpu, value, 32)
    }
})

InstructionTable.aHaL_bH.register(0x11, 0x0, {
    name: "SHLR.B Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister8(rd);

        const value = rdValue >> 1
        board.cpu.registers.setRegister8(rd, value)

        board.cpu.flags.C = Boolean(rdValue & 1)
        setMovFlags(board.cpu, value, 8)
    }
})

InstructionTable.aHaL_bH.register(0x11, 0x1, {
    name: "SHLR.W Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd);

        const value = (rdValue >> 1)
        board.cpu.registers.setRegister16(rd, value)

        board.cpu.flags.C = Boolean(rdValue & 1)
        setMovFlags(board.cpu, value, 16)
    }
})

InstructionTable.aHaL_bH.register(0x11, 0x3, {
    name: "SHLR.L ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const erd = opcodes.bL
        const erdValue = board.cpu.registers.getRegister32(erd);

        const value = (erdValue >> 1)
        board.cpu.registers.setRegister32(erd, value)

        board.cpu.flags.C = Boolean(erdValue & 1)
        setMovFlags(board.cpu, value, 32)
    }
})

InstructionTable.aHaL_bH.register(0x11, 0x9, {
    name: "SHAR.W Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd);

        const value = (rdValue >> 1) | (rdValue & 0x8000)
        board.cpu.registers.setRegister16(rd, value)

        board.cpu.flags.C = Boolean(rdValue & 1)
        setMovFlags(board.cpu, value, 16)
    }
})

InstructionTable.aHaL_bH.register(0x12, 0x8, {
    name: "ROTL.B Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister8(rd);

        const msb = (rdValue >> 7) & 1
        const value = (rdValue << 1) | msb
        board.cpu.registers.setRegister8(rd, value)

        board.cpu.flags.C = Boolean(msb)
        setMovFlags(board.cpu, value, 8)
    }
})

InstructionTable.aHaL_bH.register(0x12, 0x9, {
    name: "ROTL.W Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd);

        const msb = (rdValue >> 15) & 1
        const value = (rdValue << 1) | msb
        board.cpu.registers.setRegister16(rd, value)

        board.cpu.flags.C = Boolean(msb)
        setMovFlags(board.cpu, value, 16)
    }
})

InstructionTable.aHaL_bH.register(0x17, 0x0, {
    name: "NOT.B Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister8(rd)

        const newValue = ~rdValue
        board.cpu.registers.setRegister8(rd, newValue)
        setMovFlags(board.cpu, newValue, 8)
    }
})

InstructionTable.aHaL_bH.register(0x17, 0x5, {
    name: "EXTU.W Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd)

        const value = rdValue & 0xFF
        board.cpu.registers.setRegister16(rd, value)

        setMovFlags(board.cpu, value, 16)

        return `EXTU.W ${board.cpu.registers.getDisplay16(rd)}`
    }
})

InstructionTable.aHaL_bH.register(0x17, 0x7, {
    name: "EXTU.L ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const erd = opcodes.bL
        const erdValue = board.cpu.registers.getRegister32(erd)

        const value = erdValue & 0xFFFF
        board.cpu.registers.setRegister32(erd, value)

        setMovFlags(board.cpu, value, 32)

        return `EXTU.L ${board.cpu.registers.getDisplay32(erd)}`
    }
})

InstructionTable.aHaL_bH.register(0x17, 0x8, {
    name: "NEG.B Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister8(rd)

        if (rdValue != 0x80)
            board.cpu.registers.setRegister8(rd, -rdValue)

        setSubFlags(board.cpu, 0, rdValue, 8)

        return `NEG.W ${board.cpu.registers.getDisplay8(rd)}`
    }
})

InstructionTable.aHaL_bH.register(0x17, 0x9, {
    name: "NEG.W Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd)

        if (rdValue != 0x8000)
            board.cpu.registers.setRegister16(rd, -rdValue)

        setSubFlags(board.cpu, 0, rdValue, 16)

        return `NEG.W ${board.cpu.registers.getDisplay16(rd)}`
    }
})

InstructionTable.aHaL_bH.register(0x17, 0xd, {
    name: "EXTS.W Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd)

        const value = rdValue & 0x80 ? (rdValue & 0xFF) | 0xFF00 : rdValue & 0xFF
        board.cpu.registers.setRegister16(rd, value)

        setMovFlags(board.cpu, value, 16)
    }
})

InstructionTable.aHaL_bH.register(0x17, 0xf, {
    name: "EXTS.L Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister32(rd)

        const value = rdValue & 0x8000 ? (rdValue & 0xFFFF) | 0xFFFF0000 : rdValue & 0xFFFF
        board.cpu.registers.setRegister32(rd, value)

        setMovFlags(board.cpu, value, 16)
    }
})

InstructionTable.aHaL_bH.register(0x1a, 0x0, {
    name: "DEC.B Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister8(rd)
        const value = rdValue - 1
        board.cpu.registers.setRegister8(rd, value)

        setDecFlags(board.cpu, rdValue, 8)
    }
})

InstructionTable.aHaL_bH.register(0x1a, range(0x8, 0xF), {
    name: "SUB.L ERs, ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const erd = opcodes.bL
        const erdValue = board.cpu.registers.getRegister32(erd)

        const ers = opcodes.bH
        const ersValue = board.cpu.registers.getRegister32(ers)

        const value = erdValue - ersValue
        board.cpu.registers.setRegister32(erd, value)

        setSubFlags(board.cpu, erdValue, ersValue, 32)
    }
})

InstructionTable.aHaL_bH.register(0x1b, 0x0, {
    name: "SUBS #1, ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = board.cpu.registers.getRegister32(opcodes.bL)
        board.cpu.registers.setRegister32(opcodes.bL, rd - 1)
    }
})

InstructionTable.aHaL_bH.register(0x1b, 0x5, {
    name: "DEC.W #1, Rd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd)
        const value = rdValue - 1
        board.cpu.registers.setRegister16(rd, value)

        setDecFlags(board.cpu, rdValue, 16)
    }
})

InstructionTable.aHaL_bH.register(0x1b, 0x8, {
    name: "SUBS #2, ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const rd = board.cpu.registers.getRegister32(opcodes.bL)
        board.cpu.registers.setRegister32(opcodes.bL, rd - 2)
    }
})

InstructionTable.aHaL_bH.register(0x1b, 0x9, {
    name: "SUBS #4, ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const erd = opcodes.bL
        const erdValue = board.cpu.registers.getRegister32(erd)
        board.cpu.registers.setRegister32(erd, toUnsignedInt(erdValue - 4))
    }
})


InstructionTable.aHaL_bH.register(0x1F, range(0x8, 0xF), {
    name: "CMP.L ERs, ERd",
    bytes: 2,
    cycles: 1,
    execute: (board, opcodes) => {
        const ers = opcodes.bH
        const erd = opcodes.bL

        const rsValue = board.cpu.registers.getRegister32(ers)
        const rdValue = board.cpu.registers.getRegister32(erd)

        setSubFlags(board.cpu, rdValue, rsValue, 32)

        return `CMP.L ${board.cpu.registers.getDisplay32(ers)}, ${board.cpu.registers.getDisplay32(erd)}`
    }
})

InstructionTable.aHaL_bH.register(0x58, 0x2, {
    name: "BHI d:16",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        const disp = toSignedShort(opcodes.cd)
        if (!(board.cpu.flags.C || board.cpu.flags.Z))
            board.cpu.registers.pc += disp

        return `BHI ${disp}`
    }
})

InstructionTable.aHaL_bH.register(0x58, 0x3, {
    name: "BLS d:16",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        const disp = toSignedShort(opcodes.cd)
        if (board.cpu.flags.C || board.cpu.flags.Z)
            board.cpu.registers.pc += disp

        return `BLS ${disp}`
    }
})

InstructionTable.aHaL_bH.register(0x58, 0x4, {
    name: "BCC d:16",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        const disp = toSignedShort(opcodes.cd)
        if (!board.cpu.flags.C)
            board.cpu.registers.pc += disp

        return `BCC ${disp}`
    }
})

InstructionTable.aHaL_bH.register(0x58, 0x5, {
    name: "BCS d:16",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        const disp = toSignedShort(opcodes.cd)
        if (board.cpu.flags.C)
            board.cpu.registers.pc += disp

        return `BCS ${disp}`
    }
})

InstructionTable.aHaL_bH.register(0x58, 0x6, {
    name: "BNE d:16",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        const disp = toSignedShort(opcodes.cd)
        if (!board.cpu.flags.Z)
            board.cpu.registers.pc += disp

        return `BNE ${disp}`
    }
})

InstructionTable.aHaL_bH.register(0x58, 0x7, {
    name: "BEQ d:16",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        const disp = toSignedShort(opcodes.cd)
        if (board.cpu.flags.Z)
            board.cpu.registers.pc += disp

        return `BEQ ${disp}`
    }
})

InstructionTable.aHaL_bH.register(0x58, 0xC, {
    name: "BGE d:16",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        const disp = toSignedShort(opcodes.cd)
        if (board.cpu.flags.N == board.cpu.flags.V)
            board.cpu.registers.pc += disp

        return `BGE ${disp}`
    }
})


InstructionTable.aHaL_bH.register(0x58, 0xD, {
    name: "BLT d:16",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        const disp = toSignedShort(opcodes.cd)
        if (board.cpu.flags.N != board.cpu.flags.V)
            board.cpu.registers.pc += disp

        return `BLT ${disp}`
    }
})

InstructionTable.aHaL_bH.register(0x79, 0x0, {
    name: "MOV.W #xx:16, Rd",
    bytes: 4,
    cycles: 2,
    execute: (board, opcodes) => {

        const rd = opcodes.bL;
        const imm = opcodes.cd
        board.cpu.registers.setRegister16(rd, imm)

        setMovFlags(board.cpu, imm, 16)

        return `MOV.W ${imm.toString(16)}, ${board.cpu.registers.getDisplay16(rd)}`
    }
})

InstructionTable.aHaL_bH.register(0x79, 0x1, {
    name: "ADD.W #xx:16, Rd",
    bytes: 4,
    cycles: 2,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd)

        const imm = opcodes.cd

        const value = imm + rdValue
        board.cpu.registers.setRegister16(rd, value)

        setAddFlags(board.cpu, rdValue, imm, 16)
    }
})

InstructionTable.aHaL_bH.register(0x79, 0x2, {
    name: "CMP.W #xx:16, Rd",
    bytes: 4,
    cycles: 2,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd)

        const imm = opcodes.cd

        setSubFlags(board.cpu, rdValue, imm, 16)
    }
})

InstructionTable.aHaL_bH.register(0x79, 0x3, {
    name: "SUB.W #xx:16, Rd",
    bytes: 4,
    cycles: 2,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd)

        const imm = opcodes.cd

        board.cpu.registers.setRegister16(rd, rdValue - imm)

        setSubFlags(board.cpu, rdValue, imm, 16)
    }
})

InstructionTable.aHaL_bH.register(0x79, 0x4, {
    name: "OR.W #xx:16, Rd",
    bytes: 4,
    cycles: 2,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd)

        const imm = opcodes.cd

        const value = rdValue | imm
        board.cpu.registers.setRegister16(rd, value)

        setMovFlags(board.cpu, value, 16)
    }
})

InstructionTable.aHaL_bH.register(0x79, 0x6, {
    name: "AND.W #xx:16, Rd",
    bytes: 4,
    cycles: 2,
    execute: (board, opcodes) => {
        const rd = opcodes.bL
        const rdValue = board.cpu.registers.getRegister16(rd)

        const imm = opcodes.cd

        const value = imm & rdValue
        board.cpu.registers.setRegister16(rd, value)

        setMovFlags(board.cpu, value, 16)

        return `AND.W 0x${imm.toString(16)}, ${board.cpu.registers.getDisplay16(rd)}`
    }
})


InstructionTable.aHaL_bH.register(0x7A, 0x0, {
    name: "MOV.L #xx:32, ERd",
    bytes: 6,
    cycles: 3,
    execute: (board, opcodes) => {
        const erd = opcodes.bL

        const imm = (opcodes.cd << 16) | opcodes.ef

        board.cpu.registers.setRegister32(erd, imm)
        setMovFlags(board.cpu, imm, 32)
    }
})

InstructionTable.aHaL_bH.register(0x7A, 0x1, {
    name: "ADD.L #xx:32, ERd",
    bytes: 6,
    cycles: 3,
    execute: (board, opcodes) => {
        const erd = opcodes.bL
        const erdValue = board.cpu.registers.getRegister32(erd)

        const imm = (opcodes.cd << 16) | opcodes.ef

        const value = erdValue + imm
        board.cpu.registers.setRegister32(erd, value)
        setAddFlags(board.cpu, erdValue, imm, 32)
    }
})

InstructionTable.aHaL_bH.register(0x7A, 0x2, {
    name: "CMP.L #xx:32, ERd",
    bytes: 6,
    cycles: 3,
    execute: (board, opcodes) => {
        const erd = opcodes.bL
        const erdValue = board.cpu.registers.getRegister32(erd)

        const imm = (opcodes.cd << 16) | opcodes.ef

        setSubFlags(board.cpu, erdValue, imm, 32)
    }
})

//endregion

//region InstructionTable.aHaLbHbLcH_cL

InstructionTable.aHaLbHbLcH_cL.register(0x1c05, 0x2, {
    name: "MULXS.W Rs, ERd",
    bytes: 4,
    cycles: 2 + 20,
    execute: (board, opcodes) => {
        const rs = opcodes.dH
        const rsValue = board.cpu.registers.getRegister16(rs)

        const erd = opcodes.dL
        const erdValue = board.cpu.registers.getRegister32(erd)

        const value = (erdValue & 0xFFFF) * (rsValue)
        board.cpu.registers.setRegister32(erd, value)

        board.cpu.flags.Z = value == 0
        board.cpu.flags.N = Boolean(value & 0x80000000)
    }
})

InstructionTable.aHaLbHbLcH_cL.register(0x1d05, 0x3, {
    name: "DIVXS.W Rs, ERd",
    bytes: 4,
    cycles: 2 + 20,
    execute: (board, opcodes) => {
        const rs = opcodes.dH
        const rsValue = board.cpu.registers.getRegister16(rs)

        const erd = opcodes.dL
        const erdValue = board.cpu.registers.getRegister32(erd)

        const quotient = toSignedShort(toSignedInt(erdValue) / toSignedShort(rsValue))
        const remainder = toSignedShort(toSignedInt(erdValue) % toSignedShort(rsValue))

        board.cpu.registers.setRegister32(erd, (remainder << 16) | quotient)

        board.cpu.flags.Z = quotient == 0
        board.cpu.flags.N = Boolean(quotient < 0)
    }
})

InstructionTable.aHaLbHbLcH_cL.register(0x1F06, 0x5, {
    name: "XOR.L ERs, ERd",
    bytes: 4,
    cycles: 2,
    execute: (board, opcodes) => {
        const ers = opcodes.dH
        const erd = opcodes.dL

        const ersValue = board.cpu.registers.getRegister32(ers)
        const erdValue = board.cpu.registers.getRegister32(erd)

        const value = ersValue ^ erdValue
        board.cpu.registers.setRegister32(erd, value)

        setMovFlags(board.cpu, value, 32)
    }
})

InstructionTable.aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7D && (num & 0xF) == 0x06, num => num == 0x7, {
    name: "BST #xx:3, @ERd",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        if (opcodes.dH >> 3 == 1) { // BIST ??
            debugger
        }

        const erd = opcodes.bH
        const erdValue = board.cpu.registers.getRegister32(erd)
        const memoryValue = board.ram.readByte(erdValue)

        const imm = opcodes.dH

        if (board.cpu.flags.C) {
            board.ram.writeByte(erdValue, memoryValue | (1 << imm))
        } else {
            board.ram.writeByte(erdValue, memoryValue & ~(1 << imm))
        }

    }
})

InstructionTable.aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7D && (num & 0xFF) == 0x07, num => num == 0x0, {
    name: "BSET #xx:3, @ERd",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        const bit = opcodes.dH & 0b111
        const erd = opcodes.bH
        const erdValue = board.cpu.registers.getRegister32(erd) & 0xFFFF

        board.ram.writeByte(erdValue, board.ram.readByte(erdValue) | (1 << bit))
    }
})

InstructionTable.aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7D && (num & 0xFF) == 0x07, num => num == 0x2, {
    name: "BCLR #xx:3, @ERd",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        const bit = opcodes.dH & 0b111
        const erd = opcodes.bH
        const erdValue = board.cpu.registers.getRegister32(erd) & 0xFFFF

        board.ram.writeByte(erdValue, board.ram.readByte(erdValue) & ~(1 << bit))
    }
})

InstructionTable.aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7E && (num & 0xF) == 0x07, num => num == 0x7, {
    name: "BLD #xx:3, @aa:8",
    bytes: 4,
    cycles: 2 + 1,
    execute: (board, opcodes) => {
        if (opcodes.dH >> 3 == 1) { // BILD ??
            debugger
        }

        const bit = opcodes.dH & 0b111
        const addr = opcodes.b | 0xFF00
        const memoryValue = board.ram.readByte(addr)

        board.cpu.flags.C = Boolean((memoryValue >> bit) & 1)
    }
})

InstructionTable.aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7F && (num & 0xF) == 0x7, num => num == 0x0, {
    name: "BSET #xx:3, @aa:8",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        const bit = opcodes.dH & 0b111
        const addr = opcodes.b | 0xFF00

        board.ram.writeByte(addr, board.ram.readByte(addr) | (1 << bit))
    }
})

InstructionTable.aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7F && (num & 0xF) == 0x7, num => num == 0x2, {
    name: "BCLR #xx:3, @aa:8",
    bytes: 4,
    cycles: 2 + 2,
    execute: (board, opcodes) => {
        const bit = opcodes.dH & 0b111
        const addr = opcodes.b | 0xFF00

        board.ram.writeByte(addr, board.ram.readByte(addr) & ~(1 << bit))
    }
})

//endregion
