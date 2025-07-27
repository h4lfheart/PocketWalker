import {Memory} from "../memory/memory.ts";
import {TIMER_B_COUNTING, TimerB1} from "./components/timer-b1.ts";
import {BoardComponent} from "../board/board-component.ts";
import {Board} from "../board/board.ts";
import {TIMER_W_MODE_COUNTING, TimerW} from "./components/timer-w.ts";

export const CLOCK_STOP_1_ADDR = 0xFFFA
export const CLOCK_STOP_2_ADDR = 0xFFFB

export const TIMER_B1_STANDBY = (1 << 2)
export const FLASH_MEMORY_STANDBY = (1 << 1)
export const RTC_STANDBY = (1 << 0)

export const TIMER_W_STANDBY = (1 << 6)

export const WATCHDOG_STANDBY = (1 << 2)

export class Timers extends BoardComponent {

    b1: TimerB1
    w: TimerW

    clockCycles: number = 0

    constructor(board: Board) {
        super(board)

        this.b1 = new TimerB1(board)
        this.w = new TimerW(board)

        this.clockStop1 |= FLASH_MEMORY_STANDBY
        this.clockStop1 |= RTC_STANDBY

        this.clockStop2 |= WATCHDOG_STANDBY

        this.clockCycles = 0
    }

    override tick() {
        this.clockCycles++

        this.b1.running = Boolean((this.clockStop1 & TIMER_B1_STANDBY) && (this.b1.mode & TIMER_B_COUNTING))
        this.w.running = Boolean((this.clockStop2 & TIMER_W_STANDBY) && (this.w.mode & TIMER_W_MODE_COUNTING))

        if (this.b1.running && this.clockCycles % this.b1.clockRate == 0) {
            this.b1.tick()
        }

        if (this.w.running && this.clockCycles % this.w.clockRate == 0) {
            this.w.tick()
        }
    }

    get clockStop1(): number {
        return this.board.ram.readByte(CLOCK_STOP_1_ADDR)
    }

    set clockStop1(value: number) {
        this.board.ram.writeByte(CLOCK_STOP_1_ADDR, value)
    }

    get clockStop2(): number {
        return this.board.ram.readByte(CLOCK_STOP_2_ADDR)
    }

    set clockStop2(value: number) {
        this.board.ram.writeByte(CLOCK_STOP_2_ADDR, value)
    }
}
