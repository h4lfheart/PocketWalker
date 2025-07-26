import {Memory} from "../../memory/memory.ts"
import {BoardComponent} from "../../board/board-component.ts"
import {Board} from "../../board/board.ts"
import {PeripheralComponent} from "../peripheral-component.ts";
import {Ssu, ssuFlags} from "../../ssu/ssu.ts";

const RAM_SIZE = 0x7F

export const accelerometerState = {
    address: 0,
    data: 1
}

export class Accelerometer extends PeripheralComponent {
    memory: Memory

    state: number = accelerometerState.address
    address: number = 0
    offset: number = 0

    constructor(board: Board) {
        super(board)

        this.memory = Memory.fromSize(RAM_SIZE)
    }

    override transmitAndReceive(ssu: Ssu) {
        switch (this.state) {
            case accelerometerState.address:
                this.address = ssu.transmit
                this.offset = 0
                this.state = accelerometerState.data
                ssu.status |= ssuFlags.status.RECEIVE_FULL
                break
            case accelerometerState.data:
                ssu.receive = this.memory.readByte(this.address + this.offset)
                this.offset++
                ssu.status |= ssuFlags.status.RECEIVE_FULL
                ssu.status |= ssuFlags.status.TRANSMIT_EMPTY
                ssu.status |= ssuFlags.status.TRANSMIT_END

                break
        }
    }

    override transmit(ssu: Ssu) {
        switch (this.state) {
            case accelerometerState.address:
                this.address = ssu.transmit
                this.state = accelerometerState.data
                break
            case accelerometerState.data:
                this.board.accelerometer.memory.writeByte(this.address, ssu.transmit)
                ssu.status |= ssuFlags.status.TRANSMIT_EMPTY
                ssu.status |= ssuFlags.status.TRANSMIT_END

                break
        }
    }
}