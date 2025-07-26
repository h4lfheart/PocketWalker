import {Memory} from "../memory/memory.ts"
import {BoardComponent} from "../board/boardComponent.ts"
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

    private progress: number = 0
    
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
    }

    tick() {

        if (~this.enable & ssuFlags.enable.TRANSMIT_ENABLED) {
            this.status |= ssuFlags.status.TRANSMIT_EMPTY
        }

        if (this.enable & ssuFlags.enable.TRANSMIT_ENABLED && this.enable & ssuFlags.enable.RECEIVE_ENABLED) {
            if (~this.status & ssuFlags.status.TRANSMIT_EMPTY) {

                if (~this.port9 & ssuFlags.port9.ACCELEROMETER) {
                    const accelerometer = this.board.accelerometer
                    switch (accelerometer.state) {
                        case accelerometerState.address:
                            accelerometer.address = this.transmit
                            accelerometer.offset = 0
                            accelerometer.state = accelerometerState.data
                            this.status |= ssuFlags.status.RECEIVE_FULL
                            break
                        case accelerometerState.data:
                            this.receive = this.board.accelerometer.memory.readByte(accelerometer.address + accelerometer.offset)
                            accelerometer.offset++
                            this.status |= ssuFlags.status.RECEIVE_FULL
                            this.status |= ssuFlags.status.TRANSMIT_EMPTY
                            this.status |= ssuFlags.status.TRANSMIT_END

                            break
                    }
                }

                if (~this.port1 & ssuFlags.port1.EEPROM) {
                    this.progress++
                    if (this.progress == 7) {
                        this.progress = 0

                        const eeprom = this.board.eeprom
                        switch (eeprom.state) {
                            case eepromState.waiting:
                                if (this.transmit == eepromCommands.READ_MEMORY) {
                                    eeprom.state = eepromState.gettingAddressHigh
                                } else if (this.transmit == eepromCommands.READ_STATUS) {
                                    eeprom.state = eepromState.gettingStatus
                                } else {
                                    debugger
                                }

                                break;
                            case eepromState.gettingStatus:
                                this.receive = eeprom.status
                                this.status |= ssuFlags.status.TRANSMIT_END
                                break;
                            case eepromState.gettingAddressHigh:
                                eeprom.highAddress = this.transmit
                                eeprom.state = eepromState.gettingAddressLow
                                break;
                            case eepromState.gettingAddressLow:
                                eeprom.lowAddress = this.transmit
                                eeprom.state = eepromState.gettingBytes
                                break;
                            case eepromState.gettingBytes:
                                this.receive = eeprom.memory.readByte(((eeprom.highAddress << 8) | eeprom.lowAddress) + eeprom.offset)
                                eeprom.offset++
                                this.status |= ssuFlags.status.TRANSMIT_END
                                break;

                        }

                        this.status |= ssuFlags.status.RECEIVE_FULL
                        this.status |= ssuFlags.status.TRANSMIT_EMPTY
                    }
                }

            }
        } else if (this.enable & ssuFlags.enable.TRANSMIT_ENABLED) {
            if (~this.status & ssuFlags.status.TRANSMIT_EMPTY) {

                if (~this.port9 & ssuFlags.port9.ACCELEROMETER) {
                    const accelerometer = this.board.accelerometer
                    switch (accelerometer.state) {
                        case accelerometerState.address:
                            accelerometer.address = this.transmit
                            accelerometer.state = accelerometerState.data
                            break
                        case accelerometerState.data:
                            this.board.accelerometer.memory.writeByte(accelerometer.address, this.board.ssu.transmit)
                            this.status |= ssuFlags.status.TRANSMIT_EMPTY
                            this.status |= ssuFlags.status.TRANSMIT_END

                            break
                    }
                }

                if (~this.port1 & ssuFlags.port1.EEPROM) {
                    this.progress++
                    if (this.progress == 7) {
                        this.progress = 0

                        const eeprom = this.board.eeprom
                        switch (eeprom.state) {
                            case eepromState.waiting:
                                if (this.transmit == eepromCommands.WRITE_ENABLE) {
                                    eeprom.status |= eepromFlags.status.WRITE_UNLOCK
                                    this.status |= ssuFlags.status.TRANSMIT_END
                                } else if (this.transmit == eepromCommands.WRITE_MEMORY) {
                                    eeprom.state = eepromState.gettingAddressHigh
                                } else {
                                    debugger
                                }
                                break;
                            case eepromState.gettingAddressHigh:
                                eeprom.highAddress = this.transmit
                                eeprom.state = eepromState.gettingAddressLow
                                break;
                            case eepromState.gettingAddressLow:
                                eeprom.lowAddress = this.transmit
                                eeprom.state = eepromState.gettingBytes
                                break;
                            case eepromState.gettingBytes:
                                eeprom.memory.writeByte((((eeprom.highAddress << 8) | eeprom.lowAddress) + eeprom.offset), this.transmit)
                                eeprom.offset++
                                eeprom.offset %= 128
                                this.status |= ssuFlags.status.TRANSMIT_END
                                break;

                        }

                        this.status |= ssuFlags.status.TRANSMIT_EMPTY
                    }
                }

                if (this.port1 & ssuFlags.port1.LCD_DATA) {
                    this.progress++
                    if (this.progress == 7) {
                        this.progress = 0

                        const addr = (this.board.lcd.page * LCD_WIDTH * LCD_COLUMN_SIZE) + (this.board.lcd.column * LCD_COLUMN_SIZE) + this.board.lcd.offset
                        this.board.lcd.memory.writeByte(addr, this.transmit)

                        if (this.board.lcd.offset == 1) {
                            this.board.lcd.column++
                        }
                        this.board.lcd.offset++
                        this.board.lcd.offset %= 2

                        this.status |= ssuFlags.status.TRANSMIT_EMPTY
                        this.status |= ssuFlags.status.TRANSMIT_END
                    }
                } else if (~this.port1 & ssuFlags.port1.LCD) {
                    switch (this.board.lcd.state) {
                        case lcdState.waiting:
                            if (LCD_LOW_COLUMN_RANGE.includes(this.transmit)) {
                                this.board.lcd.column &= 0xF0
                                this.board.lcd.column |= this.transmit & 0xF
                                this.board.lcd.offset = 0
                            } else if (LCD_HIGH_COLUMN_RANGE.includes(this.transmit)) {
                                this.board.lcd.column &= 0xF
                                this.board.lcd.column |= (this.transmit & 0b111) << 4
                                this.board.lcd.offset = 0
                            } else if (LCD_PAGE_RANGE.includes(this.transmit)) {
                                this.board.lcd.page = this.transmit & 0xF
                            } else if (LCD_GETTING_CONTRAST.includes(this.transmit)) {
                                this.board.lcd.state = lcdState.gettingContrast
                            }
                            break;
                        case lcdState.gettingContrast:
                            this.board.lcd.contrast = this.transmit
                            this.board.lcd.state = lcdState.waiting
                            break;
                    }

                    this.status |= ssuFlags.status.TRANSMIT_EMPTY
                    this.status |= ssuFlags.status.TRANSMIT_END
                }

            }
        }
    }

    pushKey(key: number) {
        if (!this.board.cpu.flags.I && key == inputKey.KEY_CENTER) {
            this.board.cpu.interrupts.flag1 |= interruptFlags.flag1.IRQ0
        }

        this.portB = key
        this.board.cpu.sleep = false
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