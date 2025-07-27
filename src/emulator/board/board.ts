import {Cpu} from "../cpu/cpu.ts"
import {Memory} from "../memory/memory.ts"
import {Ssu, ssuFlags} from "../ssu/ssu.ts"
import {Accelerometer, accelerometerState} from "../peripherals/accelerometer/accelerometer.ts"
import {EepRom, eepromState} from "../peripherals/eeprom/eeprom.ts";
import {Lcd} from "../peripherals/lcd/lcd.ts";
import {Timers} from "../timer/timers.ts";
import {Rtc} from "../rtc/rtc.ts";
import {parentPort} from "node:worker_threads";
import {Sci3} from "../ir/sci3.ts";

// per second
export const CPU_TICKS = 3686400
export const VISUAL_TICKS = 4
export const AUDIO_TICKS = 256
export const CLOCK_TICKS = 32768
export const SCI3_TICKS = 32768 * 2

export class Board {
    ram: Memory
    cpu: Cpu
    ssu: Ssu
    timers: Timers
    rtc: Rtc
    sci3: Sci3

    accelerometer: Accelerometer
    eeprom: EepRom
    lcd: Lcd

    constructor(ramData: Uint8Array, eepromData: Uint8Array) {
        this.ram = new Memory(ramData)
        this.cpu = new Cpu(this)
        this.ssu = new Ssu(this)
        this.timers = new Timers(this)
        this.rtc = new Rtc(this)
        this.sci3 = new Sci3(this)

        this.accelerometer = new Accelerometer(this)
        this.eeprom = new EepRom(this, new Memory(eepromData))
        this.lcd = new Lcd(this)
    }

    tick(cycles: number) {
        if (cycles % this.ssu.clockRate == 0) {
            this.ssu.tick()
        }

        if (cycles % Math.trunc(CPU_TICKS / CLOCK_TICKS) == 0) {
            this.timers.tick()
        }

        if (cycles % Math.trunc(CPU_TICKS / SCI3_TICKS) == 0) {
            this.sci3.tick()
        }

        if (cycles % Math.trunc(CPU_TICKS / AUDIO_TICKS) == 0) {
            parentPort!.postMessage({
                type: 'audio',
                data: {
                    frequency: this.timers.w.running ? 31500 / this.timers.w.registerA : 0,
                    volume: this.timers.w.registerB == this.timers.w.registerC ? 1.0 : 0.25,
                }
            })
        }

        if (cycles % Math.trunc(CPU_TICKS / VISUAL_TICKS) == 0) {
            this.lcd.tick()
            this.rtc.tick()
        }

    }
}