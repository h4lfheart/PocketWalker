import { readFileSync } from 'node:fs';
import {Cpu} from "./cpu/Cpu";
import {Memory} from "./memory/Memory";
import {EepRom} from "./eeprom/EepRom";
import {Ssu} from "./ssu/Ssu";
import {Accelerometer} from "./accelerometer/Accelerometer";

const ROM_SIZE = 1024 * 64
const EEPROM_SIZE = 1024 * 64
const ACCEL_SIZE = 29

export class Walker {

    running: boolean = true

    cpu: Cpu
    ssu: Ssu
    rom: Memory
    eeprom: EepRom
    accelerometer: Accelerometer

    constructor(romPath: string) {

        const romBuffer = new Uint8Array(ROM_SIZE)
        readFileSync(romPath).copy(romBuffer)
        this.rom = new Memory(romBuffer)

        const eepromBuffer = new Uint8Array(EEPROM_SIZE);
        eepromBuffer.fill(0xFF)
        this.eeprom = new EepRom(new Memory(eepromBuffer))

        const accelBuffer = new Uint8Array(ACCEL_SIZE);
        accelBuffer.fill(0x0)
        this.accelerometer = new Accelerometer(new Memory(accelBuffer))

        this.ssu = new Ssu(this.rom)

        this.cpu = new Cpu(this.rom, this.ssu, this.eeprom, this.accelerometer)

        this.running = true;
    }


    async run() {
        while (this.running) {
            this.cpu.execute()
        }
    }
}