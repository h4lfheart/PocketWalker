import {Cpu} from "../cpu.ts"
import {Opcodes} from "../components/opcodes.ts"
import {Board} from "../../board/board.ts"

export class Instruction {
    name: string = ""
    bytes: number = 0
    cycles: number = 0
    execute: ((board: Board, opcodes: Opcodes) => string) | ((board: Board, opcodes: Opcodes) => void) = () => {}
    isTable?: boolean
}