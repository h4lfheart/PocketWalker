export class Memory {
    buffer: Uint8Array

    private writeHandlers: Map<number, (value: number) => void> = new Map()
    private readHandlers: Map<number, (value: number) => void> = new Map()

    static fromBuffer(buffer: Uint8Array) {
        return new Memory(buffer)
    }

    static fromSize(size: number) {
        const buffer = new Uint8Array(size)
        return new Memory(buffer)
    }

    constructor(buffer: Uint8Array) {
        this.buffer = buffer
    }

    onWrite(addr: number, action: (value: number) => void) {
        this.writeHandlers.set(addr, action)
    }

    onRead(addr: number, action: (value: number) => void) {
        this.readHandlers.set(addr, action)
    }

    readByte(address: number, silent: boolean = false): number {
        address &= 0xFFFF
        const value = this.buffer[address]
        if (!silent)
            this.readHandlers.get(address)?.(value)
        return value
    }

    writeByte(address: number, value: number, silent: boolean = false) {
        address &= 0xFFFF
        if (!silent)
            this.writeHandlers.get(address)?.(value)
        this.buffer[address] = value
    }

    readShort(address: number, silent: boolean = false): number {
        address &= 0xFFFF
        const value = (this.buffer[address] << 8) | this.buffer[address + 1]
        if (!silent)
            this.readHandlers.get(address)?.(value)
        return value
    }

    writeShort(address: number, value: number, silent: boolean = false) {
        address &= 0xFFFF
        if (!silent)
            this.writeHandlers.get(address)?.(value)
        this.buffer[address] = (value >> 8) & 0xFF
        this.buffer[address + 1] = value & 0xFF
    }

    readInt(address: number, silent: boolean = false): number {
        address &= 0xFFFF
        const value = (this.buffer[address] << 24) | (this.buffer[address + 1] << 16) | (this.buffer[address + 2] << 8) | this.buffer[address + 3]
        if (!silent)
            this.readHandlers.get(address)?.(value)
        return value
    }

    writeInt(address: number, value: number, silent: boolean = false) {
        address &= 0xFFFF
        if (!silent)
            this.writeHandlers.get(address)?.(value)
        this.buffer[address] = (value >> 24) & 0xFF
        this.buffer[address + 1] = (value >> 16) & 0xFF
        this.buffer[address + 2] = (value >> 8) & 0xFF
        this.buffer[address + 3] = value & 0xFF
    }
}