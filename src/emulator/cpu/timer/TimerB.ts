import {Memory} from "../../memory/Memory";

export const TIMER_B_MODE_ADDR = 0xF0D0
export const TIMER_B_COUNTER_ADDR = 0xF0D1

export const TIMER_B_COUNTING = (1 << 6)

export const TIMER_B_MODE_RESERVED = 0b00111000

export class TimerB {
    memory: Memory

    running: boolean = false

    loadValue: number = 0

    constructor(memory: Memory) {
        this.memory = memory

        this.mode |= TIMER_B_MODE_RESERVED
        this.counter = 0
    }

    get cycleCountSelect(): number {
        switch (this.mode & 0b111) {
            case 0b111:
                return 256
            case 0b110:
                return 1024
            default:
                throw Error("Unsupported timer clock counter select type")
        }
    }

    get mode(): number {
        return this.memory.readByte(TIMER_B_MODE_ADDR)
    }

    set mode(value: number) {
        this.memory.writeByte(TIMER_B_MODE_ADDR, value)
    }

    get counter(): number {
        return this.memory.readByte(TIMER_B_COUNTER_ADDR)
    }

    set counter(value: number) {
        this.memory.writeByte(TIMER_B_COUNTER_ADDR, value)
    }
}
