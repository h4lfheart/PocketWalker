import { BoardComponent } from "../../board/boardComponent.ts";
import {Memory} from "../../memory/memory.ts";
import {Board} from "../../board/board.ts";

export const eepromCommands = {
    WRITE_ENABLE: 0b0000_0110,
    WRITE_DISABLE: 0b0000_0100,
    READ_STATUS: 0b0000_0101,
    WRITE_STATUS: 0b0000_0001,
    READ_MEMORY: 0b0000_0011,
    WRITE_MEMORY: 0b0000_0010
}

export const eepromFlags = {
    status: {
        WRITE_UNLOCK: 0x2
    }
}


export const eepromState = {
    waiting: 0,
    gettingStatus: 1,
    gettingAddressHigh: 2,
    gettingAddressLow: 3,
    gettingBytes: 4
}

export class EepRom extends BoardComponent {
    memory: Memory
    state: number = eepromState.waiting

    status: number = 0

    highAddress: number = 0
    lowAddress: number = 0
    offset: number = 0

    constructor(board: Board, eepromMemory: Memory) {
        super(board)
        this.memory = eepromMemory
    }


}