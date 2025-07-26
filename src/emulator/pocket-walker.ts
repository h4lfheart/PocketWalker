import {Board, CPU_TICKS, VISUAL_TICKS} from "./board/board.ts"
import {Cpu} from "./cpu/cpu.ts"
import {readFileSync} from "fs"

export class PocketWalker {
    board: Board

    running: boolean = true
    cycles: number = 0
    lastPerformanceTime: number = 0

    constructor(romPath: string, eepromPath?: string) {

        const ramBuffer = new Uint8Array(0xFFFF)
        readFileSync(romPath).copy(ramBuffer)

        const eepromBuffer = new Uint8Array(0xFFFF)
        if (eepromPath) {
            readFileSync(eepromPath).copy(eepromBuffer)
        }

        this.board = new Board(ramBuffer, eepromBuffer)
    }

    async run() {
        const desiredTime = 1000 / 8
        while (this.running) {
            const cycles = this.board.cpu.step()

            for (let cycleIndex = 0; cycleIndex < cycles; cycleIndex++) {
                this.cycles++

                this.board.tick(this.cycles)

                if (this.cycles % Math.trunc(CPU_TICKS / 8) == 0) {
                    const currentTime = performance.now()
                    const elapsed = currentTime - this.lastPerformanceTime

                    if (elapsed < desiredTime) {
                        await new Promise(resolve => setTimeout(resolve, desiredTime - elapsed))
                    } else {
                        await new Promise(resolve => setImmediate(resolve))
                    }

                    this.lastPerformanceTime = performance.now()
                }
            }
        }
    }

    pushKey(key: number) {
        this.board.ssu.pushKey(key)
    }
}