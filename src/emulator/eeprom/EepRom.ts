import {Memory} from "../memory/Memory";

export const EEPROM_WRITE_UNLOCK = 0x2

export const EEPROM_WRITE = 0x2
export const EEPROM_READ_MEMORY = 0x3
export const EEPROM_READ_STATUS = 0x5
export const EEPROM_WRITE_ENABLE = 0x6

export class EepRom {
    memory: Memory
    state: EepRomState = EepRomState.Waiting

    status: number = 0
    highAddress: number = 0
    lowAddress: number = 0
    offset: number = 0

    constructor(memory: Memory) {
        this.memory = memory
    }


}

export enum EepRomState {
    Waiting,
    GettingStatus,
    GettingAddressHigh,
    GettingAddressLow,
    GettingBytes
}