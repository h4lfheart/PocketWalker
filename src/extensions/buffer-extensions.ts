export function fillRepeating(buffer: Buffer, value: number, bytes: number) {

    const pattern = Buffer.alloc(bytes);
    for (let i = 0; i < bytes; i++) {
        pattern[i] = (value >> (8 * (bytes - i - 1))) & 0xFF;
    }

    const len = buffer.length;
    for (let i = 0; i < len; i += bytes) {
        pattern.copy(buffer, i, 0, Math.min(bytes, len - i));
    }
}