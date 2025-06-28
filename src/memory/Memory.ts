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

    readShort(address: number): number {
        return (this.memory[address] << 8) | this.memory[address + 1];
    }

    writeShort(address: number, value: number) {
        this.memory[address] = value >> 8
        this.memory[address] = value & 0xFF
    }
}