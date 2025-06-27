import {OpcodeContainer} from "./OpcodeContainer";
import {range} from "../../utils/CollectionUtils";
import {setAddFlags, setDecFlags, setFlags, setMovFlags, setSubFlags} from "./OpcodeFlags";

export const opcodeTable_aH_aL = new OpcodeContainer("opcodeTable_aH_aL", cpu => cpu.instructions.aH, cpu => cpu.instructions.aL)
export const opcodeTable_aHaL_bH = new OpcodeContainer("opcodeTable_aHaL_bH", cpu => (cpu.instructions.aH << 4) | cpu.instructions.aL, cpu => cpu.instructions.bH)

// opcodeTable_aH_aL
opcodeTable_aH_aL.register(0x0, [0x1, 0xA, 0xB, 0xF], opcodeTable_aHaL_bH.opcode)
opcodeTable_aH_aL.register(0x1, [...range(0x0, 0x3), 0x7, 0xA, 0xB, 0xF], opcodeTable_aHaL_bH.opcode)
opcodeTable_aH_aL.register(0x5, 0x8, opcodeTable_aHaL_bH.opcode)
opcodeTable_aH_aL.register(0x7, [0x9, 0xA], opcodeTable_aHaL_bH.opcode)

opcodeTable_aH_aL.register(0x0, 0x0, {
    name: "NOP",
    bytes: 2,
    execute: () => {}
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

        setAddFlags(cpu, valueRd, valueRs)
    }
})

opcodeTable_aH_aL.register(0x1, 0xC, {
    name: "CMP.W Rs, Rd",
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
        const valueRs = cpu.registers.getRegister16(cpu.instructions.bH)
        const valueRd = cpu.registers.getRegister16(cpu.instructions.bL)

        setSubFlags(cpu, valueRd, valueRs, 16)
    }
})

opcodeTable_aH_aL.register(0x1, 0xE, {
    name: "SUBX Rs, Rd",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.bH
        const rd = cpu.instructions.bL

        const valueRs = cpu.registers.getRegister8(rs)
        const valueRd = cpu.registers.getRegister8(rd)

        const value = valueRd - valueRs - cpu.registers.flags.C
        cpu.registers.setRegister8(rd, value)

        setSubFlags(cpu, valueRd, valueRs + cpu.registers.flags.C, 8)
    }
})

opcodeTable_aH_aL.register(0x3, range(0x0, 0xF), {
    name: "MOV.B Rs, @aa:8",
    bytes: 2,
    execute: cpu => {
        const rs = cpu.instructions.aL;
        const value = cpu.registers.getRegister8(rs)

        const addr = (cpu.instructions.b & 0xFF) | 0xFFFF00
        cpu.memory.writeByte(addr, value)

        setMovFlags(cpu, value)
    }
})

opcodeTable_aH_aL.register(0x4, 0x0, {
    name: "BRA d:8",
    bytes: 2,
    execute: cpu => {
        cpu.registers.pc += cpu.instructions.b

    }
})

opcodeTable_aH_aL.register(0x4, 0x5, {
    name: "BCS d:8",
    bytes: 2,
    execute: cpu => {
        if (cpu.registers.flags.C)
            cpu.registers.pc += cpu.instructions.b
    }
})

opcodeTable_aH_aL.register(0x4, 0x6, {
    name: "BNE d:8",
    bytes: 2,
    execute: cpu => {
        if (!cpu.registers.flags.Z)
            cpu.registers.pc += cpu.instructions.b
    }
})

opcodeTable_aH_aL.register(0x4, 0x7, {
    name: "BEQ d:8",
    bytes: 2,
    execute: cpu => {
        if (cpu.registers.flags.Z)
            cpu.registers.pc += cpu.instructions.b
    }
})

opcodeTable_aH_aL.register(0x5, 0xE, {
    name: "JSR @@aa:24",
    bytes: 4,
    execute: cpu => {
        cpu.registers.pushStack()

        cpu.registers.pc = (cpu.instructions.b << 16) | cpu.instructions.cd
    }
})

opcodeTable_aH_aL.register(0x6, 0xD, {
    name: "MOV.W @ERs+,Rd",
    bytes: 4,
    execute: cpu => {
        const value = cpu.registers.getRegister32(cpu.instructions.bH)

        cpu.registers.setRegister16(cpu.instructions.bL, value)

        setMovFlags(cpu, value)
    }
})

opcodeTable_aH_aL.register(0x7, 0x3, {
    name: "BTST #xx:3, Rd",
    bytes: 2,
    execute: cpu => {
        const bit = cpu.instructions.bH & 0b111
        const rd = cpu.registers.getRegister8(cpu.instructions.bL)

        cpu.registers.flags.Z = (rd >> bit) & 1
    }
})

opcodeTable_aH_aL.register(0x8, range(0x0, 0xF), {
    name: "ADD.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL

        const value = cpu.instructions.b + rd
        cpu.registers.setRegister8(rd, value)

        setAddFlags(cpu, value, 8)
    }
})

opcodeTable_aH_aL.register(0xC, range(0x0, 0xF), {
    name: "OR.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL

        const value = cpu.instructions.b | rd
        cpu.registers.setRegister8(rd, value)

        setMovFlags(cpu, value)
    }
})


opcodeTable_aH_aL.register(0xE, range(0x0, 0xF), {
    name: "AND.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL

        const value = cpu.instructions.b & rd
        cpu.registers.setRegister8(rd, value)

        setMovFlags(cpu, value)
    }
})


opcodeTable_aH_aL.register(0xF, range(0x0, 0xF), {
    name: "MOV.B #xx:8, Rd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.instructions.aL;
        const value = cpu.instructions.b

        cpu.registers.setRegister8(rd, value)

        setMovFlags(cpu, value)
    }
})


// opcodeTable_aHaL_bH

opcodeTable_aHaL_bH.register(0x1, 0x8, {
    name: "SLEEP",
    bytes: 2,
    execute: cpu => {
       cpu.sleep = true
    }
})

opcodeTable_aHaL_bH.register(0xB, 0x0, {
    name: "ADDS #1, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.registers.getRegister32(cpu.instructions.bL)
        cpu.registers.setRegister32(cpu.instructions.bL, rd + 1)
    }
})

opcodeTable_aHaL_bH.register(0xB, 0x9, {
    name: "ADDS #2, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.registers.getRegister32(cpu.instructions.bL)
        cpu.registers.setRegister32(cpu.instructions.bL, rd + 2)
    }
})

opcodeTable_aHaL_bH.register(0xB, 0x9, {
    name: "ADDS #4, ERd",
    bytes: 2,
    execute: cpu => {
        const rd = cpu.registers.getRegister32(cpu.instructions.bL)
        cpu.registers.setRegister32(cpu.instructions.bL, rd + 4)
    }
})

opcodeTable_aHaL_bH.register(0xF, 0x0, {
    name: "DAA Rd",
    bytes: 4,
    execute: cpu => {
        // TODO I have no clue if this works, not implemented in other emulators so it may be an issue :)
        const rd = cpu.instructions.bL
        let regValue = cpu.registers.getRegister8(rd);

        const cFlag = cpu.registers.flags.C;
        const hFlag = cpu.registers.flags.H;

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

        cpu.registers.flags.C = newCFlag;
        cpu.registers.flags.N = (regValue & 0x80) !== 0;
        cpu.registers.flags.Z = regValue === 0;
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
        const rd = cpu.registers.getRegister16(cpu.instructions.bL)
        const value = rd - 1
        cpu.registers.setRegister16(cpu.instructions.bL, value)

        setDecFlags(cpu, value, 8)
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
        cpu.registers.setRegister32(cpu.instructions.bL, rd - 4)
    }
})

opcodeTable_aHaL_bH.register(0x79, 0x0, {
    name: "MOV.W #xx:16, Rd",
    bytes: 4,
    execute: cpu => {
        const value = cpu.instructions.cd
        cpu.registers.setRegister16(cpu.instructions.bL, value)

        setMovFlags(cpu, value)
    }
})

