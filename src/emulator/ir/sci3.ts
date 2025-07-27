import {BoardComponent} from "../board/board-component.ts";
import {Board} from "../board/board.ts";
import {parentPort} from "node:worker_threads";

export const sci3Flags = {
    control: {
        TRANSMIT_INTERRUPT_ENABLE: 1 << 7,
        RECEIVE_INTERRUPT_ENABLE: 1 << 6,
        TRANSMIT_ENABLE: 1 << 5,
        RECEIVE_ENABLE: 1 << 4,
    },
    status: {
        TRANSMIT_EMPTY: 1 << 7,
        RECEIVE_FULL: 1 << 6,
        OVERRUN_ERROR: 1 << 5,
        FRAMING_ERROR: 1 << 4,
        PARITY_ERROR: 1 << 3,
        TRANSMIT_END: 1 << 2
    }
}

export const SCI3_CONTROL_ADDR = 0xFF9A
export const SCI3_TRANSMIT_ADDR = 0xFF9B
export const SCI3_STATUS_ADDR = 0xFF9C
export const SCI3_RECEIVE_ADDR = 0xFF9D

export class Sci3 extends BoardComponent {
    receiveData: number[] = []

    constructor(board: Board) {
        super(board);

        this.board.ram.onRead(SCI3_RECEIVE_ADDR, () => {
            this.status &= ~sci3Flags.status.RECEIVE_FULL

            parentPort!.postMessage({
                type: 'log',
                data: `[IR] Receive Open at 0x${this.board.cpu.registers.pc.toString(16)}`
            })
        })

        this.board.ram.onWrite(SCI3_TRANSMIT_ADDR, () => {
            this.status &= ~sci3Flags.status.TRANSMIT_EMPTY
            this.status &= ~sci3Flags.status.TRANSMIT_END

            parentPort!.postMessage({
                type: 'log',
                data: `[IR] Transmit Full at 0x${this.board.cpu.registers.pc.toString(16)}`
            })
        })

        this.board.ram.onWrite(SCI3_CONTROL_ADDR, value => {
            parentPort!.postMessage({
                type: 'log',
                data: `[IR] Control: ${value} at 0x${board.cpu.registers.pc.toString(16)}`
            })
        })
    }

    tick() {
        if (~this.control & sci3Flags.control.TRANSMIT_ENABLE) {
            this.status |= sci3Flags.status.TRANSMIT_EMPTY
        }
        if (this.control & sci3Flags.control.TRANSMIT_ENABLE) {
            if (~this.status & sci3Flags.status.TRANSMIT_EMPTY) {
                const transmitValue = this.transmit
                this.status |= sci3Flags.status.TRANSMIT_EMPTY
                this.status |= sci3Flags.status.TRANSMIT_END

                parentPort!.postMessage({
                    type: 'tcp-transmit',
                    data: transmitValue
                })
            }
        }

        if (this.control & sci3Flags.control.RECEIVE_ENABLE) {
            if (~this.status & sci3Flags.status.RECEIVE_FULL) {
                if (this.receiveData.length > 0) {
                    const receiveValue = this.receiveData.shift()!

                    this.receive = receiveValue
                    this.status |= sci3Flags.status.RECEIVE_FULL

                    parentPort!.postMessage({
                        type: 'log',
                        data: `[TCP] Receive: ${(receiveValue ^ 0xAA).toString(16)} with command 0x${this.board.ram.readByte(0xf8ce).toString(16)} at offset 0x${this.board.ram.readByte(0xf7ba).toString(16)} and pc 0x${this.board.cpu.registers.pc.toString(16)}`
                    })
                }
            }
        }
    }

    get control(): number {
        return this.board.ram.readByte(SCI3_CONTROL_ADDR)
    }

    set control(value: number) {
        this.board.ram.writeByte(SCI3_CONTROL_ADDR, value)
    }

    get status(): number {
        return this.board.ram.readByte(SCI3_STATUS_ADDR)
    }

    set status(value: number) {
        this.board.ram.writeByte(SCI3_STATUS_ADDR, value)
    }

    get transmit(): number {
        return this.board.ram.readByte(SCI3_TRANSMIT_ADDR)
    }

    set transmit(value: number) {
        this.board.ram.writeByte(SCI3_TRANSMIT_ADDR, value)
    }

    get receive(): number {
        return this.board.ram.readByte(SCI3_RECEIVE_ADDR)
    }

    set receive(value: number) {
        this.board.ram.writeByte(SCI3_RECEIVE_ADDR, value)
    }
}