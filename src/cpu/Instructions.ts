import {Memory} from "../memory/Memory";

export class Instructions {
    memory: Memory

    ab: number = 0
    cd: number = 0
    ef: number = 0
    gh: number = 0

    a: number = 0
    b: number = 0
    c: number = 0
    d: number = 0
    e: number = 0
    f: number = 0
    g: number = 0
    h: number = 0

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
    gH: number = 0
    gL: number = 0
    hH: number = 0
    hL: number = 0

    constructor(memory: Memory) {
        this.memory = memory
    }

    loadInstructions(pc: number) {

        const a = this.memory.readByte(pc)
        const b = this.memory.readByte(pc + 1)
        const c = this.memory.readByte(pc + 2)
        const d = this.memory.readByte(pc + 3)
        const e = this.memory.readByte(pc + 4)
        const f = this.memory.readByte(pc + 5)
        const g = this.memory.readByte(pc + 6)
        const h = this.memory.readByte(pc + 7)

        this.a = a
        this.b = b
        this.c = c
        this.d = d
        this.e = e
        this.f = f
        this.g = g
        this.h = h

        this.ab = (a << 8) | b
        this.cd = (c << 8) | d
        this.ef = (e << 8) | f
        this.gh = (g << 8) | h

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


        this.gH = (g >> 4) & 0xF
        this.gL = g & 0xF

        this.hH = (h >> 4) & 0xF
        this.hL = h & 0xF

    }
}