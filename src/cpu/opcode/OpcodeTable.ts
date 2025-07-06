import {OpcodeContainer} from "./OpcodeContainer";
import {range} from "../../utils/CollectionUtils";
import {setAddFlags, setDecFlags, setIncFlags, setMovFlags, setSubFlags} from "./OpcodeFlags";
import {toSignedByte, toSignedShort, toUnsignedInt, toUnsignedShort} from "../../utils/BitUtils";
import {SSRDR_ADDR, SSSR_RECEIVE_DATA_FULL, SSSR_TRANSMIT_EMPTY, SSSR_TRANSMIT_END, SSTDR_ADDR} from "../../ssu/Ssu";
import {TIMER_B_COUNTER_ADDR} from "../timer/TimerB";

export const opcodeTable_aH_aL = new OpcodeContainer("opcodeTable_aH_aL", cpu => cpu.instructions.aH, cpu => cpu.instructions.aL)
export const opcodeTable_aHaL_bH = new OpcodeContainer("opcodeTable_aHaL_bH", cpu => (cpu.instructions.aH << 4) | cpu.instructions.aL, cpu => cpu.instructions.bH)
export const opcodeTable_aHaLbHbLcH_cL = new OpcodeContainer("opcodeTable_aHaLbHbLcH_cL", cpu => (cpu.instructions.a << 12) | (cpu.instructions.b << 4) | cpu.instructions.cH, cpu => cpu.instructions.cL)

// opcodeTable_aH_aL
opcodeTable_aH_aL.register(0x0, [0x1, 0xA, 0xB, 0xF], opcodeTable_aHaL_bH.opcode)
opcodeTable_aH_aL.register(0x1, [...range(0x0, 0x3), 0x7, 0xA, 0xB, 0xF], opcodeTable_aHaL_bH.opcode)
opcodeTable_aH_aL.register(0x5, 0x8, opcodeTable_aHaL_bH.opcode)
opcodeTable_aH_aL.register(0x7, [0x9, 0xA], opcodeTable_aHaL_bH.opcode)
opcodeTable_aH_aL.register(0x7, range(0xC, 0xF), opcodeTable_aHaLbHbLcH_cL.opcode)

opcodeTable_aHaL_bH.register(0x1, 0xC, opcodeTable_aHaLbHbLcH_cL.opcode)
opcodeTable_aHaL_bH.register(0x1, 0xD, opcodeTable_aHaLbHbLcH_cL.opcode)
opcodeTable_aHaL_bH.register(0x1, 0xF, opcodeTable_aHaLbHbLcH_cL.opcode)

//region opcodeTable_aH_aL
opcodeTable_aH_aL.register(0x0, 0x0, {
    name: "NOP",
    bytes: 2,
    execute: () => "NOP"
})

opcodeTable_aH_aL.register(0x0, 0x2, {
    name: "STC.B CCR, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        cpu.registers.setRegister8(rd, cpu.flags.ccr)
    }
})

opcodeTable_aH_aL.register(0x0, 0x3, {
    name: "LDC.B Rs, CCR",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bL
        const rsValue = cpu.registers.getRegister8(rs)
        cpu.flags.ccr = rsValue
    }
})

opcodeTable_aH_aL.register(0x0, 0x4, {
    name: "ORC #xx:8, CCR",
    bytes: 2,
    execute: cpu => {
        const imm = cpu.instructions.b
        cpu.flags.ccr |= imm
    }
})

opcodeTable_aH_aL.register(0x0, 0x5, {
    name: "XORC #xx:8, CCR",
    bytes: 2,
    execute: cpu => {
        const imm = cpu.instructions.b
        cpu.flags.ccr ^= imm
    }
})

opcodeTable_aH_aL.register(0x0, 0x6, {
    name: "ANDC #xx:8, CCR",
    bytes: 2,
    execute: cpu => {
        const imm = cpu.instructions.b

        cpu.flags.ccr &= imm
    }
})

opcodeTable_aH_aL.register(0x0, 0x7, {
    name: "LDC.B #xx:8, CCR",
    bytes: 2,
    execute: cpu => {
        const imm = cpu.instructions.b

        cpu.flags.ccr = imm
    }
})

opcodeTable_aH_aL.register(0x0, 0x8, {
    name: "ADD.B Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister8(rs)
        const rdValue = cpu.registers.getRegister8(rd)

        const value = rdValue + rsValue
        cpu.registers.setRegister8(rd, value)

        setAddFlags(cpu, rdValue, rsValue, 8)

        return `ADD.B ${cpu.registers.getDisplay8(rs)}, ${cpu.registers.getDisplay8(rd)}`
    }
})

opcodeTable_aH_aL.register(0x0, 0x9, {
    name: "ADD.W Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister16(rs)
        const rdValue = cpu.registers.getRegister16(rd)

        const value = rdValue + rsValue
        cpu.registers.setRegister16(rd, value)

        setAddFlags(cpu, rdValue, rsValue, 16)

        return `ADD.W ${cpu.registers.getDisplay16(rs)}, ${cpu.registers.getDisplay16(rd)}`
    }
})

opcodeTable_aH_aL.register(0x0, 0xC, {
    name: "MOV.B Rs,Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister8(rs)

        cpu.registers.setRegister8(rd, rsValue)

        setMovFlags(cpu, rsValue, 8)

        return `MOV.B ${cpu.registers.getDisplay8(rs)}, ${cpu.registers.getDisplay8(rd)}`
    }
})

opcodeTable_aH_aL.register(0x0, 0xD, {
    name: "MOV.W Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister16(rs)

        cpu.registers.setRegister16(rd, rsValue)

        setMovFlags(cpu, rsValue, 16)

        return `MOV.W ${cpu.registers.getDisplay16(rs)}, ${cpu.registers.getDisplay16(rd)}`
    }
})

opcodeTable_aH_aL.register(0x0, 0xE, {
    name: "ADDX Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister8(rs)
        const rdValue = cpu.registers.getRegister8(rd)

        const value = rdValue + rsValue + Number(cpu.flags.C)
        cpu.registers.setRegister8(rd, value)

        setAddFlags(cpu, rdValue, rsValue + Number(cpu.flags.C), 8)
    }
})

opcodeTable_aH_aL.register(0x1, 0x4, {
    name: "OR.B Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister8(rs)
        const rdValue = cpu.registers.getRegister8(rd)

        const value = rsValue | rdValue
        cpu.registers.setRegister8(rd, value)

        setMovFlags(cpu, value, 8)
    }
})

opcodeTable_aH_aL.register(0x1, 0x5, {
    name: "XOR.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister8(rs)
        const rdValue = cpu.registers.getRegister8(rd)

        const value = rsValue ^ rdValue
        cpu.registers.setRegister8(rd, value)

        setMovFlags(cpu, value, 8)
    }
})

opcodeTable_aH_aL.register(0x1, 0x6, {
    name: "AND.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister8(rs)
        const rdValue = cpu.registers.getRegister8(rd)

        const value = rsValue & rdValue
        cpu.registers.setRegister8(rd, value)

        setMovFlags(cpu, value, 8)
    }
})

opcodeTable_aH_aL.register(0x1, 0x8, {
    name: "SUB.B Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister8(rs)
        const rdValue = cpu.registers.getRegister8(rd)

        cpu.registers.setRegister8(rd, rdValue - rsValue)

        setSubFlags(cpu, rdValue, rsValue, 8)
    }
})

opcodeTable_aH_aL.register(0x1, 0x9, {
    name: "SUB.W Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister16(rs)
        const rdValue = cpu.registers.getRegister16(rd)

        cpu.registers.setRegister16(rd, rdValue - rsValue)

        setSubFlags(cpu, rdValue, rsValue, 16)
    }
})

opcodeTable_aH_aL.register(0x1, 0xC, {
    name: "CMP.B Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rsValue = cpu.registers.getRegister8(cpu.instructions.bH)
        const rdValue = cpu.registers.getRegister8(cpu.instructions.bL)

        setSubFlags(cpu, rdValue, rsValue, 8)
    }
})

opcodeTable_aH_aL.register(0x1, 0xD, {
    name: "CMP.W Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL
        const rsValue = cpu.registers.getRegister16(rs)
        const rdValue = cpu.registers.getRegister16(rd)

        setSubFlags(cpu, rdValue, rsValue, 16)

        return `CMP.W ${cpu.registers.getDisplay16(rs)}, ${cpu.registers.getDisplay16(rd)}`
    }
})

opcodeTable_aH_aL.register(0x1, 0xE, {
    name: "SUBX Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.registers.getRegister8(cpu.instructions.bH)
        const rd = cpu.registers.getRegister8(cpu.instructions.bL)

        const value = rd - rs - Number(cpu.flags.C)
        cpu.registers.setRegister8(cpu.instructions.bL, value)

        setSubFlags(cpu, rd, rs + Number(cpu.flags.C), 8)
    }
})

opcodeTable_aH_aL.register(0x2, range(0x0, 0xF), {
    name: "MOV.B @aa:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL;

        const addr = (cpu.instructions.b & 0xFF) | 0xFF00
        const value = cpu.memory.readByte(addr)

        cpu.registers.setRegister8(rd, value)

        setMovFlags(cpu, value, 8)
    }
})

opcodeTable_aH_aL.register(0x3, range(0x0, 0xF), {
    name: "MOV.B Rs, @aa:8",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.aL;
        const value = cpu.registers.getRegister8(rs)

        const addr = (cpu.instructions.b & 0xFF) | 0xFF00
        cpu.memory.writeByte(addr, value)

        setMovFlags(cpu, value, 8)
    }
})

opcodeTable_aH_aL.register(0x4, 0x0, {
    name: "BRA d:8",
    bytes: 2,
    execute: cpu => {
        cpu.registers.pc += toSignedByte(cpu.instructions.b)

    }
})

opcodeTable_aH_aL.register(0x4, 0x2, {
    name: "BHI d:8",
    bytes: 2,
    execute: cpu => {
        const disp = toSignedByte(cpu.instructions.b)
        if (!(cpu.flags.C || cpu.flags.Z))
            cpu.registers.pc += disp

        return `BHI ${disp}`
    }
})

opcodeTable_aH_aL.register(0x4, 0x3, {
    name: "BLS d:8",
    bytes: 2,
    execute: cpu => {
        const disp = toSignedByte(cpu.instructions.b)
        if (cpu.flags.C || cpu.flags.Z)
            cpu.registers.pc += disp

        return `BLS ${disp}`
    }
})

opcodeTable_aH_aL.register(0x4, 0x4, {
    name: "BCC d:8",
    bytes: 2,
    execute: cpu => {
        const disp = toSignedByte(cpu.instructions.b)
        if (!cpu.flags.C)
            cpu.registers.pc += disp

        return `BCC ${disp}`
    }
})

opcodeTable_aH_aL.register(0x4, 0x5, {
    name: "BCS d:8",
    bytes: 2,
    execute: cpu => {
        const disp = toSignedByte(cpu.instructions.b)
        if (cpu.flags.C)
            cpu.registers.pc += disp

        return `BCS ${disp}`
    }
})

opcodeTable_aH_aL.register(0x4, 0x6, {
    name: "BNE d:8",
    bytes: 2,
    execute: cpu => {
        const disp = toSignedByte(cpu.instructions.b)
        if (!cpu.flags.Z)
            cpu.registers.pc += disp

        return `BNE ${disp}`
    }
})

opcodeTable_aH_aL.register(0x4, 0x7, {
    name: "BEQ d:8",
    bytes: 2,
    execute: cpu => {
        const disp = toSignedByte(cpu.instructions.b)
        if (cpu.flags.Z)
            cpu.registers.pc += disp

        return `BEQ ${disp}`
    }
})

opcodeTable_aH_aL.register(0x4, 0xA, {
    name: "BPL d:8",
    bytes: 2,
    execute: cpu => {
        const disp = toSignedByte(cpu.instructions.b)
        if (!cpu.flags.N)
            cpu.registers.pc += disp

        return `BPL ${disp}`
    }
})

opcodeTable_aH_aL.register(0x4, 0xB, {
    name: "BMI d:8",
    bytes: 2,
    execute: cpu => {
        const disp = toSignedByte(cpu.instructions.b)
        if (cpu.flags.N)
            cpu.registers.pc += disp

        return `BMI ${disp}`
    }
})

opcodeTable_aH_aL.register(0x4, 0xC, {
    name: "BGE d:8",
    bytes: 2,
    execute: cpu => {
        const disp = toSignedByte(cpu.instructions.b)
        if (cpu.flags.N == cpu.flags.V)
            cpu.registers.pc += disp

        return `BGE ${disp}`
    }
})

opcodeTable_aH_aL.register(0x4, 0xD, {
    name: "BLT d:8",
    bytes: 2,
    execute: cpu => {
        const disp = toSignedByte(cpu.instructions.b)
        if (cpu.flags.N != cpu.flags.V)
            cpu.registers.pc += disp

        return `BLT ${disp}`
    }
})

opcodeTable_aH_aL.register(0x5, 0x0, {
    name: "MULXU.B Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rsValue = cpu.registers.getRegister8(rs)

        const rd = cpu.instructions.bL & 0b111
        const rdValue = cpu.registers.getRegister16(rd)

        cpu.registers.setRegister16(rd, (rdValue & 0xFF) * (rsValue))
    }
})

opcodeTable_aH_aL.register(0x5, 0x1, {
    name: "DIVXU.B Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rsValue = cpu.registers.getRegister8(rs)

        const erd = cpu.instructions.bL & 0b111
        const erdValue = cpu.registers.getRegister16(erd)

        const quotient = toUnsignedShort(erdValue / rsValue)
        const remainder = toUnsignedShort(erdValue % rsValue)

        cpu.registers.setRegister16(erd, (remainder << 8) | quotient)

        cpu.flags.Z = rsValue == 0
        cpu.flags.N = Boolean(rsValue & 0b1000_0000)
    }
})

opcodeTable_aH_aL.register(0x5, 0x2, {
    name: "MULXU.W Rs, ERd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rsValue = cpu.registers.getRegister16(rs)

        const erd = cpu.instructions.bL
        const erdValue = cpu.registers.getRegister32(erd)

        cpu.registers.setRegister32(erd, (erdValue & 0xFFFF) * (rsValue))
    }
})

opcodeTable_aH_aL.register(0x5, 0x3, {
    name: "DIVXU.W Rs, ERd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rsValue = cpu.registers.getRegister16(rs)

        const erd = cpu.instructions.bL
        const erdValue = cpu.registers.getRegister32(erd)

        const quotient = toUnsignedInt(erdValue / rsValue)
        const remainder = toUnsignedInt(erdValue % rsValue)

        cpu.registers.setRegister32(erd, (remainder << 16) | quotient)

        cpu.flags.Z = rsValue == 0
        cpu.flags.N = Boolean(rsValue & 0b1000_0000_0000_0000)
    }
})

opcodeTable_aH_aL.register(0x5, 0x4, {
    name: "RTS",
    bytes: 0,
    execute: cpu => {
        cpu.registers.pc = cpu.registers.popStack()
    }
})

opcodeTable_aH_aL.register(0x5, 0x5, {
    name: "BSR d:8",
    bytes: 2,
    execute: cpu => {
        const disp = toSignedByte(cpu.instructions.b)

        cpu.registers.pushStack(cpu.registers.pc + 2)

        cpu.registers.pc += disp

        return `BSR ${disp}`
    }
})


opcodeTable_aH_aL.register(0x5, 0x6, {
    name: "RTE",
    bytes: 0,
    execute: cpu => {
        cpu.registers.pc = cpu.interrupts.savedAddress
        cpu.flags = cpu.interrupts.savedFlags
    }
})

opcodeTable_aH_aL.register(0x5, 0x9, {
    name: "JMP @ERn",
    bytes: 0,
    execute: cpu => {
        const ern = cpu.instructions.bH
        const ernValue = cpu.registers.getRegister32(ern)

        // TODO debug registers
        cpu.registers.pc = ernValue & 0xFFFF

        return `JMP @0x${cpu.registers.pc.toString(16)}`
    }
})

opcodeTable_aH_aL.register(0x5, 0xA, {
    name: "JMP @aa:24",
    bytes: 0,
    execute: cpu => {
        cpu.registers.pc = (cpu.instructions.b << 16) | cpu.instructions.cd

        return `JMP @0x${cpu.registers.pc.toString(16)}`
    }
})

opcodeTable_aH_aL.register(0x5, 0xD, {
    name: "JSR @ERn",
    bytes: 0,
    execute: cpu => {
        const ern = cpu.instructions.bH
        const ernValue = cpu.registers.getRegister32(ern) & 0xFFFF

        cpu.registers.pushStack(cpu.registers.pc + 2)

        cpu.registers.pc = ernValue

        return `JSR @${cpu.registers.getRegister32(ern)}`
    }
})

opcodeTable_aH_aL.register(0x5, 0xE, {
    name: "JSR @aa:24",
    bytes: 0,
    execute: cpu => {
        cpu.registers.pushStack(cpu.registers.pc + 4)

        const addr = (cpu.instructions.b << 16) | cpu.instructions.cd
        cpu.registers.pc = addr

        return `JSR 0x${addr.toString(16)}`
    }
})

opcodeTable_aH_aL.register(0x6, 0x0, {
    name: "BSET #xx:3, Rd",
    bytes: 2,
    execute: cpu => {
        const rn = cpu.instructions.bH
        const rnValue = cpu.registers.getRegister8(rn)

        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister8(rd)

        cpu.registers.setRegister8(rd, rdValue | (1 << rnValue))

        return `BSET #${rnValue}, ${cpu.registers.getDisplay8(rd)}`
    }
})

opcodeTable_aH_aL.register(0x6, 0x4, {
    name: "OR.W Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister16(rs)
        const rdValue = cpu.registers.getRegister16(rd)

        const value = rsValue | rdValue
        cpu.registers.setRegister16(rd, value)

        setMovFlags(cpu, value, 16)
    }
})

opcodeTable_aH_aL.register(0x6, 0x5, {
    name: "XOR.W Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister16(rs)
        const rdValue = cpu.registers.getRegister16(rd)

        const value = rsValue ^ rdValue
        cpu.registers.setRegister16(rd, value)

        setMovFlags(cpu, value, 16)
    }
})

opcodeTable_aH_aL.register(0x6, 0x6, {
    name: "AND.W Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister16(rs)
        const rdValue = cpu.registers.getRegister16(rd)

        const value = rsValue & rdValue
        cpu.registers.setRegister16(rd, value)

        setMovFlags(cpu, value, 16)
    }
})

opcodeTable_aH_aL.register(0x6, 0x8, {
    name: "MOV.B @ERs,Rd / MOV.B Rs, @ERd",
    bytes: 2,
    execute: cpu => {
        const toMemory = (cpu.instructions.bH >> 3) & 1
        if (toMemory) {
            const rs = cpu.instructions.bL
            const rsValue = cpu.registers.getRegister8(rs)

            const erd = cpu.instructions.bH
            const erdValue = cpu.registers.getRegister32(erd)

            cpu.memory.writeByte(erdValue, rsValue)
            setMovFlags(cpu, rsValue, 8)

            return `MOV.B ${cpu.registers.getDisplay8(rs)}, @${cpu.registers.getDisplay32(erd)}`
        } else {

            const ers = cpu.instructions.bH
            const ersValue = cpu.registers.getRegister32(ers)
            const memoryValue = cpu.memory.readByte(ersValue)

            const rd = cpu.instructions.bL
            cpu.registers.setRegister8(rd, memoryValue)
            setMovFlags(cpu, memoryValue, 8)
            return `MOV.B @${cpu.registers.getDisplay32(ers)}, ${cpu.registers.getDisplay8(rd)}`
        }
    }
})

opcodeTable_aH_aL.register(0x6, 0x9, {
    name: "MOV.W @ERs,Rd / MOV.W Rs, @ERd",
    bytes: 2,
    execute: cpu => {
        const toMemory = (cpu.instructions.bH >> 3) & 1
        if (toMemory) {
            const rs = cpu.instructions.bL
            const rsValue = cpu.registers.getRegister16(rs)

            const erd = cpu.instructions.bH
            const erdValue = cpu.registers.getRegister32(erd)

            cpu.memory.writeShort(erdValue, rsValue)
            setMovFlags(cpu, rsValue, 16)

            return `MOV.W ${cpu.registers.getDisplay16(rs)}, @${cpu.registers.getDisplay32(erd)}`
        } else {

            const ers = cpu.instructions.bH
            const ersValue = cpu.registers.getRegister32(ers)
            const memoryValue = cpu.memory.readShort(ersValue)

            const rd = cpu.instructions.bL
            cpu.registers.setRegister16(rd, memoryValue)
            setMovFlags(cpu, memoryValue, 16)
            return `MOV.W @${cpu.registers.getDisplay32(ers)}, ${cpu.registers.getDisplay16(rd)}`
        }
    }
})

opcodeTable_aH_aL.register(0x6, 0xA, {
    name: "MOV.B Rs, @aa:16/24 / MOV.B @aa:16/24, Rd",
    bytes: 0, // inc pc within execute func
    execute: cpu => {
        switch (cpu.instructions.bH) {
            case 0x8: // Rs, @aa:16
            {
                const rs = cpu.instructions.bL;
                const value = cpu.registers.getRegister8(rs)
                const addr = cpu.instructions.cd
                cpu.memory.writeByte(addr, value)
                setMovFlags(cpu, value, 8)

                cpu.registers.pc += 4

                // TODO create handlers through writeByte for specific memory addresses
                if (addr == SSTDR_ADDR) {
                    cpu.ssu.statusRegister &= ~SSSR_TRANSMIT_EMPTY
                    cpu.ssu.statusRegister &= ~SSSR_TRANSMIT_END
                }

                if (addr == TIMER_B_COUNTER_ADDR) {
                    cpu.timers.B.loadValue = value
                }

                return `MOV.B ${cpu.registers.getDisplay8(rs)}, @0x${addr.toString(16)}`
            }
            case 0xA: // Rs, @aa:32
            {
                const rs = cpu.instructions.bL;
                const value = cpu.registers.getRegister8(rs)
                const addr = (cpu.instructions.cd << 16) | cpu.instructions.ef
                cpu.memory.writeByte(addr, value)
                setMovFlags(cpu, value, 8)

                cpu.registers.pc += 6

                return `MOV.B ${cpu.registers.getDisplay8(rs)}, @0x${addr.toString(16)}`
            }
            case 0x0: // @aa:16, Rd
            {
                const rd = cpu.instructions.bL;

                const addr = cpu.instructions.cd
                const memoryValue = cpu.memory.readByte(addr)
                cpu.registers.setRegister8(rd, memoryValue)
                setMovFlags(cpu, memoryValue, 8)

                cpu.registers.pc += 4

                // TODO create handlers through writeByte for specific memory addresses
                if (addr == SSRDR_ADDR) {
                    cpu.ssu.statusRegister &= ~SSSR_RECEIVE_DATA_FULL
                }

                return `MOV.B @0x${addr.toString(16)}, ${cpu.registers.getDisplay8(rd)}`
            }
            case 0x2: // @aa:24, Rd
            {
                const rd = cpu.instructions.bL;

                const addr = (cpu.instructions.cd << 16) | cpu.instructions.ef
                const memoryValue = cpu.memory.readByte(addr)
                cpu.registers.setRegister8(rd, memoryValue)
                setMovFlags(cpu, memoryValue, 8)

                cpu.registers.pc += 6

                return `MOV.B @0x${addr.toString(16)}, ${cpu.registers.getDisplay8(rd)}`
            }
            default: {
                return
            }
        }
    }
})


opcodeTable_aH_aL.register(0x6, 0xB, {
    name: "MOV.W Rs, @aa:16/24 / MOV.W @aa:16/24, Rd",
    bytes: 0,
    execute: cpu => {
        switch (cpu.instructions.bH) {
            case 0x8: // Rs, @aa:16
            {
                const rs = cpu.instructions.bL;
                const value = cpu.registers.getRegister16(rs)
                const addr = cpu.instructions.cd
                cpu.memory.writeShort(addr, value)
                setMovFlags(cpu, value, 16)

                cpu.registers.pc += 4

                return `MOV.W ${cpu.registers.getDisplay16(rs)}, @0x${addr.toString(16)}`
            }
            case 0xA: // Rs, @aa:32
            {
                const rs = cpu.instructions.bL;
                const value = cpu.registers.getRegister16(rs)
                const addr = (cpu.instructions.cd << 16) | cpu.instructions.ef
                cpu.memory.writeShort(addr, value)
                setMovFlags(cpu, value, 16)

                cpu.registers.pc += 6

                return `MOV.W ${cpu.registers.getDisplay16(rs)}, @0x${addr.toString(16)}`
            }
            case 0x0: // @aa:16, Rd
            {
                const rd = cpu.instructions.bL;

                const addr = cpu.instructions.cd
                const memoryValue = cpu.memory.readShort(addr)
                cpu.registers.setRegister16(rd, memoryValue)
                setMovFlags(cpu, memoryValue, 16)

                cpu.registers.pc += 4

                return `MOV.W @0x${addr.toString(16)}, ${cpu.registers.getDisplay16(rd)}`
            }
            case 0x2: // @aa:24, Rd
            {
                const rd = cpu.instructions.bL;

                const addr = (cpu.instructions.cd << 16) | cpu.instructions.ef
                const memoryValue = cpu.memory.readShort(addr)
                cpu.registers.setRegister16(rd, memoryValue)
                setMovFlags(cpu, memoryValue, 16)

                cpu.registers.pc += 6

                return `MOV.W @0x${addr.toString(16)}, ${cpu.registers.getDisplay16(rd)}`
            }
            default: {
                return
            }
        }
    }
})

opcodeTable_aH_aL.register(0x6, 0xC, {
    name: "MOV.B @ERs+, Rd / MOV.B Rs, @-ERd",
    bytes: 2,
    execute: cpu => {

        const decrement = (cpu.instructions.bH >> 3) & 1
        if (decrement) {
            const rs = cpu.instructions.bL
            const rsValue = cpu.registers.getRegister8(rs)

            const erd = cpu.instructions.bH
            const erdValue = cpu.registers.getRegister32(erd)
            const erdAdjustValue = toUnsignedInt(erdValue - 1)
            cpu.registers.setRegister32(erd, erdAdjustValue)

            cpu.memory.writeByte(erdAdjustValue, rsValue)

            setMovFlags(cpu, rsValue, 8)
        }
        else {
            const ers = cpu.instructions.bH
            const ersRegValue = cpu.registers.getRegister32(ers)
            const ersMemoryValue = cpu.memory.readByte(ersRegValue)

            cpu.registers.setRegister32(ers, toUnsignedInt(ersRegValue + 1))

            const rd = cpu.instructions.bL & 0b111
            cpu.registers.setRegister8(rd, ersMemoryValue)
            setMovFlags(cpu, ersMemoryValue, 8)
        }

    }
})

opcodeTable_aH_aL.register(0x6, 0xD, {
    name: "MOV.W @ERs+, Rd / MOV.W Rs, @-ERd",
    bytes: 2,
    execute: cpu => {

        const decrement = (cpu.instructions.bH >> 3) & 1
        if (decrement) {
            const rs = cpu.instructions.bL
            const rsValue = cpu.registers.getRegister16(rs)

            const erd = cpu.instructions.bH
            const erdValue = cpu.registers.getRegister32(erd)
            const newAddr = toUnsignedInt(erdValue - 2)
            cpu.registers.setRegister32(erd, newAddr)

            cpu.memory.writeShort(newAddr, rsValue)

            setMovFlags(cpu, rsValue, 16)
        }
        else {
            const ers = cpu.instructions.bH
            const ersRegValue = cpu.registers.getRegister32(ers)
            const ersMemoryValue = cpu.memory.readShort(ersRegValue)

            const newValue = toUnsignedInt(ersRegValue + 2)
            cpu.registers.setRegister32(ers, newValue)

            const rd = cpu.instructions.bL
            cpu.registers.setRegister16(rd, ersMemoryValue)
            setMovFlags(cpu, ersMemoryValue, 16)
        }

    }
})

opcodeTable_aH_aL.register(0x6, 0xE, {
    name: "MOV.B @(d:16,ERs),Rd / MOV.B Rs,@(d:16,ERd)",
    bytes: 4,
    execute: cpu => {
        const disp = toUnsignedShort(cpu.instructions.cd)

        const toMemory = (cpu.instructions.bH >> 3) & 1
        if (toMemory) {
            const rs = cpu.instructions.bL
            const rsValue = cpu.registers.getRegister8(rs)

            const erd = cpu.instructions.bH
            const erdValue = cpu.registers.getRegister32(erd)

            cpu.memory.writeByte(erdValue + disp, rsValue)

            setMovFlags(cpu, rsValue, 8)
        }
        else {
            const ers = cpu.instructions.bH
            const ersRegValue = cpu.registers.getRegister32(ers)
            const memoryValue = cpu.memory.readByte(ersRegValue + disp)

            const rd = cpu.instructions.bL
            cpu.registers.setRegister8(rd, memoryValue)

            setMovFlags(cpu, memoryValue, 8)
        }

    }
})

opcodeTable_aH_aL.register(0x6, 0xF, {
    name: "MOV.W @(d:16,ERs),Rd / MOV.W Rs,@(d:16,ERd)",
    bytes: 4,
    execute: cpu => {
        const disp = toSignedShort(cpu.instructions.cd)
        const toMemory = (cpu.instructions.bH >> 3) & 1
        if (toMemory) {
            const rs = cpu.instructions.bL
            const rsValue = cpu.registers.getRegister16(rs)

            const erd = cpu.instructions.bH
            const erdValue = cpu.registers.getRegister32(erd)

            cpu.memory.writeShort(erdValue + disp, rsValue)

            setMovFlags(cpu, rsValue, 16)
        }
        else {
            const ers = cpu.instructions.bH
            const ersRegValue = cpu.registers.getRegister32(ers)
            const memoryValue = cpu.memory.readShort(ersRegValue + disp)

            const rd = cpu.instructions.bL & 0b111
            cpu.registers.setRegister16(rd, memoryValue)

            setMovFlags(cpu, memoryValue, 16)
        }

    }
})


opcodeTable_aH_aL.register(0x7, 0x0, {
    name: "BSET #xx:3, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister8(rd)

        const bit = cpu.instructions.bH & 0b111

        cpu.registers.setRegister8(rd, rdValue | (1 << bit))

        return `BSET #${bit}, ${cpu.registers.getDisplay8(rd)}`
    }
})


opcodeTable_aH_aL.register(0x7, 0x3, {
    name: "BTST #xx:3, Rd",
    bytes: 2,
    execute: cpu => {
        const bit = cpu.instructions.bH & 0b111
        const rd = cpu.registers.getRegister8(cpu.instructions.bL)

        cpu.flags.Z = !Boolean((rd >> bit) & 1)
    }
})

opcodeTable_aH_aL.register(0x7, 0x7, {
    name: "BLD #xx:3, Rd",
    bytes: 2,
    execute: cpu => {
        if (cpu.instructions.bH >> 3 == 1) { // BILD ??
            debugger
        }

        const bit = cpu.instructions.bH & 0b111
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister8(rd)

        cpu.flags.C = Boolean((rdValue >> bit) & 1)

        return `BLD #${bit}, ${cpu.registers.getDisplay8(rd)}`

    }
})

opcodeTable_aH_aL.register(0x8, range(0x0, 0xF), {
    name: "ADD.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL
        const rdValue = cpu.registers.getRegister8(rd)

        const imm = cpu.instructions.b

        const value = imm + rdValue
        cpu.registers.setRegister8(rd, value)

        setAddFlags(cpu, rdValue, imm, 8)
    }
})

opcodeTable_aH_aL.register(0x9, range(0x0, 0xF), {
    name: "ADDX #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL
        const rdValue = cpu.registers.getRegister8(rd)

        const value = cpu.instructions.b + rdValue
        cpu.registers.setRegister8(rd, value)
    }
})

opcodeTable_aH_aL.register(0xA, range(0x0, 0xF), {
    name: "CMP.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL
        const rdValue = cpu.registers.getRegister8(rd)

        const imm = cpu.instructions.b

        setSubFlags(cpu, rdValue, imm, 8)

        return `CMP.B 0x${imm}, ${cpu.registers.getDisplay8(rd)}`
    }
})

opcodeTable_aH_aL.register(0xB, range(0x0, 0xF), {
    name: "SUBX.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL
        const rdValue = cpu.registers.getRegister8(rd)

        const imm = cpu.instructions.b

        const value = rdValue - imm - Number(cpu.flags.C)
        cpu.registers.setRegister8(cpu.instructions.bL, value)

        setSubFlags(cpu, rd, imm + Number(cpu.flags.C), 8)
    }
})

opcodeTable_aH_aL.register(0xC, range(0x0, 0xF), {
    name: "OR.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL
        const rdValue = cpu.registers.getRegister8(rd)

        const value = cpu.instructions.b | rdValue
        cpu.registers.setRegister8(rd, value)

        setMovFlags(cpu, value, 8)
    }
})

opcodeTable_aH_aL.register(0xD, range(0x0, 0xF), {
    name: "XOR.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL
        const rdValue = cpu.registers.getRegister8(rd)

        const value = cpu.instructions.b ^ rdValue
        cpu.registers.setRegister8(rd, value)

        setMovFlags(cpu, value, 8)
    }
})


opcodeTable_aH_aL.register(0xE, range(0x0, 0xF), {
    name: "AND.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL
        const rdValue = cpu.registers.getRegister8(rd)

        const imm = cpu.instructions.b

        const value = imm & rdValue
        cpu.registers.setRegister8(rd, value)

        setMovFlags(cpu, value, 8)

        return `AND.B 0x${imm.toString(16)}, ${cpu.registers.getDisplay8(rd)}`
    }
})


opcodeTable_aH_aL.register(0xF, range(0x0, 0xF), {
    name: "MOV.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL;
        const value = cpu.instructions.b

        cpu.registers.setRegister8(rd, value)

        setMovFlags(cpu, value, 8)

        return `MOV.B 0x${value.toString(16)}, ${cpu.registers.getDisplay8(rd)}`
    }
})
//endregion

//region opcodeTable_aHaL_bH

// TODO create a sub-table for nested entries like these
opcodeTable_aHaL_bH.register(0x1, 0x0, {
    name: "MOV.L",
    bytes: 0, // decide in execute func
    execute: cpu => {
        switch (cpu.instructions.c) {
            case 0x69: {
                const toMemory = (cpu.instructions.dH >> 3) & 1
                if (toMemory) {
                    const ers = cpu.instructions.dL
                    const ersValue = cpu.registers.getRegister32(ers)

                    const erd = cpu.instructions.dH
                    const erdValue = cpu.registers.getRegister32(erd)

                    cpu.memory.writeInt(erdValue, ersValue)

                    setMovFlags(cpu, ersValue, 32)
                }
                else {
                    const ers = cpu.instructions.dH
                    const ersValue = cpu.registers.getRegister32(ers)
                    const memoryValue = cpu.memory.readInt(ersValue)

                    const rd = cpu.instructions.dL
                    cpu.registers.setRegister32(rd, memoryValue)

                    setMovFlags(cpu, memoryValue, 32)
                }

                cpu.registers.pc += 4

                break
            }
            case 0x6B: {
                switch (cpu.instructions.dH) {
                    case 0x8: // ERs, @aa:16
                    {
                        const ers = cpu.instructions.dL;
                        const value = cpu.registers.getRegister32(ers)
                        const addr = cpu.instructions.ef
                        cpu.memory.writeInt(addr, value)
                        setMovFlags(cpu, value, 32)

                        cpu.registers.pc += 6

                        return `MOV.L ${cpu.registers.getDisplay32(ers)}, @0x${addr.toString(16)}`
                    }
                    case 0xA: // ERs, @aa:32
                    {
                        const ers = cpu.instructions.dL;
                        const value = cpu.registers.getRegister32(ers)
                        const addr = (cpu.instructions.ef << 16) | cpu.instructions.gh
                        cpu.memory.writeInt(addr, value)
                        setMovFlags(cpu, value, 32)

                        cpu.registers.pc += 8

                        return `MOV.L ${cpu.registers.getDisplay32(ers)}, @0x${addr.toString(16)}`
                    }
                    case 0x0: // @aa:16, ERd
                    {
                        const erd = cpu.instructions.dL;

                        const addr = cpu.instructions.ef
                        const memoryValue = cpu.memory.readInt(addr)
                        cpu.registers.setRegister32(erd, memoryValue)
                        setMovFlags(cpu, memoryValue, 32)

                        cpu.registers.pc += 6

                        return `MOV.L @0x${addr.toString(16)}, ${cpu.registers.getDisplay32(erd)}`
                    }
                    case 0x2: // @aa:24, ERd
                    {
                        const erd = cpu.instructions.dL;

                        const addr = (cpu.instructions.ef << 16) | cpu.instructions.gh
                        const memoryValue = cpu.memory.readInt(addr)
                        cpu.registers.setRegister32(erd, memoryValue)
                        setMovFlags(cpu, memoryValue, 32)

                        cpu.registers.pc += 8

                        return `MOV.L @0x${addr.toString(16)}, ${cpu.registers.getDisplay32(erd)}`
                    }
                    default: {
                        debugger
                        return
                    }
                }
            }
            case 0x6D:
            {
                const decrement = (cpu.instructions.dH >> 3) & 1
                if (decrement) {
                    const ers = cpu.instructions.dL
                    const ersValue = cpu.registers.getRegister32(ers)

                    const erd = cpu.instructions.dH
                    const erdValue = cpu.registers.getRegister32(erd)
                    const newAddr = toUnsignedInt(erdValue - 4)
                    cpu.registers.setRegister32(erd, newAddr)

                    cpu.memory.writeInt(newAddr, ersValue)

                    setMovFlags(cpu, ersValue, 32)
                }
                else {
                    const ers = cpu.instructions.dH
                    const ersRegValue = cpu.registers.getRegister32(ers)

                    const ersMemoryValue = cpu.memory.readInt(ersRegValue)

                    cpu.registers.setRegister32(ers, toUnsignedInt(ersRegValue + 4))

                    const erd = cpu.instructions.dL
                    cpu.registers.setRegister32(erd, ersMemoryValue)

                    setMovFlags(cpu, ersMemoryValue, 32)
                }

                cpu.registers.pc += 4
                break
            }
            case 0x6F:
            {
                const disp = toSignedShort(cpu.instructions.ef)

                const toMemory = (cpu.instructions.dH >> 3) & 1
                if (toMemory) {
                    const rs = cpu.instructions.dL
                    const rsValue = cpu.registers.getRegister32(rs)

                    const erd = cpu.instructions.dH
                    const erdValue = cpu.registers.getRegister32(erd)

                    cpu.memory.writeInt(erdValue + disp, rsValue)

                    setMovFlags(cpu, rsValue, 32)
                }
                else {
                    const ers = cpu.instructions.dH
                    const ersRegValue = cpu.registers.getRegister32(ers)
                    const memoryValue = cpu.memory.readInt(ersRegValue + disp)

                    const rd = cpu.instructions.dL
                    cpu.registers.setRegister32(rd, memoryValue)

                    setMovFlags(cpu, memoryValue, 32)
                }

                cpu.registers.pc += 6

                break
            }
            default:
                throw Error(`MOV.L opcode for 0x${cpu.instructions.c.toString(16)} not found`)
        }
    }
})

opcodeTable_aHaL_bH.register(0x1, 0x8, {
    name: "SLEEP",
    bytes: 2,
    execute: cpu => {
       cpu.sleep = true
    }
})

opcodeTable_aHaL_bH.register(0x0A, 0x0, {
    name: "INC.B Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister8(rd)
        const value = rdValue + 1
        cpu.registers.setRegister8(rd, value)

        setIncFlags(cpu, rdValue, 8)

        return `INC.B ${cpu.registers.getDisplay8(rd)}`
    }
})

opcodeTable_aHaL_bH.register(0x0A, range(0x8, 0xF), {
    name: "ADD.L ERs, ERd",
    bytes: 2,
    execute: cpu => {
        const erd = cpu.instructions.bL
        const ers = cpu.instructions.bH

        const erdValue = cpu.registers.getRegister32(erd)
        const ersValue = cpu.registers.getRegister32(ers)

        const value = erdValue + ersValue
        cpu.registers.setRegister32(erd, value)

        setAddFlags(cpu, erdValue, ersValue, 32)

        return `ADD.L ${cpu.registers.getDisplay32(ers)}, ${cpu.registers.getDisplay32(erd)}`
    }
})

opcodeTable_aHaL_bH.register(0xB, 0x0, {
    name: "ADDS #1, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister32(rd)
        cpu.registers.setRegister32(rd, rdValue + 1)
    }
})

opcodeTable_aHaL_bH.register(0x0B, 0x5, {
    name: "INC.W #1, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd)
        const value = rdValue + 1
        cpu.registers.setRegister16(rd, value)

        setIncFlags(cpu, rdValue, 16)
    }
})

opcodeTable_aHaL_bH.register(0x0B, 0x7, {
    name: "INC.L #1, Rd",
    bytes: 2,
    execute: cpu => {
        const erd = cpu.instructions.bL
        const erdValue = cpu.registers.getRegister32(erd)
        const value = erdValue + 1
        cpu.registers.setRegister32(erd, value)

        setIncFlags(cpu, erdValue, 32)
    }
})

opcodeTable_aHaL_bH.register(0x0B, 0xD, {
    name: "INC.W #2, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd)
        const value = rdValue + 2
        cpu.registers.setRegister16(rd, value)

        setIncFlags(cpu, rdValue, 16)
    }
})

opcodeTable_aHaL_bH.register(0xB, 0x8, {
    name: "ADDS #2, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister32(rd)
        cpu.registers.setRegister32(rd, rdValue + 2)
    }
})

opcodeTable_aHaL_bH.register(0xB, 0x9, {
    name: "ADDS #4, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister32(rd)
        cpu.registers.setRegister32(rd, rdValue + 4)
    }
})

opcodeTable_aHaL_bH.register(0xF, 0x0, {
    name: "DAA Rd",
    bytes: 4,
    execute: cpu => {
        // TODO I have no clue if this works, not implemented in other emulators so it may be an issue :)
        const rd = cpu.instructions.bL
        let regValue = cpu.registers.getRegister8(rd);

        const cFlag = cpu.flags.C;
        const hFlag = cpu.flags.H;

        const upperNibble = (regValue >> 4) & 0x0F;
        const lowerNibble = regValue & 0x0F;

        let adjustmentValue = 0x00;
        let newCFlag = cFlag;

        if (!cFlag) {
            if (upperNibble >= 0x0 && upperNibble <= 0x9) {
                if (!hFlag) {
                    if (lowerNibble >= 0x0 && lowerNibble <= 0x9) {
                        adjustmentValue = 0x00;
                        newCFlag = false;
                    } else if (lowerNibble >= 0xA && lowerNibble <= 0xF) {
                        adjustmentValue = 0x06;
                        newCFlag = false;
                    }
                } else { // hFlag is true
                    if (lowerNibble >= 0x0 && lowerNibble <= 0x3) {
                        adjustmentValue = 0x06;
                        newCFlag = false;
                    }
                }
            } else if (upperNibble >= 0xA && upperNibble <= 0xF) {
                if (!hFlag) {
                    if (lowerNibble >= 0x0 && lowerNibble <= 0x9) {
                        adjustmentValue = 0x60;
                        newCFlag = true;
                    } else if (lowerNibble >= 0xA && lowerNibble <= 0xF) {
                        adjustmentValue = 0x66;
                        newCFlag = true;
                    }
                } else { // hFlag is true
                    if (lowerNibble >= 0x0 && lowerNibble <= 0x3) {
                        adjustmentValue = 0x66;
                        newCFlag = true;
                    }
                }
            }
        } else { // cFlag is true
            if (upperNibble >= 0x1 && upperNibble <= 0x2) {
                if (!hFlag) {
                    if (lowerNibble >= 0x0 && lowerNibble <= 0x9) {
                        adjustmentValue = 0x60;
                        newCFlag = true;
                    } else if (lowerNibble >= 0xA && lowerNibble <= 0xF) {
                        adjustmentValue = 0x66;
                        newCFlag = true;
                    }
                } else {
                    if (lowerNibble >= 0x0 && lowerNibble <= 0x3) {
                        adjustmentValue = 0x66;
                        newCFlag = true;
                    }
                }
            } else if (upperNibble >= 0x3 && upperNibble <= 0xF) {
                if (!hFlag && lowerNibble >= 0x0 && lowerNibble <= 0x9) {
                    adjustmentValue = 0x60;
                    newCFlag = true;
                } else {
                    adjustmentValue = 0x66;
                    newCFlag = true;
                }
            }
        }

        regValue = (regValue + adjustmentValue) & 0xFF;

        cpu.registers.setRegister8(rd, regValue);

        cpu.flags.C = newCFlag;
        cpu.flags.N = (regValue & 0x80) !== 0;
        cpu.flags.Z = regValue === 0;
    }
})

opcodeTable_aHaL_bH.register(0xF, range(0x8, 0xF), {
    name: "MOV.L ERs, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rs = cpu.instructions.bH

        const rsValue = cpu.registers.getRegister32(rs)

        cpu.registers.setRegister32(rd, rsValue)
        setMovFlags(cpu, rsValue, 32)
    }
})

opcodeTable_aHaL_bH.register(0x10, 0x0, {
    name: "SHLL.B Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.registers.getRegister8(cpu.instructions.bL)
        const value = rd << 1
        cpu.registers.setRegister8(cpu.instructions.bL, value)

        cpu.flags.C = ((rd >> 7) & 1) == 1
        setMovFlags(cpu, value, 8)
    }
})

opcodeTable_aHaL_bH.register(0x10, 0x1, {
    name: "SHLL.W Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.registers.getRegister16(cpu.instructions.bL)
        const value = rd << 1
        cpu.registers.setRegister16(cpu.instructions.bL, value)

        cpu.flags.C = ((rd >> 15) & 1) == 1
        setMovFlags(cpu, value, 8)
    }
})

opcodeTable_aHaL_bH.register(0x10, 0x3, {
    name: "SHLL.L ERd",
    bytes: 2,
    execute: cpu => {
        const erd = cpu.instructions.bL
        const erdValue = cpu.registers.getRegister16(erd)

        const value = erdValue << 1
        cpu.registers.setRegister16(erd, value)

        cpu.flags.C = ((erdValue >> 31) & 1) == 1
        setMovFlags(cpu, value, 8)
    }
})

opcodeTable_aHaL_bH.register(0x11, 0x0, {
    name: "SHLR.B Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister8(rd);

        const value = rdValue >> 1
        cpu.registers.setRegister8(rd, value)

        cpu.flags.C = Boolean(rdValue & 1)
        setMovFlags(cpu, value, 8)
    }
})

opcodeTable_aHaL_bH.register(0x11, 0x1, {
    name: "SHLR.W Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd);

        const value = (rdValue >> 1) | (rdValue & 0b1000_0000_0000_0000)
        cpu.registers.setRegister16(rd, value)

        cpu.flags.C = Boolean(rdValue & 1)
        setMovFlags(cpu, value, 16)
    }
})

opcodeTable_aHaL_bH.register(0x11, 0x9, {
    name: "SHAR.W Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd);

        const value = rdValue >> 1
        cpu.registers.setRegister16(rd, value)

        cpu.flags.C = Boolean(rdValue & 1)
        setMovFlags(cpu, value, 16)
    }
})

opcodeTable_aHaL_bH.register(0x17, 0x5, {
    name: "EXTU.W Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd)

        const value = rdValue & 0xFF
        cpu.registers.setRegister16(rd, value)

        setMovFlags(cpu, value, 16)

        return `EXTU.W ${cpu.registers.getDisplay16(rd)}`
    }
})

opcodeTable_aHaL_bH.register(0x17, 0x7, {
    name: "EXTU.L ERd",
    bytes: 2,
    execute: cpu => {
        const erd = cpu.instructions.bL
        const erdValue = cpu.registers.getRegister32(erd)

        const value = erdValue & 0xFFFF
        cpu.registers.setRegister32(erd, value)

        setMovFlags(cpu, value, 32)

        return `EXTU.L ${cpu.registers.getDisplay32(erd)}`
    }
})

opcodeTable_aHaL_bH.register(0x17, 0x8, {
    name: "NEG.B Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister8(rd)

        if (rdValue != 0x80)
            cpu.registers.setRegister16(rd, -rdValue)

        setSubFlags(cpu, 0, rdValue, 8)

        return `NEG.W ${cpu.registers.getDisplay8(rd)}`
    }
})

opcodeTable_aHaL_bH.register(0x17, 0x9, {
    name: "NEG.W Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd)

        if (rdValue != 0x8000)
            cpu.registers.setRegister16(rd, -rdValue)

        setSubFlags(cpu, 0, rdValue, 16)

        return `NEG.W ${cpu.registers.getDisplay16(rd)}`
    }
})

opcodeTable_aHaL_bH.register(0x17, 0xd, {
    name: "EXTS.W Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd)

        const value = rdValue & 0x80 ? (rdValue & 0xFF) | 0xFF00 : rdValue & 0xFF
        cpu.registers.setRegister16(rd, value)

        setMovFlags(cpu, value, 16)
    }
})

opcodeTable_aHaL_bH.register(0x17, 0xf, {
    name: "EXTS.L Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister32(rd)

        const value = rdValue & 0x80 ? (rdValue & 0xFFFF) | 0xFFFF0000 : rdValue & 0xFFFF
        cpu.registers.setRegister32(rd, value)

        setMovFlags(cpu, value, 16)
    }
})

opcodeTable_aHaL_bH.register(0x1a, 0x0, {
    name: "DEC.B Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister8(rd)
        const value = rdValue - 1
        cpu.registers.setRegister8(rd, value)

        setDecFlags(cpu, rdValue, 8)
    }
})

opcodeTable_aHaL_bH.register(0x1a, range(0x8, 0xF), {
    name: "SUB.L ERs, ERd",
    bytes: 2,
    execute: cpu => {
        const erd = cpu.instructions.bL
        const erdValue = cpu.registers.getRegister32(erd)

        const ers = cpu.instructions.bH
        const ersValue = cpu.registers.getRegister32(ers)

        const value = erdValue - ersValue
        cpu.registers.setRegister32(erd, value)

        setSubFlags(cpu, erdValue, ersValue, 32)
    }
})

opcodeTable_aHaL_bH.register(0x1b, 0x0, {
    name: "SUBS #1, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.registers.getRegister32(cpu.instructions.bL)
        cpu.registers.setRegister32(cpu.instructions.bL, rd - 1)
    }
})

opcodeTable_aHaL_bH.register(0x1b, 0x5, {
    name: "DEC.W #1, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd)
        const value = rdValue - 1
        cpu.registers.setRegister16(rd, value)

        setDecFlags(cpu, rdValue, 16)
    }
})

opcodeTable_aHaL_bH.register(0x1b, 0x8, {
    name: "SUBS #2, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.registers.getRegister32(cpu.instructions.bL)
        cpu.registers.setRegister32(cpu.instructions.bL, rd - 2)
    }
})

opcodeTable_aHaL_bH.register(0x1b, 0x9, {
    name: "SUBS #4, ERd",
    bytes: 2,
    execute: cpu => {
        const erd = cpu.instructions.bL
        const erdValue = cpu.registers.getRegister32(erd)
        cpu.registers.setRegister32(erd, toUnsignedInt(erdValue - 4))
    }
})


opcodeTable_aHaL_bH.register(0x1F, range(0x8, 0xF), {
    name: "CMP.L ERs, ERd",
    bytes: 2,
    execute: cpu => {
        const ers = cpu.instructions.bH
        const erd = cpu.instructions.bL

        const rsValue = cpu.registers.getRegister32(ers)
        const rdValue = cpu.registers.getRegister32(erd)

        setSubFlags(cpu, rdValue, rsValue, 32)

        return `CMP.L ${cpu.registers.getDisplay32(ers)}, ${cpu.registers.getDisplay32(erd)}`
    }
})

opcodeTable_aHaL_bH.register(0x58, 0x2, {
    name: "BHI d:16",
    bytes: 4,
    execute: cpu => {
        const disp = toSignedShort(cpu.instructions.cd)
        if (!(cpu.flags.C || cpu.flags.Z))
            cpu.registers.pc += disp

        return `BHI ${disp}`
    }
})

opcodeTable_aHaL_bH.register(0x58, 0x3, {
    name: "BLS d:16",
    bytes: 4,
    execute: cpu => {
        const disp = toSignedShort(cpu.instructions.cd)
        if (cpu.flags.C || cpu.flags.Z)
            cpu.registers.pc += disp

        return `BLS ${disp}`
    }
})

opcodeTable_aHaL_bH.register(0x58, 0x4, {
    name: "BCC d:16",
    bytes: 4,
    execute: cpu => {
        const disp = toSignedShort(cpu.instructions.cd)
        if (!cpu.flags.C)
            cpu.registers.pc += disp

        return `BCC ${disp}`
    }
})

opcodeTable_aHaL_bH.register(0x58, 0x5, {
    name: "BCS d:16",
    bytes: 4,
    execute: cpu => {
        const disp = toSignedShort(cpu.instructions.cd)
        if (cpu.flags.C)
            cpu.registers.pc += disp

        return `BCS ${disp}`
    }
})

opcodeTable_aHaL_bH.register(0x58, 0x6, {
    name: "BNE d:16",
    bytes: 4,
    execute: cpu => {
        const disp = toSignedShort(cpu.instructions.cd)
        if (!cpu.flags.Z)
            cpu.registers.pc += disp

        return `BNE ${disp}`
    }
})

opcodeTable_aHaL_bH.register(0x58, 0x7, {
    name: "BEQ d:16",
    bytes: 4,
    execute: cpu => {
        const disp = toSignedShort(cpu.instructions.cd)
        if (cpu.flags.Z)
            cpu.registers.pc += disp

        return `BEQ ${disp}`
    }
})

opcodeTable_aHaL_bH.register(0x58, 0xD, {
    name: "BLT d:16",
    bytes: 4,
    execute: cpu => {
        const disp = toSignedShort(cpu.instructions.cd)
        if (cpu.flags.N != cpu.flags.V)
            cpu.registers.pc += disp

        return `BLT ${disp}`
    }
})

opcodeTable_aHaL_bH.register(0x79, 0x0, {
    name: "MOV.W #xx:16, Rd",
    bytes: 4,
    execute: cpu => {

        const rd = cpu.instructions.bL;
        const imm = cpu.instructions.cd
        cpu.registers.setRegister16(rd, imm)

        setMovFlags(cpu, imm, 16)

        return `MOV.W ${imm.toString(16)}, ${cpu.registers.getDisplay16(rd)}`
    }
})

opcodeTable_aHaL_bH.register(0x79, 0x1, {
    name: "ADD.W #xx:16, Rd",
    bytes: 4,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd)

        const imm = cpu.instructions.cd

        const value = imm + rdValue
        cpu.registers.setRegister16(rd, value)

        setAddFlags(cpu, rdValue, imm, 16)
    }
})

opcodeTable_aHaL_bH.register(0x79, 0x2, {
    name: "CMP.W #xx:16, Rd",
    bytes: 4,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd)

        const imm = cpu.instructions.cd

        setSubFlags(cpu, rdValue, imm, 16)
    }
})

opcodeTable_aHaL_bH.register(0x79, 0x3, {
    name: "SUB.W #xx:16, Rd",
    bytes: 4,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd)

        const imm = cpu.instructions.cd

        cpu.registers.setRegister16(rd, rdValue - imm)

        setSubFlags(cpu, rdValue, imm, 16)
    }
})

opcodeTable_aHaL_bH.register(0x79, 0x4, {
    name: "OR.W #xx:16, Rd",
    bytes: 4,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd)

        const imm = cpu.instructions.cd

        const value = rdValue | imm
        cpu.registers.setRegister16(rd, value)

        setMovFlags(cpu, value, 16)
    }
})

opcodeTable_aHaL_bH.register(0x79, 0x6, {
    name: "AND.W #xx:16, Rd",
    bytes: 4,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister16(rd)

        const imm = cpu.instructions.cd

        const value = imm & rdValue
        cpu.registers.setRegister16(rd, value)

        setMovFlags(cpu, value, 16)

        return `AND.W 0x${imm.toString(16)}, ${cpu.registers.getDisplay16(rd)}`
    }
})


opcodeTable_aHaL_bH.register(0x7A, 0x0, {
    name: "MOV.L #xx:32, Rd",
    bytes: 6,
    execute: cpu => {
        const erd = cpu.instructions.bL

        const imm = (cpu.instructions.cd << 16) | cpu.instructions.ef

        cpu.registers.setRegister32(erd, imm)
        setMovFlags(cpu, imm, 32)
    }
})

opcodeTable_aHaL_bH.register(0x7A, 0x1, {
    name: "ADD.L #xx:32, Rd",
    bytes: 6,
    execute: cpu => {
        const erd = cpu.instructions.bL
        const erdValue = cpu.registers.getRegister32(erd)

        const imm = (cpu.instructions.cd << 16) | cpu.instructions.ef

        const value = erdValue + imm
        cpu.registers.setRegister32(erd, value)
        setMovFlags(cpu, value, 32)
    }
})

//endregion

//region opcodeTable_aHaLbHbLcH_cL

opcodeTable_aHaLbHbLcH_cL.register(0x1c05, 0x2, {
    name: "MULXS.W Rs, ERd",
    bytes: 4,
    execute: cpu => {
        const rs = cpu.instructions.dH
        const rsValue = cpu.registers.getRegister16(rs)

        const erd = cpu.instructions.dL
        const erdValue = cpu.registers.getRegister32(erd)

        cpu.registers.setRegister32(erd, (erdValue & 0xFFFF) * (rsValue))

        cpu.flags.Z = rsValue == 0
        cpu.flags.N = Boolean(rsValue & 0b1000_0000_0000_0000)
    }
})

opcodeTable_aHaLbHbLcH_cL.register(0x1d05, 0x3, {
    name: "DIVXS.W Rs, ERd",
    bytes: 4,
    execute: cpu => {
        const rs = cpu.instructions.dH
        const rsValue = cpu.registers.getRegister16(rs)

        const erd = cpu.instructions.dL
        const erdValue = cpu.registers.getRegister32(erd)

        const quotient = toSignedShort(erdValue / rsValue)
        const remainder = toSignedShort(erdValue % rsValue)

        cpu.registers.setRegister32(erd, (remainder << 16) | quotient)

        cpu.flags.Z = rsValue == 0
        cpu.flags.N = Boolean(rsValue & 0b1000_0000_0000_0000)
    }
})

opcodeTable_aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7D && (num & 0xF) == 0x06, num => num == 0x7, {
    name: "BST #xx:3, @ERd",
    bytes: 4,
    execute: cpu => {
        if (cpu.instructions.dH >> 3 == 1) { // BIST ??
            debugger
        }

        const erd = cpu.instructions.bH
        const erdValue = cpu.registers.getRegister32(erd)
        const memoryValue = cpu.memory.readByte(erdValue)

        const imm = cpu.instructions.dH

        if (cpu.flags.C) {
            cpu.memory.writeByte(erdValue, memoryValue | (1 << imm))
        } else {
            cpu.memory.writeByte(erdValue, memoryValue & ~(1 << imm))
        }

    }
})

opcodeTable_aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7D && (num & 0xFF) == 0x07, num => num == 0x0, {
    name: "BSET #xx:3, @ERd",
    bytes: 4,
    execute: cpu => {
        const bit = cpu.instructions.dH & 0b111
        const erd = cpu.instructions.bH
        const erdValue = cpu.registers.getRegister32(erd) & 0xFFFF

        cpu.memory.writeByte(erdValue, cpu.memory.readByte(erdValue) | (1 << bit))
    }
})

opcodeTable_aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7D && (num & 0xFF) == 0x07, num => num == 0x2, {
    name: "BCLR #xx:3, @ERd",
    bytes: 4,
    execute: cpu => {
        const bit = cpu.instructions.dH & 0b111
        const erd = cpu.instructions.bH
        const erdValue = cpu.registers.getRegister32(erd) & 0xFFFF

        cpu.memory.writeByte(erdValue, cpu.memory.readByte(erdValue) & ~(1 << bit))
    }
})

opcodeTable_aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7E && (num & 0xF) == 0x07, num => num == 0x7, {
    name: "BLD #xx:3, @aa:8",
    bytes: 4,
    execute: cpu => {
        if (cpu.instructions.dH >> 3 == 1) { // BILD ??
            debugger
        }

        const bit = cpu.instructions.dH & 0b111
        const addr = cpu.instructions.b | 0xFF00
        const memoryValue = cpu.memory.readByte(addr)

        cpu.flags.C = Boolean((memoryValue >> bit) & 1)
    }
})

opcodeTable_aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7F && (num & 0xF) == 0x7, num => num == 0x0, {
    name: "BSET #xx:3, @aa:8",
    bytes: 4,
    execute: cpu => {
        const bit = cpu.instructions.dH & 0b111
        const addr = cpu.instructions.b | 0xFF00

        cpu.memory.writeByte(addr, cpu.memory.readByte(addr) | (1 << bit))
    }
})

opcodeTable_aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7F && (num & 0xF) == 0x7, num => num == 0x2, {
    name: "BCLR #xx:3, @aa:8",
    bytes: 4,
    execute: cpu => {
        const bit = cpu.instructions.dH & 0b111
        const addr = cpu.instructions.b | 0xFF00

        cpu.memory.writeByte(addr, cpu.memory.readByte(addr) & ~(1 << bit))
    }
})

//endregion
