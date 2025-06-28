export function toSignedByte(n: number): number {
    return (n & 0xFF) << 24 >> 24;
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