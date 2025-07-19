import {readFileSync, writeFileSync} from 'node:fs';
import {Cpu, CPU_CYCLES_PER_SECOND} from "./emulator/cpu/Cpu";
import {Memory} from "./emulator/memory/Memory";
import {EepRom} from "./emulator/eeprom/EepRom";
import {Ssu} from "./emulator/ssu/Ssu";
import {Accelerometer} from "./emulator/accelerometer/Accelerometer";
import sdl from '@kmamal/sdl'
import {PNG} from 'pngjs'
import {Lcd, LCD_BUFFER_SEPARATION, LCD_COLUMN_SIZE, LCD_HEIGHT, LCD_PALETTE, LCD_WIDTH} from "./emulator/lcd/Lcd";
import {EventHandler} from "./utils/EventUtils";
import {AUDIO_RENDER_FREQUENCY} from "./sdl/WalkerAudio";
import {Rtc} from "./emulator/rtc/Rtc";

const ROM_SIZE = 1024 * 64
const EEPROM_SIZE = 1024 * 64
const ACCEL_SIZE = 29
const LCD_SIZE = 128 * 176 / 4

export const TICKS_PER_SECOND = 4

interface AudioProps {
    frequency: number,
    volume: number,
    speed: number
}

export class Walker {

    running: boolean = true
    emulationSpeed: number = 1

    private onRenderLcdHandler: EventHandler<Buffer> = new EventHandler<Buffer>()
    private onRenderAudioHandler: EventHandler<AudioProps> = new EventHandler<AudioProps>()

    private eepromPath: string | null

    private cpu: Cpu
    private ssu: Ssu
    private rom: Memory
    private eeprom: EepRom
    private accelerometer: Accelerometer
    private lcd: Lcd
    private rtc: Rtc

    private lastTime: number = 0


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

        this.rtc = new Rtc(this.rom)

        this.ssu = new Ssu(this.rom)

        this.cpu = new Cpu(this.rom, this.ssu, this.eeprom, this.accelerometer, this.lcd, this.rtc)

        this.running = true;
    }


    async run() {
        const desiredTime = 1000 / (TICKS_PER_SECOND * this.emulationSpeed)
        let videoCycleCount = 0
        let audioCycleCount = 0
        this.lastTime = performance.now()
        while (this.running) {
            const cycles = this.cpu.execute();

            videoCycleCount += cycles
            audioCycleCount += cycles

            if (!this.cpu.flags.I && !this.rtc.initialized) {
                this.rtc.initialize()
            }

            // TODO run continuous audio thread instead of sending packets
            if (audioCycleCount >= CPU_CYCLES_PER_SECOND / (AUDIO_RENDER_FREQUENCY * this.emulationSpeed)) {
                audioCycleCount -= CPU_CYCLES_PER_SECOND / (AUDIO_RENDER_FREQUENCY * this.emulationSpeed)

                this.onRenderAudioHandler.invoke({
                    frequency: this.cpu.timers.W.running ? 31500 / (this.cpu.timers.W.registerA) : 0,
                    volume: this.cpu.timers.W.registerB == this.cpu.timers.W.registerC ? 1.0 : 0.25,
                    speed: this.emulationSpeed
                })
            }

            if (videoCycleCount >= CPU_CYCLES_PER_SECOND / (TICKS_PER_SECOND * this.emulationSpeed)) {
                videoCycleCount -= CPU_CYCLES_PER_SECOND / (TICKS_PER_SECOND * this.emulationSpeed)

                this.rtc.update()

                this.renderLcd()

                const currentTime = performance.now()
                const elapsed = currentTime - this.lastTime
                
                if (elapsed < desiredTime) {
                    await new Promise(resolve => setTimeout(resolve, desiredTime - elapsed))
                } else {
                    await new Promise(resolve => setImmediate(resolve))
                }

                this.lastTime = performance.now()
            }

        }

    }

    addStep() {
        const prevValue = this.cpu.memory.readInt(0xF79C)
        this.cpu.memory.writeInt(0xF79C, prevValue + 1)
    }

    addWatt() {
        const prevValue = this.cpu.memory.readInt(0xF78E)
        this.cpu.memory.writeInt(0xF78E, prevValue + 1)
    }

    addInput(key: number) {
        this.cpu.pushKey(key)
    }

    saveEeprom() {
        if (this.eepromPath != null) {
            writeFileSync(this.eepromPath, this.eeprom.memory.buffer)
        }
    }

    onRenderLcd(action: (buffer: Buffer) => void) {
        this.onRenderLcdHandler.addListener(action)
    }

    onRenderAudio(action: (props: AudioProps) => void) {
        this.onRenderAudioHandler.addListener(action)
    }

    private renderLcd() {
        const buffer = Buffer.alloc(LCD_WIDTH * LCD_HEIGHT * 3)

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

                const baseOffset = (y * LCD_WIDTH + x) * 3

                buffer[baseOffset] = (color >> 16) & 0xFF
                buffer[baseOffset + 1] = (color >> 8) & 0xFF
                buffer[baseOffset + 2] = (color >> 0) & 0xFF
            }
        }

        this.lcd.bufferIndex = this.lcd.bufferIndex ? 0 : 1

        this.onRenderLcdHandler.invoke(buffer)
    }
}