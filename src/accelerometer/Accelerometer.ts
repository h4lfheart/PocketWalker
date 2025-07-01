import {Memory} from "../memory/Memory";

export class Accelerometer {
    memory: Memory
    state: AccelerometerState = AccelerometerState.Waiting

    address: number = 0
    offset: number = 0

    constructor(memory: Memory) {
        this.memory = memory;

        this.memory.writeByte(0x0, 0x2)
    }
}

export enum AccelerometerState {
    Waiting,
    TransferringBytes
}