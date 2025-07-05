export class Flags {
    I: boolean = false
    U: boolean = false
    H: boolean = false
    UI: boolean = false
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


    copy(): Flags {
        return new Flags(this.I, this.U, this.H, this.UI, this.N, this.Z, this.V, this.C)
    }
}