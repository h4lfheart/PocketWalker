import {readFileSync, writeFileSync} from 'node:fs';
import {Cpu, CPU_CYCLES_PER_SECOND, KEY_CIRCLE, KEY_LEFT, KEY_RIGHT} from "./emulator/cpu/Cpu";
import {Memory} from "./emulator/memory/Memory";
import {EepRom} from "./emulator/eeprom/EepRom";
import {Ssu} from "./emulator/ssu/Ssu";
import {Accelerometer} from "./emulator/accelerometer/Accelerometer";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import sdl from '@kmamal/sdl'
import {PNG} from 'pngjs'
import {Lcd, LCD_BUFFER_SEPARATION, LCD_COLOR_3, LCD_COLUMN_SIZE, LCD_HEIGHT, LCD_PALETTE, LCD_WIDTH} from "./emulator/lcd/Lcd";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROM_SIZE = 1024 * 64
const EEPROM_SIZE = 1024 * 64
const ACCEL_SIZE = 29
const LCD_SIZE = 128 * 176 / 4

export const TICKS_PER_SECOND = 4

const MARGIN_SIZE = 4
const LCD_SCALAR = 8

export class Walker {
    eepromPath: string | null


    running: boolean = true

    cpu: Cpu
    ssu: Ssu
    rom: Memory
    eeprom: EepRom
    accelerometer: Accelerometer
    lcd: Lcd

    lastTime: number = 0

    constructor(romPath: string, eepromPath: string | null = null) {

        this.eepromPath = eepromPath

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

        let tickMultiplier = 1
        const windowWidth = (LCD_WIDTH + MARGIN_SIZE * 2) * LCD_SCALAR
        const windowHeight = (LCD_HEIGHT + MARGIN_SIZE * 2) * LCD_SCALAR
        const window = sdl.video.createWindow({
            title: "Pocket-Walker",
            height: windowHeight,
            width: windowWidth,
            resizable: false
        })
        window.setIcon(30, 30, 30 * 4, 'rgba32', PNG.sync.read(readFileSync(resolve(__dirname, '..', 'assets', 'logo.png'))).data)

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
                case "tab":
                    tickMultiplier = 4
                    break
            }
        })

        window.on("keyUp", (args: any) => {
            switch (args.key) {
                case "tab":
                    tickMultiplier = 1
                    break
            }
        })

        window.on("close", () => {
            if (this.eepromPath != null) {
                writeFileSync(this.eepromPath, this.eeprom.memory.buffer)
            }

            this.running = false
        })

        const sampleRate = 44100
        const playbackInstance = sdl.audio.openDevice({ type: 'playback' }, {channels: 1, frequency: sampleRate, format: 's16sys'})
        playbackInstance.play()

        let currentPhase = 0;
        let audioRenderFreq = 256

        while (this.running) {
            this.cpu.execute();


            if (this.cpu.cycleCount % (CPU_CYCLES_PER_SECOND / (audioRenderFreq)) == 0) {
                // TODO there's gotta be a better way to do this (volume level option)
                let amplitude = 16383
                if (this.cpu.timers.W.registerB != this.cpu.timers.W.registerC)
                    amplitude *= 0.25


                const sampleCount = Math.ceil(sampleRate / audioRenderFreq)
                const buf = Buffer.alloc(sampleCount * 2)
                const freq = this.cpu.timers.W.running ? 31500 / (this.cpu.timers.W.registerA) : 0
                if (freq > 100 && isFinite(freq)) {
                    const samplesPerCycle = sampleRate / freq;
                    const onSamples = samplesPerCycle * 0.5;
                    const numSamples = buf.length / 2;

                    for (let i = 0; i < numSamples; i++) {
                        const cyclePosition = (currentPhase + i) % samplesPerCycle;
                        const sample = cyclePosition < onSamples ? amplitude : -amplitude;
                        buf.writeInt16LE(sample, i * 2);
                    }

                    currentPhase = (currentPhase + numSamples) % samplesPerCycle;
                }


                playbackInstance.enqueue(buf)

            }

            if (this.cpu.cycleCount >= CPU_CYCLES_PER_SECOND / (TICKS_PER_SECOND * tickMultiplier)) {
                this.cpu.cycleCount -= CPU_CYCLES_PER_SECOND / (TICKS_PER_SECOND * tickMultiplier)

                this.cpu.interrupts.rtcInterrupt()
                this.renderWindow(window)

                const desiredTime = 1000 / (TICKS_PER_SECOND * tickMultiplier)

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
        const windowWidth = LCD_WIDTH + MARGIN_SIZE * 2
        const windowHeight = LCD_HEIGHT + MARGIN_SIZE * 2
        const buffer = Buffer.alloc(windowWidth * windowHeight * 3)

        for (let i = 0; i < buffer.length; i += 3) {
            buffer[i] = (LCD_PALETTE[0] >> 16) & 0xFF
            buffer[i + 1] = (LCD_PALETTE[0] >> 8) & 0xFF
            buffer[i + 2] = (LCD_PALETTE[0] >> 0) & 0xFF
        }

        for (let y = 0; y < LCD_HEIGHT; y++) {
            const stripeOffset = y % 8
            const row = Math.floor(y / 8)
            const rowOffset = row * LCD_WIDTH * LCD_COLUMN_SIZE
            const bufferOffset = this.lcd.bufferIndex * LCD_WIDTH * LCD_BUFFER_SEPARATION

            for (let x = 0; x < LCD_WIDTH; x++) {
                const baseIndex = 2 * x + rowOffset + bufferOffset

                const firstBit = (this.lcd.memory.readByte(baseIndex) >> stripeOffset) & 1
                const secondBit = (this.lcd.memory.readByte(baseIndex + 1) >> stripeOffset) & 1

                const paletteIndex = (firstBit << 1) | secondBit
                const color = LCD_PALETTE[paletteIndex]

                const windowX = x + MARGIN_SIZE
                const windowY = y + MARGIN_SIZE
                const baseOffset = (windowY * windowWidth + windowX) * 3

                buffer[baseOffset] = (color >> 16) & 0xFF
                buffer[baseOffset + 1] = (color >> 8) & 0xFF
                buffer[baseOffset + 2] = (color >> 0) & 0xFF
            }
        }

        this.lcd.bufferIndex = this.lcd.bufferIndex ? 0 : 1

        window.render(windowWidth, windowHeight, 3 * windowWidth, 'rgb24', buffer)
    }
}