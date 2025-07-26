import {Memory} from "../../memory/memory.ts"
import {Flags} from "./flags.ts"

export const IENR1_ADDR = 0xFFF3
export const IENR2_ADDR = 0xFFF4
export const IRR1_ADDR = 0xFFF6
export const IRR2_ADDR = 0xFFF7


export const interruptFlags = {
    enable1: {
        RTC: 1 << 7,
        IRQ1: 1 << 1,
        IRQ0: 1 << 0
    },
    flag1: {
        IRQ1: 1 << 1,
        IRQ0: 1 << 0,
    },
    enable2: {
        TIMER_B1: 1 << 2
    },
    flag2: {
        TIMER_B1: 1 << 2
    }
}

export class Interrupts {
    memory: Memory

    savedAddress: number = 0
    savedFlags: Flags = new Flags()

    constructor(memory: Memory) {
        this.memory = memory
    }

    get enable1(): number {
        return this.memory.readByte(IENR1_ADDR)
    }

    set enable1(value: number) {
        this.memory.writeByte(IENR1_ADDR, value)
    }

    get enable2(): number {
        return this.memory.readByte(IENR2_ADDR)
    }

    set enable2(value: number) {
        this.memory.writeByte(IENR2_ADDR, value)
    }

    get flag1(): number {
        return this.memory.readByte(IRR1_ADDR)
    }

    set flag1(value: number) {
        this.memory.writeByte(IRR1_ADDR, value)
    }

    get flag2(): number {
        return this.memory.readByte(IRR2_ADDR)
    }

    set flag2(value: number) {
        this.memory.writeByte(IRR2_ADDR, value)
    }
}