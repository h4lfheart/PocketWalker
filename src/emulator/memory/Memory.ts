export class Memory {
    buffer: Uint8Array

    private writeHandlers: Map<number, (value: number) => void> = new Map()
    private readHandlers: Map<number, (value: number) => void> = new Map()

    constructor(buffer: Uint8Array) {
        this.buffer = buffer
    }

    onWrite(addr: number, action: (value: number) => void) {
        this.writeHandlers.set(addr, action)
    }

    onRead(addr: number, action: (value: number) => void) {
        this.readHandlers.set(addr, action)
    }

    readByte(address: number): number {
        address &= 0xFFFF
        const value = this.buffer[address]
        this.readHandlers.get(address)?.(value)
        return value
    }

    writeByte(address: number, value: number) {
        address &= 0xFFFF
        this.writeHandlers.get(address)?.(value)
        this.buffer[address] = value
    }

    readShort(address: number): number {
        address &= 0xFFFF
        const value = (this.buffer[address] << 8) | this.buffer[address + 1]
        this.readHandlers.get(address)?.(value)
        return value
    }

    writeShort(address: number, value: number) {
        address &= 0xFFFF
        this.writeHandlers.get(address)?.(value)
        this.buffer[address] = (value >> 8) & 0xFF
        this.buffer[address + 1] = value & 0xFF
    }

    readInt(address: number): number {
        address &= 0xFFFF
        const value = (this.buffer[address] << 24) | (this.buffer[address + 1] << 16) | (this.buffer[address + 2] << 8) | this.buffer[address + 3]
        this.readHandlers.get(address)?.(value)
        return value
    }

    writeInt(address: number, value: number) {
        address &= 0xFFFF
        this.writeHandlers.get(address)?.(value)
        this.buffer[address] = (value >> 24) & 0xFF
        this.buffer[address + 1] = (value >> 16) & 0xFF
        this.buffer[address + 2] = (value >> 8) & 0xFF
        this.buffer[address + 3] = value & 0xFF
    }
}