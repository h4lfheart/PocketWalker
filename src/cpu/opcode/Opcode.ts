import {Cpu} from "../Cpu";

export interface Opcode {
    name: string
    bytes: number
    execute: (cpu: Cpu) => void
    isTable?: boolean
}