import {Memory} from "../../memory/Memory";

export const TIMER_W_MODE_ADDR = 0xF0F0
export const TIMER_W_CONTROL_ADDR = 0xF0F1
export const TIMER_W_INTERRUPT_ADDR = 0xF0F2
export const TIMER_W_STATUS_ADDR = 0xF0F3
export const TIMER_W_COUNTER_ADDR = 0xF0F6
export const TIMER_W_REGISTER_A_ADDR = 0xF0F8

export const TIMER_W_MODE_COUNTING = (1 << 7)
export const TIMER_W_MODE_RESERVED = 0b01001000

export const TIMER_W_CONTROL_COUNTER_CLEAR = (1 << 7)

export const TIMER_W_STATUS_MATCH_FLAG_A = (1 << 0)
export const TIMER_W_STATUS_RESERVED = 0b01110000

export const TIMER_W_INTERRUPT_ENABLE_A = (1 << 0)
export const TIMER_W_INTERRUPT_ENABLE_RESERVED = 0b01110000

export class TimerW {
    memory: Memory

    running: boolean = false

    constructor(memory: Memory) {
        this.memory = memory

        this.mode = TIMER_W_MODE_RESERVED
        this.counter = 0

        this.interruptEnable = TIMER_W_INTERRUPT_ENABLE_RESERVED
        this.status = TIMER_W_STATUS_RESERVED
        this.registerA = 0xFFFF
    }

    get mode(): number {
        return this.memory.readByte(TIMER_W_MODE_ADDR)
    }

    set mode(value: number) {
        this.memory.writeByte(TIMER_W_MODE_ADDR, value)
    }

    get interruptEnable(): number {
        return this.memory.readByte(TIMER_W_INTERRUPT_ADDR)
    }

    set interruptEnable(value: number) {
        this.memory.writeByte(TIMER_W_INTERRUPT_ADDR, value)
    }

    get controlRegister(): number {
        return this.memory.readByte(TIMER_W_CONTROL_ADDR)
    }

    set controlRegister(value: number) {
        this.memory.writeByte(TIMER_W_CONTROL_ADDR, value)
    }

    get status(): number {
        return this.memory.readByte(TIMER_W_STATUS_ADDR)
    }

    set status(value: number) {
        this.memory.writeByte(TIMER_W_STATUS_ADDR, value)
    }

    get counter(): number {
        return this.memory.readShort(TIMER_W_COUNTER_ADDR)
    }

    set counter(value: number) {
        this.memory.writeShort(TIMER_W_COUNTER_ADDR, value)
    }

    get registerA(): number {
        return this.memory.readShort(TIMER_W_REGISTER_A_ADDR)
    }

    set registerA(value: number) {
        this.memory.writeShort(TIMER_W_REGISTER_A_ADDR, value)
    }

}
