export class Memory {
    buffer: Uint8Array;

    constructor(buffer: Uint8Array) {
        this.buffer = buffer
    }

    readByte(address: number): number {
        address &= 0xFFFF
        return this.buffer[address]
    }

    writeByte(address: number, value: number) {
        address &= 0xFFFF
        this.buffer[address] = value
    }

    readShort(address: number): number {
        address &= 0xFFFF
        return (this.buffer[address] << 8) | this.buffer[address + 1]
    }

    writeShort(address: number, value: number) {
        address &= 0xFFFF
        this.buffer[address] = (value >> 8) & 0xFF
        this.buffer[address + 1] = value & 0xFF
    }

    readInt(address: number): number {
        address &= 0xFFFF
        return (this.buffer[address] << 24) | (this.buffer[address + 1] << 16) | (this.buffer[address + 2] << 8) | this.buffer[address + 3]
    }

    writeInt(address: number, value: number) {
        address &= 0xFFFF
        this.buffer[address] = (value >> 24) & 0xFF
        this.buffer[address + 1] = (value >> 16) & 0xFF
        this.buffer[address + 2] = (value >> 8) & 0xFF
        this.buffer[address + 3] = value & 0xFF
    }
}