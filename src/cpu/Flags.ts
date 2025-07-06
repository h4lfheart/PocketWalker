export class Flags {
    I: boolean = false
    UI: boolean = false
    H: boolean = false
    U: boolean = false
    N: boolean = false
    Z: boolean = false
    V: boolean = false
    C: boolean = false

    constructor(I: boolean = false,
                U: boolean = false,
                H: boolean = false,
                UI: boolean = false,
                N: boolean = false,
                Z: boolean = false,
                V: boolean = false,
                C: boolean = false) {
        this.I = I
        this.U = U
        this.H = H
        this.UI = UI
        this.N = N
        this.Z = Z
        this.V = V
        this.C = C
    }

    get ccr(): number {
        return (Number(this.I) << 7)
            | (Number(this.UI) << 6)
            | (Number(this.H) << 5)
            | (Number(this.U) << 4)
            | (Number(this.N) << 3)
            | (Number(this.Z) << 2)
            | (Number(this.V) << 1)
            | (Number(this.C) << 0)
    }

    set ccr(value: number) {
        this.C = Boolean(value & (1 << 0))
        this.V = Boolean(value & (1 << 1))
        this.Z = Boolean(value & (1 << 2))
        this.N = Boolean(value & (1 << 3))
        this.U = Boolean(value & (1 << 4))
        this.H = Boolean(value & (1 << 5))
        this.UI = Boolean(value & (1 << 6))
        this.I = Boolean(value & (1 << 7))
    }


    copy(): Flags {
        return new Flags(this.I, this.U, this.H, this.UI, this.N, this.Z, this.V, this.C)
    }
}