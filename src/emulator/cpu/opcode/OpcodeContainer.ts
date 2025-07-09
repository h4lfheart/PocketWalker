import {Opcode} from "./Opcode";
import {Cpu} from "../Cpu";

interface PatternEntry {
    firstPattern: (input: number) => boolean;
    secondPattern: (input: number) => boolean;
    opcode: Opcode;
}

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
                this.execute(cpu)
            },
            isTable: true
        }

        this.firstGetter = first
        this.secondGetter = second
    }

    private table: Map<number, Map<number, Opcode>> = new Map()
    private patternTable: PatternEntry[] = []

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

    registerPattern(first: (input: number) => boolean, second: (input: number) => boolean, opcode: Opcode) {
        this.patternTable.push({
            firstPattern: first,
            secondPattern: second,
            opcode: opcode
        });
    }

    execute(cpu: Cpu) {
        const firstValue = this.firstGetter(cpu)
        const secondValue = this.secondGetter(cpu)

        let opcode = this.table.get(firstValue)?.get(secondValue) ?? null
        if (opcode == null) opcode = this.findPatternMatch(firstValue, secondValue)
        if (opcode == null) {
            console.log(`Made it to ${cpu.opcodeCount} operations`)
            throw Error(`Opcode with 0x${firstValue.toString(16)} 0x${secondValue.toString(16)} does not exist in table ${this.name}`)
        }

        const preExecutePC = cpu.registers.pc;
        const result = opcode.execute(cpu);
        cpu.registers.pc += opcode.bytes

        const startDebug = 4244500
        const debugLength = 1000

        const inRange = cpu.opcodeCount >= startDebug && cpu.opcodeCount <= startDebug + debugLength

        const debugOpcode = false
        const debugRegisters = false
        const debugFlags = false

        if (!opcode.isTable)
        {
            if (debugOpcode) {
                console.log(`${cpu.opcodeCount} - 0x${preExecutePC.toString(16)} - ${result == undefined ? opcode.name : result}`)
            }

            if (debugRegisters) {
                let erString = `${cpu.opcodeCount} - `
                for (let i = 0; i < 8; i++) {
                    erString += `ER${i}: [0x${cpu.registers.getRegister32(i).toString(16).padStart(8, '0')}], `
                }
                console.log(erString)
            }

            if (debugFlags) {
                console.log(`${cpu.opcodeCount} - I: ${cpu.flags.I?1:0}, H: ${cpu.flags.H?1:0}, N: ${cpu.flags.N?1:0}, Z: ${cpu.flags.Z?1:0}, V: ${cpu.flags.V?1:0}, C: ${cpu.flags.C?1:0}`)
            }
        }
    }

    private findPatternMatch(firstValue: number, secondValue: number): Opcode | null {
        for (const entry of this.patternTable) {
            if (entry.firstPattern(firstValue) && entry.secondPattern(secondValue)) {
                return entry.opcode;
            }
        }
        return null;
    }
}