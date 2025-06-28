export class Registers {
    pc: number = 0
    sp: number = -1

    stack: number[] = []

    private readonly buffer: ArrayBuffer;
    private readonly uint32View: Uint32Array;
    private readonly uint16View: Uint16Array;
    private readonly uint8View: Uint8Array;

    constructor() {
        this.buffer = new ArrayBuffer(8 * 4);

        this.uint32View = new Uint32Array(this.buffer);
        this.uint16View = new Uint16Array(this.buffer);
        this.uint8View = new Uint8Array(this.buffer);

        this.uint32View.fill(0);
    }

    pushStack(pc: number) {
        this.stack.push(pc)
        this.sp++
    }

    popStack(): number {
        this.sp--
        return this.stack.pop()!
    }

    getRegister8(control: number): number {
        const regIndex = control & 0b0111;
        const isHigh = (control >> 3) & 1;
        const byteIndex = regIndex * 4 + (isHigh ? 1 : 0);
        return this.uint8View[byteIndex];
    }

    getRegister16(control: number): number {
        const regIndex = control & 0b0111;
        const isE = (control >> 3) & 1;
        const uint16Index = regIndex * 2 + (isE ? 1 : 0);
        return this.uint16View[uint16Index];
    }

    getRegister32(control: number): number {
        const regIndex = control & 0b0111;
        return this.uint32View[regIndex];
    }

    setRegister8(control: number, value: number) {
        const regIndex = control & 0b0111;
        const isHigh = (control >> 3) & 1;
        const byteIndex = regIndex * 4 + (isHigh ? 1 : 0);
        this.uint8View[byteIndex] = value & 0xFF;
    }

    setRegister16(control: number, value: number) {
        const regIndex = control & 0b0111;
        const isE = (control >> 3) & 1;
        const uint16Index = regIndex * 2 + (isE ? 1 : 0);
        this.uint16View[uint16Index] = value & 0xFFFF;
    }

    setRegister32(control: number, value: number) {
        const regIndex = control & 0b0111;
        this.uint32View[regIndex] = value >>> 0;
    }

}