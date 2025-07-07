import {Memory} from "../memory/Memory";

export const VECTOR_RESET_ADDR = 0x0000

export const VECTOR_IRQ0_ADDR = 0x0020
export const VECTOR_IRQ1_ADDR = 0x0022

export const VECTOR_RTC_QUARTER_SECOND_ADDR = 0x002E
export const VECTOR_RTC_HALF_SECOND_ADDR = 0x0030
export const VECTOR_RTC_SECOND_ADDR = 0x0032
export const VECTOR_RTC_MINUTE_ADDR = 0x0034
export const VECTOR_RTC_HOUR_ADDR = 0x0036
export const VECTOR_RTC_DAY_ADDR = 0x0038
export const VECTOR_RTC_WEEK_ADDR = 0x0038

export const VECTOR_TIMER_B_ADDR = 0x0042
export const VECTOR_TIMER_W_ADDR = 0x0046

export class VectorTable {
    memory: Memory

    constructor(memory: Memory) {
        this.memory = memory
    }

    get reset(): number {
        return this.memory.readShort(VECTOR_RESET_ADDR)
    }

    get irq0(): number {
        return this.memory.readShort(VECTOR_IRQ0_ADDR)
    }

    get irq1(): number {
        return this.memory.readShort(VECTOR_IRQ1_ADDR)
    }

    get rtcQuarterSecond(): number {
        return this.memory.readShort(VECTOR_RTC_QUARTER_SECOND_ADDR)
    }

    get rtcHalfSecond(): number {
        return this.memory.readShort(VECTOR_RTC_HALF_SECOND_ADDR)
    }

    get rtcSecond(): number {
        return this.memory.readShort(VECTOR_RTC_SECOND_ADDR)
    }

    get rtcMinute(): number {
        return this.memory.readShort(VECTOR_RTC_MINUTE_ADDR)
    }

    get rtcHour(): number {
        return this.memory.readShort(VECTOR_RTC_HOUR_ADDR)
    }

    get rtcDay(): number {
        return this.memory.readShort(VECTOR_RTC_DAY_ADDR)
    }

    get rtcWeek(): number {
        return this.memory.readShort(VECTOR_RTC_WEEK_ADDR)
    }

    get timerB(): number {
        return this.memory.readShort(VECTOR_TIMER_B_ADDR)
    }

    get timerW(): number {
        return this.memory.readShort(VECTOR_TIMER_W_ADDR)
    }
}