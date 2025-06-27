import {Flags} from "./Flags";

export class Registers {
    flags: Flags = {
        I: false,
        U: false,
        H: false,
        N: false,
        Z: false,
        V: false,
        C: false
    }

    // 32 bit
    ER: number[] = [0, 0, 0, 0, 0, 0, 0, 0]

    // 16 bit
    R: number[] = [0, 0, 0, 0, 0, 0, 0, 0]
    E: number[] = [0, 0, 0, 0, 0, 0, 0, 0]

    // 8 bit
    RL: number[] = [0, 0, 0, 0, 0, 0, 0, 0]
    RH: number[] = [0, 0, 0, 0, 0, 0, 0, 0]

    pc: number = 0
    sp: number = 0

    stack: number[] = [0, 0, 0, 0, 0, 0, 0, 0]

    pushStack() {
        this.stack.push(this.pc)
    }

    popStack(): number {
        return this.stack.pop()
    }

    getRegister8(control: number): number {
        const regIndex = control & 0b0111
        const target = control & 0b1000 ? this.RL : this.RH;
        return target[regIndex]
    }

    getRegister16(control: number): number {
        const regIndex = control & 0b0111
        const target = control & 0b1000 ? this.E : this.R;
        return target[regIndex]
    }

    getRegister32(control: number): number {
        const regIndex = control & 0b0111
        return this.ER[regIndex]
    }

    setRegister8(control: number, value: number) {
        const regIndex = control & 0b0111
        const target = control & 0b1000 ? this.RL : this.RH;
        target[regIndex] = value
    }

    setRegister16(control: number,value: number) {
        const regIndex = control & 0b0111
        const target = control & 0b1000 ? this.E : this.R;
        target[regIndex] = value
    }

    setRegister32(control: number, value: number) {
        const regIndex = control & 0b0111
        this.ER[regIndex] = value
    }

}