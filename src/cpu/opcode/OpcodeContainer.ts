import {Opcode} from "./Opcode";
import {Cpu} from "../Cpu";

let opCount: number = 0

export class OpcodeContainer {
    name: string
    opcode: Opcode

    firstGetter: (cpu: Cpu) => number
    secondGetter: (cpu: Cpu) => number


    constructor(name: string, first: (cpu: Cpu) => number, second: (cpu: Cpu) => number) {
        this.name = name;
        this.opcode = {
            name: name,
            bytes: 0,
            execute: cpu => {
                this.execute(cpu, first(cpu), second(cpu))
            },
            isTable: true
        }

        this.firstGetter = first
        this.secondGetter = second
    }

    private table: Map<number, Map<number, Opcode>> = new Map();

    register(first: number | number[], second: number | number[], opcode: Opcode): void {
        const firstIndices = first instanceof Array ? first : [first]
        const secondIndices = second instanceof Array ? second: [second]

        for (const firstIndex of firstIndices) {
            for (const secondIndex of secondIndices) {
                if (!this.table.has(firstIndex)) {
                    this.table.set(firstIndex, new Map());
                }

                this.table.get(firstIndex)!.set(secondIndex, opcode);
            }
        }
    }

    execute(cpu: Cpu): Opcode | undefined {
        const firstValue = this.firstGetter(cpu)
        const secondValue = this.secondGetter(cpu)

        const opcode = this.table.get(firstValue)?.get(secondValue)
        if (opcode == null) {
            console.log(`Made it to ${opCount} operations`)
            throw Error(`Opcode with 0x${firstValue.toString(16)} 0x${secondValue.toString(16)} does not exist in table ${this.name}`)
        }

        const preExecutePC = cpu.registers.pc;
        opcode.execute(cpu);
        cpu.registers.pc += opcode.bytes

        if (!opcode.isTable)
        {
            console.log(`0x${preExecutePC.toString(16)} - ${opcode.name}`)
            opCount++
        }
    }
}