import { readFileSync } from 'node:fs';
import {Cpu, CPU_CYCLES_PER_SECOND} from "./cpu/Cpu";
import {Memory} from "./memory/Memory";
import {EepRom} from "./eeprom/EepRom";
import {Ssu} from "./ssu/Ssu";
import {Accelerometer} from "./accelerometer/Accelerometer";
import sdl from '@kmamal/sdl'
import {Lcd, LCD_BUFFER_SEPARATION, LCD_COLUMN_SIZE, LCD_HEIGHT, LCD_PALETTE, LCD_WIDTH} from "./lcd/Lcd";

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


    run() {
        // TODO separate sdl thread and emulator thread
        const window = sdl.video.createWindow({ title: "PocketWalker", height: LCD_HEIGHT * 8, width: LCD_WIDTH * 8, resizable: false })

        while (this.running) {
            this.cpu.execute()

            // TODO clean this up and optimize
            if (this.cpu.cycleCount >= CPU_CYCLES_PER_SECOND / TICKS_PER_SECOND) {
                this.cpu.cycleCount -= CPU_CYCLES_PER_SECOND / TICKS_PER_SECOND

                this.cpu.interrupts.rtcInterrupt()

                this.renderWindow(window)
            }
        }
    }

    renderWindow(window: sdl.Sdl.Video.Window) {
        const buffer = Buffer.alloc(LCD_WIDTH * LCD_HEIGHT * 3)
        for (let y = 0; y < LCD_HEIGHT; y++) {
            const stripeOffset = y % 8
            const row = Math.floor(y / 8)  // Fix: Use Math.floor for integer division
            const rowOffset = row * LCD_WIDTH * LCD_COLUMN_SIZE  // Make sure LCD_COLUMN_SIZE = 2
            const bufferOffset = this.lcd.bufferIndex * LCD_WIDTH * LCD_BUFFER_SEPARATION

            for (let x = 0; x < LCD_WIDTH; x++) {
                const baseIndex = 2 * x + bufferOffset + rowOffset

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

        this.lcd.bufferIndex = this.lcd.bufferIndex ? 0 : 1  // Fix: Match C logic

        window.render(LCD_WIDTH, LCD_HEIGHT, 3 * LCD_WIDTH, 'rgb24', buffer)
    }


}