import {Memory} from "../../memory/Memory";
import {TimerB} from "./TimerB";

export const CLOCK_CYCLES_PER_SECOND = 32768

export const CLOCK_STOP_1_ADDR = 0xFFFA
export const CLOCK_STOP_2_ADDR = 0xFFFB

export const VECTOR_TIMER_B1 = 0x06FA

export const TIMER_B1_STANDBY = (1 << 2)
export const FLASH_MEMORY_STANDBY = (1 << 1)
export const RTC_STANDBY = (1 << 0)

export const WATCHDOG_STANDBY = (1 << 2)

export class Timers {
    memory: Memory

    B: TimerB

    constructor(memory: Memory) {
        this.memory = memory

        this.B = new TimerB(memory)

        this.clockStop1 |= FLASH_MEMORY_STANDBY
        this.clockStop1 |= RTC_STANDBY

        this.clockStop2 |= WATCHDOG_STANDBY
    }

    get clockStop1(): number {
        return this.memory.readByte(CLOCK_STOP_1_ADDR)
    }

    set clockStop1(value: number) {
        this.memory.writeByte(CLOCK_STOP_1_ADDR, value)
    }

    get clockStop2(): number {
        return this.memory.readByte(CLOCK_STOP_2_ADDR)
    }

    set clockStop2(value: number) {
        this.memory.writeByte(CLOCK_STOP_2_ADDR, value)
    }
}
