import {Memory} from "../memory/Memory";

export const SSER_ADDR = 0xF0E3
export const SSSR_ADDR = 0xF0E4
export const SSRDR_ADDR = 0xF0E9
export const SSTDR_ADDR = 0xF0EB

// TODO turn these flags and all others into enums for organization, it'shard to tell what flags are used on what registers
export const SSER_TRANSMIT_ENABLED = (1 << 7)
export const SSER_RECEIVE_ENABLED = (1 << 6)

export const SSSR_TRANSMIT_END = (1 << 3)
export const SSSR_TRANSMIT_EMPTY = (1 << 2)
export const SSSR_RECEIVE_DATA_FULL = (1 << 1)

export const PORT_1_ADDR = 0xFFD4
export const PORT_3_ADDR = 0xFFD6
export const PORT_8_ADDR = 0xFFDB
export const PORT_9_ADDR = 0xFFDC

export const EEPROM_PIN = (1 << 2)
export const LCD_DATA_PIN = (1 << 1)
export const LCD_PIN = (1 << 0)
export const ACCELERATOR_PIN = (1 << 0)

export const FTIOB_PIN = (1 << 2)
export const FTIOC_PIN = (1 << 3)
export const FTIOD_PIN = (1 << 4)

export class Ssu {
    memory: Memory

    progress: number = 0

    constructor(memory: Memory) {
        this.memory = memory

        this.statusRegister = SSSR_TRANSMIT_EMPTY
    }

    get enableRegister(): number {
        return this.memory.readByte(SSER_ADDR)
    }

    set enableRegister(value: number) {
        this.memory.writeByte(SSER_ADDR, value)
    }

    get statusRegister(): number {
        return this.memory.readByte(SSSR_ADDR)
    }

    set statusRegister(value: number) {
        this.memory.writeByte(SSSR_ADDR, value)
    }

    get transmitRegister(): number {
        return this.memory.readByte(SSTDR_ADDR)
    }

    set transmitRegister(value: number) {
        this.memory.writeByte(SSTDR_ADDR, value)

    }

    get receiveRegister(): number {
        return this.memory.readByte(SSRDR_ADDR)
    }

    set receiveRegister(value: number) {
        this.memory.writeByte(SSRDR_ADDR, value)
    }

    getPort(addr: number): number {
        return this.memory.readByte(addr)
    }

    setPort(addr: number, value: number) {
        this.memory.writeByte(addr, value)
    }
}