import {Board} from "../board/board.ts"
import {BoardComponent} from "../board/board-component.ts"
import {Flags} from "./components/flags.ts"
import {Registers} from "./components/registers.ts"
import {Opcodes} from "./components/opcodes.ts"
import {InstructionTable} from "./instructions/table.ts"
import {interruptFlags, Interrupts} from "./components/interrupts.ts"
import {VectorTable} from "./components/vector-table.ts"
import {Rtc, rtcFlags} from "../rtc/rtc.ts";
import {parentPort} from "node:worker_threads";
import {inputKey} from "../ssu/ssu.ts";

export class Cpu extends BoardComponent {
    flags: Flags = new Flags()
    opcodes: Opcodes = new Opcodes()
    registers: Registers
    interrupts: Interrupts
    vectorTable: VectorTable

    instructionCount: number = 0
    sleep: boolean = false

    constructor(board: Board) {
        super(board);

        this.registers = new Registers(board.ram)
        this.interrupts = new Interrupts(board.ram)
        this.vectorTable = new VectorTable(board.ram)

        this.registers.pc = this.vectorTable.reset
        this.flags.I = true
    }

    step(): number {
        if (this.registers.pc == 0x336) {
            this.registers.pc += 4
            return 1
        }

        if (this.registers.pc == 0x350) {
            this.registers.pc += 4
            this.registers.setRegister8(0b1000, 0x00)
            return 1
        }

        if (this.registers.pc == 0x7700) {
            this.registers.pc += 2
            return 1
        }

        if (this.registers.pc == 0x9C3E) {
            if (this.board.ssu.portB != 0) {
                this.board.ssu.portB = inputKey.KEY_NONE
            }
        }

        // set watts
        // TODO where is this actually stored? is it an eeprom thing? don't want to have it set it like this
        if (this.registers.pc == 0x9a4e && this.board.ram.readShort(0xF78E) == 0) {
            this.board.ram.writeShort(0xF78E, 255)
        }

        if (this.registers.pc == 0x08ee) {
            this.registers.pc += 2
            return 1
        }

        // todo use real performance timing to avoid needing to add fake cycles during sleep
        let cycleCount = 2
        if (!this.sleep) {
            this.opcodes.load(this.board.ram, this.registers.pc)

            cycleCount = InstructionTable.aH_aL.execute(this.board, this.opcodes)

            this.instructionCount++
        }

        if (!this.flags.I) {
            if (this.interrupts.enable1 & interruptFlags.enable1.IRQ0 && this.interrupts.flag1 & interruptFlags.flag1.IRQ0) {
                this.interrupt(this.vectorTable.irq0)
            } else if (this.interrupts.enable1 & interruptFlags.enable1.IRQ1 && this.interrupts.flag1 & interruptFlags.flag1.IRQ1) {
                this.interrupt(this.vectorTable.irq1)
            } else if (this.interrupts.enable1 & interruptFlags.enable1.RTC) {
                if (this.board.rtc.interruptFlag & rtcFlags.quarterSecond) {
                    this.interrupt(this.vectorTable.rtcQuarterSecond)
                } else if (this.board.rtc.interruptFlag & rtcFlags.halfSecond) {
                    this.interrupt(this.vectorTable.rtcHalfSecond)
                } else if (this.board.rtc.interruptFlag & rtcFlags.second) {
                    this.interrupt(this.vectorTable.rtcSecond)
                } else if (this.board.rtc.interruptFlag & rtcFlags.minute) {
                    this.interrupt(this.vectorTable.rtcMinute)
                } else if (this.board.rtc.interruptFlag & rtcFlags.hour) {
                    this.interrupt(this.vectorTable.rtcHour)
                }
            } else if (this.interrupts.enable2 & interruptFlags.enable2.TIMER_B1 && this.interrupts.flag2 & interruptFlags.flag2.TIMER_B1) {
                this.interrupt(this.vectorTable.timerB)
            }
        }

        return cycleCount
    }

    interrupt(addr: number)  {
        this.interrupts.savedAddress = this.registers.pc
        this.interrupts.savedFlags = this.flags.copy()

        this.registers.pc = addr
        this.flags.I = true
        this.sleep = false
    }
}