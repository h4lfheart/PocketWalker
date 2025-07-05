export class Memory {
    private memory: Uint8Array;

    constructor(buffer: Uint8Array) {
        this.memory = buffer
    }

    readByte(address: number): number {
        address &= 0xFFFF
        return this.memory[address]
    }

    writeByte(address: number, value: number) {
        address &= 0xFFFF
        this.memory[address] = value
    }

    readShort(address: number): number {
        address &= 0xFFFF
        return (this.memory[address] << 8) | this.memory[address + 1]
    }

    writeShort(address: number, value: number) {
        address &= 0xFFFF
        this.memory[address] = (value >> 8) & 0xFF
        this.memory[address + 1] = value & 0xFF
    }

    readInt(address: number): number {
        address &= 0xFFFF
        return (this.memory[address] << 24) | (this.memory[address + 1] << 16) | (this.memory[address + 2] << 8) | this.memory[address + 3]
    }

    writeInt(address: number, value: number) {
        address &= 0xFFFF
        this.memory[address] = (value >> 24) & 0xFF
        this.memory[address + 1] = (value >> 16) & 0xFF
        this.memory[address + 2] = (value >> 8) & 0xFF
        this.memory[address + 3] = value & 0xFF
    }
}