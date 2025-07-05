
import {Memory} from "../memory/Memory";
import {Flags} from "./Flags";

export const VECTOR_RTC_QUARTER = 0xA65E
export const VECTOR_RTC_HALF =0xA674
export const VECTOR_RTC_ONE = 0xA682

export const IENR1_ADDR = 0xFFF3
export const IENR2_ADDR = 0xFFF4
export const IRR1_ADDR = 0xFFF6
export const IRR2_ADDR = 0xFFF7

export const IEN0 = (1 << 0)

export const IRRI0 = (1 << 0)

export const IENRTC = (1 << 7)
export const IENTB1 = (1 << 2)

export const IRRTB1 = (1 << 2)

export const RTC_ADDR = 0xF067

export const QUARTER_SECOND_INTERRUPT_ENABLE = (1 << 0)
export const HALF_SECOND_INTERRUPT_ENABLE = (1 << 1)
export const ONE_SECOND_INTERRUPT_ENABLE = (1 << 2)

export class Interrupts {
    memory: Memory

    savedAddress: number = 0
    savedFlags: Flags = new Flags()
    quarterCount: number = 0

    constructor(memory: Memory) {
        this.memory = memory
    }

    rtcInterrupt() {
        this.quarterCount++

        this.rtcFlagRegister |= QUARTER_SECOND_INTERRUPT_ENABLE

        if (this.quarterCount % 2 == 0) {
            this.rtcFlagRegister |= HALF_SECOND_INTERRUPT_ENABLE
        }

        if (this.quarterCount % 4 == 0) {
            this.rtcFlagRegister |= ONE_SECOND_INTERRUPT_ENABLE
        }
    }

    get enableRegister1(): number {
        return this.memory.readByte(IENR1_ADDR)
    }

    set enableRegister1(value: number) {
        this.memory.writeByte(IENR1_ADDR, value)
    }

    get enableRegister2(): number {
        return this.memory.readByte(IENR2_ADDR)
    }

    set enableRegister2(value: number) {
        this.memory.writeByte(IENR2_ADDR, value)
    }

    get flagRegister1(): number {
        return this.memory.readByte(IRR1_ADDR)
    }

    set flagRegister1(value: number) {
        this.memory.writeByte(IRR1_ADDR, value)
    }

    get flagRegister2(): number {
        return this.memory.readByte(IRR2_ADDR)
    }

    set flagRegister2(value: number) {
        this.memory.writeByte(IRR2_ADDR, value)
    }

    get rtcFlagRegister(): number {
        return this.memory.readByte(RTC_ADDR)
    }

    set rtcFlagRegister(value: number) {
        this.memory.writeByte(RTC_ADDR, value)
    }
}