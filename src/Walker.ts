import { readFileSync } from 'node:fs';
import {Cpu, CPU_CYCLES_PER_SECOND, KEY_CIRCLE, KEY_LEFT, KEY_RIGHT} from "./cpu/Cpu";
import {Memory} from "./memory/Memory";
import {EepRom} from "./eeprom/EepRom";
import {Ssu} from "./ssu/Ssu";
import {Accelerometer} from "./accelerometer/Accelerometer";
import sdl from '@kmamal/sdl'
import {Lcd, LCD_COLUMN_SIZE, LCD_HEIGHT, LCD_PALETTE, LCD_WIDTH} from "./lcd/Lcd";

const ROM_SIZE = 1024 * 64
const EEPROM_SIZE = 1024 * 64
const ACCEL_SIZE = 29
const LCD_SIZE = 128 * 176 / 4

export const TICKS_PER_SECOND = 4

export class Walker {

    running: boolean = true

    cpu: Cpu
    ssu: Ssu
    rom: Memory
    eeprom: EepRom
    accelerometer: Accelerometer
    lcd: Lcd

    lastTime: number = 0

    constructor(romPath: string, eepromPath: string | null = null) {

        const romBuffer = new Uint8Array(ROM_SIZE)
        readFileSync(romPath).copy(romBuffer)
        this.rom = new Memory(romBuffer)

        const eepromBuffer = new Uint8Array(EEPROM_SIZE);
        if (eepromPath != null) readFileSync(eepromPath).copy(eepromBuffer)
        else eepromBuffer.fill(0xFF)
        this.eeprom = new EepRom(new Memory(eepromBuffer))

        const accelBuffer = new Uint8Array(ACCEL_SIZE);
        accelBuffer.fill(0x0)
        this.accelerometer = new Accelerometer(new Memory(accelBuffer))

        const lcdBuffer = new Uint8Array(LCD_SIZE)
        lcdBuffer.fill(0x0)
        this.lcd = new Lcd((new Memory(lcdBuffer)))

        this.ssu = new Ssu(this.rom)

        this.cpu = new Cpu(this.rom, this.ssu, this.eeprom, this.accelerometer, this.lcd)

        this.running = true;
    }


    async run() {
        // TODO properly separate emulator and window thread
        const window = sdl.video.createWindow({ title: "PocketWalker", height: LCD_HEIGHT * 8, width: LCD_WIDTH * 8, resizable: false })

        window.on("keyDown", (args: any) => {
            switch (args.key) {
                case "left":
                    this.cpu.pushKey(KEY_LEFT)
                    break
                case "right":
                    this.cpu.pushKey(KEY_RIGHT)
                    break
                case "down":
                    this.cpu.pushKey(KEY_CIRCLE)
                    break
            }
        })

        while (this.running) {
            this.cpu.execute()

            if (this.cpu.cycleCount >= CPU_CYCLES_PER_SECOND / TICKS_PER_SECOND) {
                this.cpu.cycleCount -= CPU_CYCLES_PER_SECOND / TICKS_PER_SECOND

                this.cpu.interrupts.rtcInterrupt()
                this.renderWindow(window)

                const desiredTime = 1000 / TICKS_PER_SECOND

                const elapsed = performance.now() - this.lastTime
                if (elapsed < desiredTime) {
                    await new Promise(resolve => setTimeout(resolve, desiredTime - elapsed))
                } else {
                    await new Promise(resolve => setImmediate(resolve))
                }

                this.lastTime = performance.now()
            }

        }

    }

    renderWindow(window: sdl.Sdl.Video.Window) {
        const buffer = Buffer.alloc(LCD_WIDTH * LCD_HEIGHT * 3)
        for (let y = 0; y < LCD_HEIGHT; y++) {
           const stripeOffset = y % 8
           const row = Math.floor(y / 8)
           const rowOffset = row * LCD_WIDTH * LCD_COLUMN_SIZE

           for (let x = 0; x < LCD_WIDTH; x++) {
               const baseIndex = 2 * x + rowOffset

               const firstBit = (this.lcd.memory.readByte(baseIndex) >> stripeOffset) & 1
               const secondBit = (this.lcd.memory.readByte(baseIndex + 1) >> stripeOffset) & 1

               const paletteIndex = (firstBit << 1) | secondBit
               const color = LCD_PALETTE[paletteIndex]

               const baseOffset = (y * LCD_WIDTH + x) * 3
               buffer[baseOffset] = (color >> 16) & 0xFF
               buffer[baseOffset + 1] = (color >> 8) & 0xFF
               buffer[baseOffset + 2] = (color >> 0) & 0xFF

           }
       }

        window.render(LCD_WIDTH, LCD_HEIGHT, 3 * LCD_WIDTH, 'rgb24', buffer)
    }


}