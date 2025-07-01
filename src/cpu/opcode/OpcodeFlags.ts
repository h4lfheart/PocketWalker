import { Cpu } from "../Cpu";

export function getNegativeFlag(bits: number): number {
    return 1 << (bits - 1);
}

export function setFlags(cpu: Cpu, value: number): void {
    cpu.flags.C = (value & (1 << 0)) !== 0;
    cpu.flags.V = ((value & (1 << 1)) >> 1) !== 0;
    cpu.flags.Z = ((value & (1 << 2)) >> 2) !== 0;
    cpu.flags.N = ((value & (1 << 3)) >> 3) !== 0;
    cpu.flags.U = ((value & (1 << 4)) >> 4) !== 0;
    cpu.flags.H = ((value & (1 << 5)) >> 5) !== 0;
    cpu.flags.UI = ((value & (1 << 6)) >> 6) !== 0;
    cpu.flags.I = ((value & (1 << 7)) >> 7) !== 0;
}

export function setMovFlags(cpu: Cpu, value: number, bits: number): void {
    const negativeFlag = getNegativeFlag(bits);
    cpu.flags.N = (value & negativeFlag) !== 0;
    cpu.flags.Z = value === 0;
    cpu.flags.V = false;
}

export function setIncFlags(cpu: Cpu, value: number, bits: number): void {
    const negativeFlag = getNegativeFlag(bits);
    const result = value + 1;
    cpu.flags.N = (result & negativeFlag) !== 0;
    cpu.flags.Z = result === 0;
    cpu.flags.V = (value & negativeFlag) !== 0 && result === 0;
}

export function setDecFlags(cpu: Cpu, value: number, bits: number): void {
    const negativeFlag = getNegativeFlag(bits);
    const result = value - 1;
    cpu.flags.N = (result & negativeFlag) !== 0;
    cpu.flags.Z = result === 0;
    cpu.flags.V = value === 0 && (result & negativeFlag) !== 0;
}

export function setAddFlags(cpu: Cpu, valueRd: number, valueRs: number, bits: number): void {
    const negativeFlag = getNegativeFlag(bits);
    const result = valueRd + valueRs;
    cpu.flags.Z = result === 0;
    cpu.flags.N = (result & negativeFlag) !== 0;
    cpu.flags.V = (((valueRd ^ valueRs) & ~(valueRd ^ result)) & negativeFlag) !== 0;
    cpu.flags.C = result > ((1 << bits) - 1);
    cpu.flags.H = (((valueRd & 0xF) + (valueRs & 0xF)) > 0xF);
}

export function setSubFlags(cpu: Cpu, valueRd: number, valueRs: number, bits: number): void {
    const negativeFlag = getNegativeFlag(bits);
    const result = valueRd - valueRs;
    cpu.flags.Z = result === 0;
    cpu.flags.N = (result & negativeFlag) !== 0;
    cpu.flags.V = (((valueRd ^ valueRs) & (valueRd ^ result)) & negativeFlag) !== 0;
    cpu.flags.C = valueRs > valueRd;
    cpu.flags.H = ((valueRs & 0xF) > (valueRd & 0xF));
}
