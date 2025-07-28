import {Board, CPU_TICKS, VISUAL_TICKS} from "./board/board.ts"
import {Cpu} from "./cpu/cpu.ts"
import {readFileSync} from "fs"
import Path from "node:path";
import {existsSync, writeFileSync} from "node:fs";
import {parentPort} from "node:worker_threads";

export class PocketWalker {
    board: Board

    running: boolean = true
    cycles: number = 0

    private readonly eepromPath?: string

    constructor(romPath: string, eepromPath?: string) {
        this.eepromPath = eepromPath

        const ramBuffer = new Uint8Array(0xFFFF)
        readFileSync(romPath).copy(ramBuffer)

        const eepromBuffer = new Uint8Array(0xFFFF)
        if (eepromPath && existsSync(eepromPath)) {
            readFileSync(eepromPath).copy(eepromBuffer)
        }

        this.board = new Board(ramBuffer, eepromBuffer)
    }

    async run() {
        const targetFPS = 256;
        const frameTime = 1000 / targetFPS;
        const cyclesPerFrame = Math.trunc(CPU_TICKS / targetFPS);

        let nextFrameTime = performance.now();

        while (this.running) {
            const frameStartCycles = this.cycles;

            while (this.cycles - frameStartCycles < cyclesPerFrame) {
                const cpuCycles = this.board.cpu.step();
                for (let i = 0; i < cpuCycles; i++) {
                    this.cycles++;
                    this.board.tick(this.cycles);
                }
            }

            nextFrameTime += frameTime;
            const now = performance.now();
            const sleepTime = nextFrameTime - now;

            if (sleepTime > 0) {
                await new Promise(resolve => setTimeout(resolve, sleepTime));
            }
        }
    }

    save() {
        if (this.eepromPath) {
            writeFileSync(this.eepromPath, this.board.eeprom.memory.buffer)
            parentPort!.postMessage({
                type: 'log',
                data: `Saved eeprom to ${this.eepromPath}`
            })
        }
    }

    pushKey(key: number) {
        this.board.ssu.pushKey(key)
    }
}