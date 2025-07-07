import {toUnsignedByte, toUnsignedInt, toUnsignedShort} from "../../utils/BitUtils";
import {Memory} from "../memory/Memory";

export class Registers {
    memory: Memory

    pc: number = 0

    private readonly buffer: ArrayBuffer;
    private readonly uint32View: Uint32Array;
    private readonly uint16View: Uint16Array;
    private readonly uint8View: Uint8Array;

    constructor(memory: Memory) {
        this.memory = memory
        this.buffer = new ArrayBuffer(8 * 4);

        this.uint32View = new Uint32Array(this.buffer);
        this.uint16View = new Uint16Array(this.buffer);
        this.uint8View = new Uint8Array(this.buffer);

        this.uint32View.fill(0);
    }

    get sp(): number {
        return this.uint32View[7]
    }

    set sp(value: number) {
        this.uint32View[7] = value
    }

    pushStack(pc: number) {
        this.sp -= 2
        this.memory.writeShort(this.sp, pc)
    }

    popStack(): number {
        const pc = this.memory.readShort(this.sp)
        this.sp += 2
        return pc
    }

    getDisplay8(control: number): string {
        const regIndex = control & 0b0111;
        const isLow = (control >> 3) & 1;

        return isLow ? `RL${regIndex}` : `RH${regIndex}`
    }

    getDisplay16(control: number): string {
        const regIndex = control & 0b0111;
        const isE = (control >> 3) & 1;

        return isE ? `E${regIndex}` : `R${regIndex}`
    }

    getDisplay32(control: number): string {
        const regIndex = control & 0b0111;

        return `ER${regIndex}`
    }

    getRegister8(control: number): number {
        const regIndex = control & 0b0111;
        const isLow = (control >> 3) & 1;
        const byteIndex = regIndex * 4 + (isLow ? 0 : 1);  // Fixed: *4 for 32-bit spacing

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
        const isLow = (control >> 3) & 1;
        const byteIndex = regIndex * 4 + (isLow ? 0 : 1);
        this.uint8View[byteIndex] = toUnsignedByte(value);
    }

    setRegister16(control: number, value: number) {
        const regIndex = control & 0b0111;
        const isE = (control >> 3) & 1;
        const uint16Index = regIndex * 2 + (isE ? 1 : 0);
        this.uint16View[uint16Index] = toUnsignedShort(value);
    }

    setRegister32(control: number, value: number) {
        const regIndex = control & 0b0111;
        this.uint32View[regIndex] = toUnsignedInt(value);
    }

}