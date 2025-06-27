export function setFlags(cpu: Cpu, value: number) {
    cpu.registers.flags.C = value & (1 << 0)
    cpu.registers.flags.V = value & (1 << 1)
    cpu.registers.flags.Z = value & (1 << 2)
    cpu.registers.flags.N = value & (1 << 3)
    cpu.registers.flags.U = value & (1 << 4)
    cpu.registers.flags.H = value & (1 << 5)
    cpu.registers.flags.UI = value & (1 << 6)
    cpu.registers.flags.I = value & (1 << 7)
}

export function setMovFlags(cpu: Cpu, value: number) {
    cpu.registers.flags.N = value & 0b1000_0000_0000_0000;
    cpu.registers.flags.Z = value == 0
    cpu.registers.flags.V = 0
}

export function setIncFlags(cpu: Cpu, value: number, bits: number) {
    const negativeFlag = (1 << (bits-1));
    flags.N = (value + 1) & negativeFlag;
    flags.Z = (value + 1) == 0;
    flags.V = ~(value ^ 1) & ((value + 1) ^ value) & negativeFlag;
}

export function setDecFlags(cpu: Cpu, value: number, bits: number) {
    const negativeFlag = (1 << (bits-1));
    cpu.registers.flags.N = (value - 1) & negativeFlag;
    cpu.registers.flags.Z = (value - 1) == 0;
    cpu.registers.flags.V = ~(value ^ -1) & ((value - 1) ^ value) & negativeFlag;
}

export function setAddFlags(cpu: Cpu, valueRd: number, valueRs: number, bits: number) {
    const maxValueLo = (1 << bits) - 1
    const negativeFlag = 1 << (bits - 1)
    let halfCarryFlag: number
    switch (bits) {
        case 8:
            halfCarryFlag = 0x8
            break
        case 16:
            halfCarryFlag = 0x100
            break
        case 32:
            halfCarryFlag = 0x10000
            break
    }

    cpu.registers.flags.Z = (valueRs + valueRd) == 0x0
    cpu.registers.flags.N = (valueRs + valueRd) & negativeFlag
    cpu.registers.flags.V = ~(valueRs ^ valueRd) & ((valueRs + valueRd) ^ valueRs) & negativeFlag
    cpu.registers.flags.C = (valueRs & negativeFlag) && !(valueRd & negativeFlag) && !((valueRs + valueRd) & negativeFlag)
    cpu.registers.flags.H = (((valueRs & maxValueLo) + (valueRd & maxValueLo) & halfCarryFlag) == halfCarryFlag) ? 1 : 0
}


export function setSubFlags(cpu: Cpu, valueRd: number, valueRs: number, bits: number) {
    const maxValueLo = (1 << bits) - 1
    const negativeFlag = 1 << (bits - 1)

    cpu.registers.flags.N = (valueRd - valueRs) & negativeFlag
    cpu.registers.flags.Z = (valueRd - valueRs) == 0x0
    cpu.registers.flags.V = ((valueRd ^ valueRs) & negativeFlag) && (~((valueRd - valueRs) ^ valueRs) & negativeFlag)
    cpu.registers.flags.C = valueRs > valueRd
    cpu.registers.flags.H = (valueRs & maxValueLo) > (valueRd & maxValueLo)
}