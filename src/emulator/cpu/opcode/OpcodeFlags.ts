import { Cpu } from "../Cpu"

export function getNegativeFlag(bits: number): number {
    return 1 << (bits - 1)
}

export function setMovFlags(cpu: Cpu, value: number, bits: number): void {
    const negativeFlag = getNegativeFlag(bits)
    cpu.flags.N = (value & negativeFlag) !== 0
    cpu.flags.Z = value === 0
    cpu.flags.V = false
}

export function setIncFlags(cpu: Cpu, value: number, bits: number): void {
    const negativeFlag = getNegativeFlag(bits)
    const result = (value + 1) & ((1 << bits) - 1)
    cpu.flags.N = (result & negativeFlag) !== 0
    cpu.flags.Z = result === 0
    cpu.flags.V = value === ((negativeFlag >> 1) - 1)
}

export function setDecFlags(cpu: Cpu, value: number, bits: number): void {
    const negativeFlag = getNegativeFlag(bits)
    const result = (value - 1) & ((1 << bits) - 1)
    cpu.flags.N = (result & negativeFlag) !== 0
    cpu.flags.Z = result === 0
    cpu.flags.V = value === negativeFlag
}

export function setAddFlags(cpu: Cpu, valueRd: number, valueRs: number, bits: number): void {
    const negativeFlag = getNegativeFlag(bits)
    const maxValue = (1 << bits) - 1
    const result = valueRd + valueRs

    cpu.flags.Z = (result & maxValue) === 0
    cpu.flags.N = (result & negativeFlag) !== 0
    cpu.flags.V = ((~(valueRd ^ valueRs) & (valueRd ^ result)) & negativeFlag) !== 0
    cpu.flags.C = result > maxValue
    cpu.flags.H = (((valueRd ^ valueRs ^ result) >> (bits / 2 - 1)) & 1) !== 0
}

export function setSubFlags(cpu: Cpu, valueRd: number, valueRs: number, bits: number): void {
    const negativeFlag = getNegativeFlag(bits)
    const maxValue = (1 << bits) - 1
    const result = valueRd - valueRs
    const lowMask = (1 << (bits / 2)) - 1

    cpu.flags.Z = (result & maxValue) === 0
    cpu.flags.N = (result & negativeFlag) !== 0
    cpu.flags.V = ((valueRd ^ valueRs) & (valueRd ^ result) & negativeFlag) !== 0
    cpu.flags.C = valueRs > valueRd
    cpu.flags.H = (((valueRd ^ valueRs ^ result) >> (bits / 2 - 1)) & 1) !== 0
}