export class Memory {
    private memory: Uint8Array;

    constructor(buffer: Uint8Array) {
        this.memory = buffer
    }

    readByte(address: number): number {
        return this.memory[address];
    }

    writeByte(address: number, value: number) {
        this.memory[address] = value
    }
}