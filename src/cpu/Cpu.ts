import {Registers} from "./Registers";
import {Memory} from "../memory/Memory";
import {opcodeTable_aH_aL} from "./opcode/OpcodeTable";
import {Instructions} from "./Instructions";



export class Cpu {
    memory: Memory

    registers: Registers = new Registers()
    instructions: Instructions = new Instructions()
    sleep: boolean = false

    constructor(memory: Memory) {
        this.memory = memory;
    }

    execute() {
        if (!this.sleep) {
            this.loadInstructions()

            opcodeTable_aH_aL.execute(this)
        }

        if (!this.registers.flags.I) {
            // TODO interrupts
        }
    }

    loadInstructions() {
        const a = this.memory.readByte(this.registers.pc)
        const b = this.memory.readByte(this.registers.pc + 1)
        const c = this.memory.readByte(this.registers.pc + 2)
        const d = this.memory.readByte(this.registers.pc + 3)
        const e = this.memory.readByte(this.registers.pc + 4)
        const f = this.memory.readByte(this.registers.pc + 5)

        this.instructions.set(a, b, c, d, e, f)
    }

}