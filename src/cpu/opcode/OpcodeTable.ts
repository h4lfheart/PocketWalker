import {OpcodeContainer} from "./OpcodeContainer";
import {range} from "../../utils/CollectionUtils";
import {setAddFlags, setDecFlags, setFlags, setIncFlags, setMovFlags, setSubFlags} from "./OpcodeFlags";
import {toSignedByte, toUnsignedInt} from "../../utils/BitUtils";
import {SSRDR_ADDR, SSSR_RECEIVE_DATA_FULL, SSSR_TRANSMIT_EMPTY, SSSR_TRANSMIT_END, SSTDR_ADDR} from "../../ssu/Ssu";

export const opcodeTable_aH_aL = new OpcodeContainer("opcodeTable_aH_aL", cpu => cpu.instructions.aH, cpu => cpu.instructions.aL)
export const opcodeTable_aHaL_bH = new OpcodeContainer("opcodeTable_aHaL_bH", cpu => (cpu.instructions.aH << 4) | cpu.instructions.aL, cpu => cpu.instructions.bH)
export const opcodeTable_aHaLbHbLcH_cL = new OpcodeContainer("opcodeTable_aHaLbHbLcH_cL", cpu => (cpu.instructions.a << 12) | (cpu.instructions.b << 4) | cpu.instructions.cH, cpu => cpu.instructions.cL)

// opcodeTable_aH_aL
opcodeTable_aH_aL.register(0x0, [0x1, 0xA, 0xB, 0xF], opcodeTable_aHaL_bH.opcode)
opcodeTable_aH_aL.register(0x1, [...range(0x0, 0x3), 0x7, 0xA, 0xB, 0xF], opcodeTable_aHaL_bH.opcode)
opcodeTable_aH_aL.register(0x5, 0x8, opcodeTable_aHaL_bH.opcode)
opcodeTable_aH_aL.register(0x7, [0x9, 0xA], opcodeTable_aHaL_bH.opcode)
opcodeTable_aH_aL.register(0x7, range(0xC, 0xF), opcodeTable_aHaLbHbLcH_cL.opcode)

//region opcodeTable_aH_aL
opcodeTable_aH_aL.register(0x0, 0x0, {
    name: "NOP",
    bytes: 2,
    execute: () => "NOP"
})

opcodeTable_aH_aL.register(0x0, 0x3, {
    name: "LDC.B Rs, CCR",
    bytes: 2,
    execute: cpu => {
        const value = cpu.registers.getRegister8(cpu.instructions.bL)
        setFlags(cpu, value)
    }
})

opcodeTable_aH_aL.register(0x0, 0x8, {
    name: "ADD.B Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const valueRs = cpu.registers.getRegister8(rs)
        const valueRd = cpu.registers.getRegister8(rd)

        const value = valueRd + valueRs
        cpu.registers.setRegister8(rd, value)

        setAddFlags(cpu, valueRd, valueRs, 8)
    }
})

opcodeTable_aH_aL.register(0x0, 0xC, {
    name: "MOV.B Rs,Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const valueRs = cpu.registers.getRegister8(rs)

        cpu.registers.setRegister8(rd, valueRs)

        setMovFlags(cpu, valueRs, 8)


        return `MOV.W ${cpu.registers.getDisplay8(rs)}, ${cpu.registers.getDisplay8(rd)}`
    }
})

opcodeTable_aH_aL.register(0x0, 0xD, {
    name: "MOV.W Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const valueRs = cpu.registers.getRegister16(rs)

        cpu.registers.setRegister16(rd, valueRs)

        setMovFlags(cpu, valueRs, 16)

        return `MOV.W ${cpu.registers.getDisplay16(rs)}, ${cpu.registers.getDisplay16(rd)}`
    }
})

opcodeTable_aH_aL.register(0x1, 0x8, {
    name: "SUB.B Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const valueRs = cpu.registers.getRegister8(rs)
        const valueRd = cpu.registers.getRegister8(rd)

        cpu.registers.setRegister8(rd, valueRd - valueRs)

        setSubFlags(cpu, valueRd, valueRs, 8)
    }
})

opcodeTable_aH_aL.register(0x1, 0x9, {
    name: "SUB.W Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const valueRs = cpu.registers.getRegister16(rs)
        const valueRd = cpu.registers.getRegister16(rd)

        cpu.registers.setRegister16(rd, valueRd - valueRs)

        setSubFlags(cpu, valueRd, valueRs, 16)
    }
})

opcodeTable_aH_aL.register(0x1, 0xC, {
    name: "CMP.B Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const valueRs = cpu.registers.getRegister8(cpu.instructions.bH)
        const valueRd = cpu.registers.getRegister8(cpu.instructions.bL)

        setSubFlags(cpu, valueRd, valueRs, 8)
    }
})

opcodeTable_aH_aL.register(0x1, 0xD, {
    name: "CMP.W Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.registers.getRegister16(cpu.instructions.bH)
        const rd = cpu.registers.getRegister16(cpu.instructions.bL)

        setSubFlags(cpu, rd, rs, 16)
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
        if (cpu.flags.C)
            cpu.registers.pc += toSignedByte(cpu.instructions.b)
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
        if (cpu.flags.Z)
            cpu.registers.pc += toSignedByte(cpu.instructions.b)
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
    bytes: 0,
    execute: cpu => {
        const disp = toSignedByte(cpu.instructions.b)

        cpu.registers.pushStack(cpu.registers.pc + 2)

        cpu.registers.pc += disp + 2
    }
})


opcodeTable_aH_aL.register(0x5, 0x6, {
    name: "RTE",
    bytes: 4,
    execute: cpu => {
        throw Error("RTE not implemented")
    }
})


opcodeTable_aH_aL.register(0x5, 0xE, {
    name: "JSR @aa:24",
    bytes: 0,
    execute: cpu => {
        cpu.registers.pushStack(cpu.registers.pc + 4)

        cpu.registers.pc = (cpu.instructions.b << 16) | cpu.instructions.cd

        return `JSR @0x${cpu.registers.pc.toString(16)}`
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

            const erd = cpu.instructions.bH & 0b111
            const erdValue = cpu.registers.getRegister32(erd)

            cpu.memory.writeByte(erdValue, rsValue)
            setMovFlags(cpu, rsValue, 8)
        } else {
            const rd = cpu.instructions.bL

            const erd = cpu.instructions.bH & 0b111
            const erdValue = cpu.registers.getRegister32(erd)
            const memoryValue = cpu.memory.readByte(erdValue)

            cpu.registers.setRegister8(rd, memoryValue)
            setMovFlags(cpu, memoryValue, 8)
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
    bytes: 2,
    execute: cpu => {
        switch (cpu.instructions.bH) {
            case 0x8: // Rs, @aa:16
            {
                const rs = cpu.instructions.bL;
                const value = cpu.registers.getRegister16(rs)
                const addr = cpu.instructions.cd
                cpu.memory.writeByte(addr, value)
                setMovFlags(cpu, value, 16)

                cpu.registers.pc += 4

                return `MOV.B ${cpu.registers.getDisplay16(rs)}, @0x${addr.toString(16)}`
            }
            case 0xA: // Rs, @aa:32
            {
                const rs = cpu.instructions.bL;
                const value = cpu.registers.getRegister16(rs)
                const addr = (cpu.instructions.cd << 16) | cpu.instructions.ef
                cpu.memory.writeByte(addr, value)
                setMovFlags(cpu, value, 16)

                cpu.registers.pc += 6

                return `MOV.B ${cpu.registers.getDisplay16(rs)}, @0x${addr.toString(16)}`
            }
            case 0x0: // @aa:16, Rd
            {
                const rd = cpu.instructions.bL;

                const addr = cpu.instructions.cd
                const memoryValue = cpu.memory.readByte(addr)
                cpu.registers.setRegister16(rd, memoryValue)
                setMovFlags(cpu, memoryValue, 16)

                cpu.registers.pc += 4

                return `MOV.B @0x${addr.toString(16)}, ${cpu.registers.getDisplay16(rd)}`
            }
            case 0x2: // @aa:24, Rd
            {
                const rd = cpu.instructions.bL;

                const addr = (cpu.instructions.cd << 16) | cpu.instructions.ef
                const memoryValue = cpu.memory.readByte(addr)
                cpu.registers.setRegister16(rd, memoryValue)
                setMovFlags(cpu, memoryValue, 16)

                cpu.registers.pc += 6

                return `MOV.B @0x${addr.toString(16)}, ${cpu.registers.getDisplay16(rd)}`
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

            const erd = cpu.instructions.bH & 0b111
            const erdValue = cpu.registers.getRegister32(erd)
            cpu.registers.setRegister32(erd, toUnsignedInt(erdValue - 1))

            cpu.memory.writeByte(erdValue, rsValue)

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

            const erd = cpu.instructions.bH & 0b111
            const erdValue = cpu.registers.getRegister32(erd)
            cpu.registers.setRegister32(erd, toUnsignedInt(erdValue - 2))

            cpu.memory.writeShort(erdValue, rsValue)

            setMovFlags(cpu, rsValue, 16)
        }
        else {
            const ers = cpu.instructions.bH
            const ersRegValue = cpu.registers.getRegister32(ers)
            const ersMemoryValue = cpu.memory.readShort(ersRegValue)

            cpu.registers.setRegister32(ers, toUnsignedInt(ersRegValue + 2))

            const rd = cpu.instructions.bL & 0b111
            cpu.registers.setRegister16(rd, ersMemoryValue)
            setMovFlags(cpu, ersMemoryValue, 16)
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

        cpu.flags.Z = Boolean((rd >> bit) & 1)
    }
})

opcodeTable_aH_aL.register(0x7, 0x7, {
    name: "BLD #xx:3, Rd",
    bytes: 2,
    execute: cpu => {
        if (cpu.instructions.bH >> 7 == 1) { // BILD ??
            return
        }

        const bit = cpu.instructions.bH & 0b111
        const rd = cpu.instructions.bL
        const rdValue = cpu.registers.getRegister8(rd)

        cpu.flags.C = Boolean((rdValue >> bit) & 1)

    }
})

opcodeTable_aH_aL.register(0x8, range(0x0, 0xF), {
    name: "ADD.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.registers.getRegister8(cpu.instructions.aL)

        const value = cpu.instructions.b + rd
        cpu.registers.setRegister8(cpu.instructions.aL, value)

        setAddFlags(cpu, rd, value, 8)
    }
})

opcodeTable_aH_aL.register(0x9, range(0x0, 0xF), {
    name: "ADDX #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL
        const valueRd = cpu.registers.getRegister8(rd)

        const value = cpu.instructions.b + valueRd
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
opcodeTable_aHaL_bH.register(0x1, 0x8, {
    name: "SLEEP",
    bytes: 2,
    execute: cpu => {
       cpu.sleep = true
    }
})

opcodeTable_aHaL_bH.register(0x0B, 0x0, {
    name: "ADDS #1, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.registers.getRegister32(cpu.instructions.bL)
        cpu.registers.setRegister32(cpu.instructions.bL, rd + 1)
    }
})

opcodeTable_aHaL_bH.register(0x0B, 0x5, {
    name: "INC.W #1, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const valueRd = cpu.registers.getRegister16(rd)
        const value = valueRd + 1
        cpu.registers.setRegister16(rd, value)

        setIncFlags(cpu, valueRd, 16)
    }
})

opcodeTable_aHaL_bH.register(0xB, 0x0, {
    name: "ADDS #1, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const valueRd = cpu.registers.getRegister32(rd)
        cpu.registers.setRegister32(rd, valueRd + 1)
    }
})

opcodeTable_aHaL_bH.register(0xB, 0x8, {
    name: "ADDS #2, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const valueRd = cpu.registers.getRegister32(rd)
        cpu.registers.setRegister32(rd, valueRd + 2)
    }
})

opcodeTable_aHaL_bH.register(0xB, 0x9, {
    name: "ADDS #4, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const valueRd = cpu.registers.getRegister32(rd)
        cpu.registers.setRegister32(rd, valueRd + 4)
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

opcodeTable_aHaL_bH.register(0x1a, 0x0, {
    name: "DEC.B Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.bL
        const valueRd = cpu.registers.getRegister8(rd)
        const value = valueRd - 1
        cpu.registers.setRegister8(rd, value)

        setDecFlags(cpu, valueRd, 8)
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
        const valueRd = cpu.registers.getRegister16(rd)
        const value = valueRd - 1
        cpu.registers.setRegister16(rd, value)

        setDecFlags(cpu, valueRd, 16)
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
        const rd = cpu.registers.getRegister32(cpu.instructions.bL)
        cpu.registers.setRegister32(cpu.instructions.bL, toUnsignedInt(rd - 4))
    }
})

opcodeTable_aHaL_bH.register(0x79, 0x0, {
    name: "MOV.W #xx:16, Rd",
    bytes: 4,
    execute: cpu => {
        const value = cpu.instructions.cd
        cpu.registers.setRegister16(cpu.instructions.bL, value)

        setMovFlags(cpu, value, 16)
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

//endregion

//region opcodeTable_aHaLbHbLcH_cL

opcodeTable_aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7D && (num & 0xFF) == 0x07, num => num == 0x0, {
    name: "BSET #xx:3, @ERd",
    bytes: 4,
    execute: cpu => {
        const bit = cpu.instructions.dH & 0b111
        const erd = cpu.instructions.bH & 0b111
        const erdValue = cpu.registers.getRegister8(erd)

        cpu.memory.writeByte(erd, cpu.memory.readByte(erdValue) | (1 << bit))
    }
})

opcodeTable_aHaLbHbLcH_cL.registerPattern(num => ((num >> 12) & 0xFF) == 0x7E && (num & 0xF) == 0x07, num => num == 0x7, {
    name: "BLD #xx:3, @aa:8",
    bytes: 4,
    execute: cpu => {
        if (cpu.instructions.bH >> 7 == 1) { // BILD ??
            return
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
