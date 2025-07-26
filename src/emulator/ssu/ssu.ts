import {Memory} from "../memory/memory.ts"
import {BoardComponent} from "../board/board-component.ts"
import {Board} from "../board/board.ts"
import {accelerometerState} from "../peripherals/accelerometer/accelerometer.ts"
import {eepromCommands, eepromFlags, eepromState} from "../peripherals/eeprom/eeprom.ts";
import {
    LCD_COLUMN_SIZE,
    LCD_GETTING_CONTRAST,
    LCD_HIGH_COLUMN_RANGE,
    LCD_LOW_COLUMN_RANGE,
    LCD_PAGE_RANGE, LCD_WIDTH,
    lcdState
} from "../peripherals/lcd/lcd.ts";
import {interruptFlags} from "../cpu/components/interrupts.ts";

const MODE_ADDR = 0xF0E2
const ENABLE_ADDR = 0xF0E3
const STATUS_ADDR = 0xF0E4
const RECEIVE_ADDR = 0xF0E9
const TRANSMIT_ADDR = 0xF0EB

const PORT_1_ADDR = 0xFFD4
const PORT_3_ADDR = 0xFFD6
const PORT_8_ADDR = 0xFFDB
const PORT_9_ADDR = 0xFFDC
const PORT_B_ADDR = 0xFFDE

export const ssuFlags = {
    enable: {
        TRANSMIT_ENABLED: 1 << 7,
        RECEIVE_ENABLED: 1 << 6
    },
    status: {
        TRANSMIT_END: 1 << 3,
        TRANSMIT_EMPTY: 1 << 2,
        RECEIVE_FULL: 1 << 1
    },
    port1: {
        EEPROM: 1 << 2,
        LCD_DATA: 1 << 1,
        LCD: 1 << 0,
    },
    port9: {
        ACCELEROMETER: 1 << 0
    }
}

export const inputKey = {
    KEY_NONE: 0,
    KEY_CENTER: (1 << 0),
    KEY_LEFT: (1 << 2),
    KEY_RIGHT: (1 << 4)
}

const clockRates: Map<number, number> = new Map<number, number>([
    [0b000, 256],
    [0b001, 128],
    [0b010, 64],
    [0b011, 32],
    [0b100, 16],
    [0b101, 8],
    [0b110, 4],
    [0b111, 2],
])


export class Ssu extends BoardComponent {
    clockRate: number = 4

    progress: number = 0
    
    constructor(board: Board) {
        super(board)

        this.board.ram.onRead(RECEIVE_ADDR, () => {
            this.status &= ~ssuFlags.status.RECEIVE_FULL
        })

        this.board.ram.onWrite(TRANSMIT_ADDR, () => {
            this.status &= ~ssuFlags.status.TRANSMIT_EMPTY
            this.status &= ~ssuFlags.status.TRANSMIT_END
        })

        this.board.ram.onWrite(MODE_ADDR, value => {
            this.clockRate = clockRates.get(value & 0b111) ?? 4
        })

        this.board.ram.onWrite(PORT_1_ADDR, value => {
            if (~value & ssuFlags.port1.EEPROM) {
                this.board.eeprom.state = eepromState.waiting
                this.board.eeprom.offset = 0
            }
        })

        this.board.ram.onWrite(PORT_9_ADDR, value => {
            if (~value & ssuFlags.port9.ACCELEROMETER) {
                this.board.accelerometer.state = accelerometerState.address
                this.board.accelerometer.offset = 0
            }
        })
    }

    override tick() {

        if (~this.enable & ssuFlags.enable.TRANSMIT_ENABLED) {
            this.status |= ssuFlags.status.TRANSMIT_EMPTY
        }

        if (this.enable & ssuFlags.enable.TRANSMIT_ENABLED && this.enable & ssuFlags.enable.RECEIVE_ENABLED) {
            if (~this.status & ssuFlags.status.TRANSMIT_EMPTY) {

                if (~this.port9 & ssuFlags.port9.ACCELEROMETER) {
                    this.board.accelerometer.transmitAndReceive(this)
                }

                if (~this.port1 & ssuFlags.port1.EEPROM) {
                    this.board.eeprom.transmitAndReceive(this)
                }

            }
        } else if (this.enable & ssuFlags.enable.TRANSMIT_ENABLED) {
            if (~this.status & ssuFlags.status.TRANSMIT_EMPTY) {

                if (~this.port9 & ssuFlags.port9.ACCELEROMETER) {
                    this.board.accelerometer.transmit(this)
                }

                if (~this.port1 & ssuFlags.port1.EEPROM) {
                    this.board.eeprom.transmit(this)
                }

                if (this.port1 & ssuFlags.port1.LCD_DATA) {
                    this.board.lcd.transmit(this, 'data')
                } else if (~this.port1 & ssuFlags.port1.LCD) {
                    this.board.lcd.transmit(this)
                }

            }
        }
    }

    pushKey(key: number) {
        if (!this.board.cpu.flags.I && key == inputKey.KEY_CENTER) {
            this.board.cpu.interrupts.flag1 |= interruptFlags.flag1.IRQ0
        }

        this.portB = key
    }

    get enable(): number {
        return this.board.ram.readByte(ENABLE_ADDR)
    }

    set enable(value: number) {
        this.board.ram.writeByte(ENABLE_ADDR, value)
    }

    get status(): number {
        return this.board.ram.readByte(STATUS_ADDR)
    }

    set status(value: number) {
        this.board.ram.writeByte(STATUS_ADDR, value)
    }

    get transmit(): number {
        return this.board.ram.readByte(TRANSMIT_ADDR)
    }

    set transmit(value: number) {
        this.board.ram.writeByte(TRANSMIT_ADDR, value)
    }

    get receive(): number {
        return this.board.ram.readByte(RECEIVE_ADDR)
    }

    set receive(value: number) {
        this.board.ram.writeByte(RECEIVE_ADDR, value)
    }

    get port1(): number {
        return this.board.ram.readByte(PORT_1_ADDR)
    }

    set port1(value: number) {
        this.board.ram.writeByte(PORT_1_ADDR, value)
    }

    get port3(): number {
        return this.board.ram.readByte(PORT_3_ADDR)
    }

    set port3(value: number) {
        this.board.ram.writeByte(PORT_3_ADDR, value)
    }

    get port8(): number {
        return this.board.ram.readByte(PORT_8_ADDR)
    }

    set port8(value: number) {
        this.board.ram.writeByte(PORT_8_ADDR, value)
    }

    get port9(): number {
        return this.board.ram.readByte(PORT_9_ADDR)
    }

    set port9(value: number) {
        this.board.ram.writeByte(PORT_9_ADDR, value)
    }

    get portB(): number {
        return this.board.ram.readByte(PORT_B_ADDR)
    }

    set portB(value: number) {
        this.board.ram.writeByte(PORT_B_ADDR, value)
    }
}