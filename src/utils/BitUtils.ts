export function toSignedByte(n: number): number {
    return (n & 0xFF) << 24 >> 24;
}

export function toSignedShort(n: number): number {
    return (n & 0xFFFF) << 16 >> 16;
}

export function toSignedInt(n: number): number {
    return n | 0
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

export function decimalToHex(n: number) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return tens * 16 + ones;
}