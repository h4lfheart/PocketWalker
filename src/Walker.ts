import { readFileSync } from 'fs';
import {Cpu} from "./cpu/Cpu";
import {Memory} from "./memory/Memory";

const ROM_SIZE = 1024 * 64
const EEPROM_SIZE = 1024 * 64
const ENTRY_PC = 0x02C4

export class Walker {

    running: boolean = true

    cpu: Cpu
    rom: Memory
    eeprom: Memory

    constructor(romPath: string) {

        const romBuffer = new Uint8Array(ROM_SIZE)
        readFileSync(romPath).copy(romBuffer)
        this.rom = new Memory(romBuffer)

        const eepromBuffer = new Uint8Array(EEPROM_SIZE);
        eepromBuffer.fill(0xFF)
        this.eeprom = new Memory(eepromBuffer)

        this.cpu = new Cpu(this.rom)

        this.cpu.registers.pc = ENTRY_PC
        this.running = true;
    }


    run() {
        while (this.running) {
            this.cpu.execute()
        }
    }
}