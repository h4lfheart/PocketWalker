import {Cpu} from "../Cpu";

export interface Opcode {
    name: string
    bytes: number
    cycles: number
    execute: ((cpu: Cpu) => string) | ((cpu: Cpu) => void)
    isTable?: boolean
}