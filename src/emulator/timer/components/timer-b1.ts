import {Memory} from "../../memory/memory.ts";
import {BoardComponent} from "../../board/board-component.ts";
import {Board} from "../../board/board.ts";
import {toUnsignedByte} from "../../../extensions/bit-extensions.ts";
import {interruptFlags} from "../../cpu/components/interrupts.ts";

export const TIMER_B_MODE_ADDR = 0xF0D0
export const TIMER_B_COUNTER_ADDR = 0xF0D1

export const TIMER_B_COUNTING = (1 << 6)

export const TIMER_B_MODE_RESERVED = 0b00111000

export class TimerB1 extends BoardComponent {
    running: boolean = false

    loadValue: number = 0

    constructor(board: Board) {
        super(board)

        this.mode |= TIMER_B_MODE_RESERVED
        this.counter = 0


        this.board.ram.onWrite(TIMER_B_COUNTER_ADDR, (value: number) => {
            this.loadValue = value
        })
    }

    override tick() {
        this.counter = toUnsignedByte(this.counter + 1)

        if (this.counter == 0) {
            this.board.cpu.interrupts.flag2 |= interruptFlags.flag2.TIMER_B1
            this.counter = this.loadValue
        }
    }

    get clockRate(): number {
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
        return this.board.ram.readByte(TIMER_B_MODE_ADDR)
    }

    set mode(value: number) {
        this.board.ram.writeByte(TIMER_B_MODE_ADDR, value)
    }

    get counter(): number {
        return this.board.ram.readByte(TIMER_B_COUNTER_ADDR, true)
    }

    set counter(value: number) {
        this.board.ram.writeByte(TIMER_B_COUNTER_ADDR, value, true)
    }
}
