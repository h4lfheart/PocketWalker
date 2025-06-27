export class Instructions {
    ab: number
    cd: number
    ef: number

    a: number
    b: number
    c: number
    d: number
    e: number
    f: number

    aH: number
    aL: number
    bH: number
    bL: number
    cH: number
    cL: number
    dH: number
    dL: number
    eH: number
    eL: number
    fH: number
    fL: number

    set(a: number, b: number, c: number, d: number, e: number, f: number) {
        this.a = a
        this.b = b
        this.c = c
        this.d = d
        this.e = e
        this.f = f

        this.ab = (a << 8) | b
        this.cd = (c << 8) | d
        this.ef = (e << 8) | f

        this.aH = (a >> 4) & 0xF
        this.aL = a & 0xF

        this.bH = (b >> 4) & 0xF
        this.bL = b & 0xF

        this.cH = (c >> 4) & 0xF
        this.cL = c & 0xF

        this.dH = (d >> 4) & 0xF
        this.dL = d & 0xF

        this.eH = (e >> 4) & 0xF
        this.eL = e & 0xF

        this.fH = (f >> 4) & 0xF
        this.fL = f & 0xF

    }
}