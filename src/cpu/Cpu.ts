import {Registers} from "./Registers";
import {Memory} from "../memory/Memory";
import {opcodeTable_aH_aL} from "./opcode/OpcodeTable";
import {Instructions} from "./Instructions";
import {Flags} from "./Flags";



export class Cpu {
    memory: Memory

    flags: Flags = {
        I: false,
        U: false,
        H: false,
        N: false,
        Z: false,
        V: false,
        C: false,
        UI: false
    }
    
    registers: Registers = new Registers()
    instructions: Instructions = new Instructions()

    sleep: boolean = false

    constructor(memory: Memory) {
        this.memory = memory;

        this.registers.pc = this.memory.readShort(0)
        this.flags.I = true
    }

    execute() {
        if (!this.sleep) {
            this.loadInstructions()
            opcodeTable_aH_aL.execute(this)
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