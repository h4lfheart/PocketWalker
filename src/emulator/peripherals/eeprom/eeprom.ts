import { BoardComponent } from "../../board/board-component.ts";
import {Memory} from "../../memory/memory.ts";
import {Board} from "../../board/board.ts";
import {PeripheralComponent} from "../peripheral-component.ts";
import {Ssu, ssuFlags} from "../../ssu/ssu.ts";

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

export class EepRom extends PeripheralComponent {
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

    transmitAndReceive(ssu: Ssu, meta?: string) {
        ssu.progress++
        if (ssu.progress == 7) {
            ssu.progress = 0

            switch (this.state) {
                case eepromState.waiting:
                    if (ssu.transmit == eepromCommands.READ_MEMORY) {
                        this.state = eepromState.gettingAddressHigh
                    } else if (ssu.transmit == eepromCommands.READ_STATUS) {
                        this.state = eepromState.gettingStatus
                    } else {
                        debugger
                    }

                    break;
                case eepromState.gettingStatus:
                    ssu.receive = this.status
                    ssu.status |= ssuFlags.status.TRANSMIT_END
                    break;
                case eepromState.gettingAddressHigh:
                    this.highAddress = ssu.transmit
                    this.state = eepromState.gettingAddressLow
                    break;
                case eepromState.gettingAddressLow:
                    this.lowAddress = ssu.transmit
                    this.state = eepromState.gettingBytes
                    break;
                case eepromState.gettingBytes:
                    ssu.receive = this.memory.readByte(((this.highAddress << 8) | this.lowAddress) + this.offset)
                    this.offset++
                    ssu.status |= ssuFlags.status.TRANSMIT_END
                    break;

            }

            ssu.status |= ssuFlags.status.RECEIVE_FULL
            ssu.status |= ssuFlags.status.TRANSMIT_EMPTY
        }
    }

    transmit(ssu: Ssu, meta?: string) {
        ssu.progress++
        if (ssu.progress == 7) {
            ssu.progress = 0

            switch (this.state) {
                case eepromState.waiting:
                    if (ssu.transmit == eepromCommands.WRITE_ENABLE) {
                        this.status |= eepromFlags.status.WRITE_UNLOCK
                        ssu.status |= ssuFlags.status.TRANSMIT_END
                    } else if (ssu.transmit == eepromCommands.WRITE_MEMORY) {
                        this.state = eepromState.gettingAddressHigh
                    } else {
                        debugger
                    }
                    break;
                case eepromState.gettingAddressHigh:
                    this.highAddress = ssu.transmit
                    this.state = eepromState.gettingAddressLow
                    break;
                case eepromState.gettingAddressLow:
                    this.lowAddress = ssu.transmit
                    this.state = eepromState.gettingBytes
                    break;
                case eepromState.gettingBytes:
                    this.memory.writeByte((((this.highAddress << 8) | this.lowAddress) + this.offset), ssu.transmit)
                    this.offset++
                    this.offset %= 128
                    ssu.status |= ssuFlags.status.TRANSMIT_END
                    break;

            }

            ssu.status |= ssuFlags.status.TRANSMIT_EMPTY
        }
    }
}