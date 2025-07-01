import {Memory} from "../memory/Memory";

export class EepRom {
    memory: Memory
    state: EepRomState = EepRomState.None

    constructor(memory: Memory) {
        this.memory = memory
    }


}

export enum EepRomState {
    None,
    StatusRegister,
    AddressHigh,
    AddressLow,
    Bytes
}