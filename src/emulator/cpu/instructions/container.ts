
import {Cpu} from "../cpu.ts"
import {Opcodes} from "../components/opcodes.ts"
import {Board} from "../../board/board.ts"
import {Instruction} from "./instruction.ts"

interface PatternEntry {
    firstPattern: (input: number) => boolean;
    secondPattern: (input: number) => boolean;
    instruction: Instruction;
}

export class InstructionContainer {
    name: string
    tableInstruction: Instruction

    firstGetter: (opcodes: Opcodes) => number
    secondGetter: (opcodes: Opcodes) => number

    constructor(name: string, first: (opcodes: Opcodes) => number, second: (opcodes: Opcodes) => number) {
        this.name = name;
        this.tableInstruction = {
            name: name,
            bytes: 0,
            cycles: 0,
            execute: (board, opcodes) => {
                return this.execute(board, opcodes)
            },
            isTable: true
        }

        this.firstGetter = first
        this.secondGetter = second
    }

    private table: Map<number, Map<number, Instruction>> = new Map()
    private patternTable: PatternEntry[] = []

    register(first: number | number[], second: number | number[], instruction: Instruction): void {
        const firstIndices = first instanceof Array ? first : [first]
        const secondIndices = second instanceof Array ? second: [second]

        for (const firstIndex of firstIndices) {
            for (const secondIndex of secondIndices) {
                if (!this.table.has(firstIndex)) {
                    this.table.set(firstIndex, new Map());
                }

                this.table.get(firstIndex)!.set(secondIndex, instruction);
            }
        }
    }

    registerPattern(first: (input: number) => boolean, second: (input: number) => boolean, instruction: Instruction) {
        this.patternTable.push({
            firstPattern: first,
            secondPattern: second,
            instruction: instruction
        });
    }

    execute(board: Board, opcodes: Opcodes): number {
        const firstValue = this.firstGetter(opcodes)
        const secondValue = this.secondGetter(opcodes)

        let instruction = this.table.get(firstValue)?.get(secondValue) ?? null
        if (instruction == null) instruction = this.findPatternMatch(firstValue, secondValue)
        if (instruction == null) {
            debugger
            console.log(`Made it to ${board.cpu.instructionCount} operations`)
            throw Error(`Instruction at 0x${board.cpu.registers.pc.toString(16)} with 0x${firstValue.toString(16)} 0x${secondValue.toString(16)} does not exist in table ${this.name}`)
        }

        const result = instruction.execute(board, opcodes);
        board.cpu.registers.pc += instruction.bytes

        return instruction.cycles
    }

    private findPatternMatch(firstValue: number, secondValue: number): Instruction | null {
        for (const entry of this.patternTable) {
            if (entry.firstPattern(firstValue) && entry.secondPattern(secondValue)) {
                return entry.instruction;
            }
        }
        return null;
    }
}