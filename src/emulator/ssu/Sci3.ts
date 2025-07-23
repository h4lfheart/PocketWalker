import {Memory} from "../memory/Memory";

export namespace Sci3Flags {
    export enum Control {
        TRANSMIT_INTERRUPT_ENABLE = 1 << 7,
        RECEIVE_INTERRUPT_ENABLE = 1 << 6,
        TRANSMIT_ENABLE = 1 << 5,
        RECEIVE_ENABLE = 1 << 4,
    }

    export enum Status {
        TRANSMIT_DATA_EMPTY = 1 << 7,
        RECEIVE_DATA_FULL = 1 << 6,
        OVERRUN_ERROR = 1 << 5,
        FRAMING_ERROR = 1 << 4,
        PARITY_ERROR = 1 << 3,
        TRANSMIT_END = 1 << 2
    }

    export enum IRControl {
        IR_ENABLE = 1 << 7
    }
}

export const SCI3_CONTROL_ADDR = 0xFF9A
export const SCI3_TRANSMIT_ADDR = 0xFF9B
export const SCI3_STATUS_ADDR = 0xFF9C
export const SCI3_RECEIVE_ADDR = 0xFF9D
export const SCI3_IR_CONTROL_ADDR = 0xFFA7

export class Sci3 {
    memory: Memory

    constructor(memory: Memory) {
        this.memory = memory
    }

    get control(): Sci3Flags.Control {
        return this.memory.readByte(SCI3_CONTROL_ADDR)
    }

    set control(value: Sci3Flags.Control) {
        this.memory.writeByte(SCI3_CONTROL_ADDR, value)
    }

    get irControl(): Sci3Flags.IRControl {
        return this.memory.readByte(SCI3_IR_CONTROL_ADDR)
    }

    set irControl(value: Sci3Flags.IRControl) {
        this.memory.writeByte(SCI3_IR_CONTROL_ADDR, value)
    }

    get status(): Sci3Flags.Status {
        return this.memory.readByte(SCI3_STATUS_ADDR)
    }

    set status(value: Sci3Flags.Status) {
        this.memory.writeByte(SCI3_STATUS_ADDR, value)
    }

    get transmitData(): number {
        return this.memory.readByte(SCI3_TRANSMIT_ADDR)
    }

    set transmitData(value: number) {
        this.memory.writeByte(SCI3_TRANSMIT_ADDR, value)
    }

    get receiveData(): number {
        return this.memory.readByte(SCI3_RECEIVE_ADDR)
    }

    set receiveData(value: number) {
        this.memory.writeByte(SCI3_RECEIVE_ADDR, value)
    }
}