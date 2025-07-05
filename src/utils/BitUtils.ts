export function toSignedByte(n: number): number {
    return (n & 0xFF) << 24 >> 24;
}

export function toSignedShort(n: number): number {
    return (n & 0xFFFF) << 16 >> 16;
}

export function toUnsignedByte(n: number): number {
    return n & 0xFF;
}

export function toUnsignedShort(n: number): number {
    return n & 0xFFFF;
}

export function toUnsignedInt(n: number): number {
    return n >>> 0;
}