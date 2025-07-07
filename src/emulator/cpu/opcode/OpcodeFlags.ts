import { Cpu } from "../Cpu";

export function getNegativeFlag(bits: number): number {
    return 1 << (bits - 1);
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
    const maxValue = (1 << bits) - 1;
    const result = valueRd + valueRs;
    const lowMask = (1 << (bits / 2)) - 1;
    const halfCarryMask = 1 << (bits / 2);

    cpu.flags.Z = (result & maxValue) === 0;
    cpu.flags.N = (result & negativeFlag) !== 0;
    cpu.flags.V = ((valueRd ^ result) & (valueRs ^ result) & negativeFlag) !== 0;
    cpu.flags.C = result > maxValue;
    cpu.flags.H = (((valueRd & lowMask) + (valueRs & lowMask)) & halfCarryMask) !== 0;
}

export function setSubFlags(cpu: Cpu, valueRd: number, valueRs: number, bits: number): void {
    const negativeFlag = getNegativeFlag(bits);
    const maxValue = (1 << bits) - 1;
    const result = valueRd - valueRs;
    const lowMask = (1 << (bits / 2)) - 1;

    cpu.flags.Z = (result & maxValue) === 0;
    cpu.flags.N = (result & negativeFlag) !== 0;
    cpu.flags.V = ((valueRd ^ valueRs) & (valueRd ^ result) & negativeFlag) !== 0;
    cpu.flags.C = valueRs > valueRd;  // Borrow occurred (unsigned comparison)
    cpu.flags.H = ((valueRs & lowMask) > (valueRd & lowMask));  // Half-borrow occurred
}