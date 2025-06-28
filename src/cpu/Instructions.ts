export class Instructions {
    ab: number = 0
    cd: number = 0
    ef: number = 0

    a: number = 0
    b: number = 0
    c: number = 0
    d: number = 0
    e: number = 0
    f: number = 0

    aH: number = 0
    aL: number = 0
    bH: number = 0
    bL: number = 0
    cH: number = 0
    cL: number = 0
    dH: number = 0
    dL: number = 0
    eH: number = 0
    eL: number = 0
    fH: number = 0
    fL: number = 0

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