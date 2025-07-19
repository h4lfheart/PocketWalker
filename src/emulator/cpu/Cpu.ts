import {Registers} from "./Registers";
import {Memory} from "../memory/Memory";
import {opcodeTable_aH_aL} from "./opcode/OpcodeTable";
import {Instructions} from "./Instructions";
import {Flags} from "./Flags";
import {
    ACCELERATOR_PIN,
    EEPROM_PIN,
    LCD_DATA_PIN,
    LCD_PIN,
    PORT_1_ADDR,
    PORT_9_ADDR, PORT_B_ADDR,
    SSER_RECEIVE_ENABLED,
    SSER_TRANSMIT_ENABLED,
    SSSR_RECEIVE_DATA_FULL,
    SSSR_TRANSMIT_EMPTY,
    SSSR_TRANSMIT_END,
    Ssu,
} from "../ssu/Ssu";
import {
    EepRom,
    EEPROM_READ_MEMORY,
    EEPROM_READ_STATUS,
    EEPROM_WRITE,
    EEPROM_WRITE_ENABLE, EEPROM_WRITE_UNLOCK,
    EepRomState
} from "../eeprom/EepRom";
import {Accelerometer, AccelerometerState} from "../accelerometer/Accelerometer";
import {
    Lcd, LCD_COLUMN_SIZE,
    LCD_GETTING_CONTRAST,
    LCD_HIGH_COLUMN_RANGE,
    LCD_LOW_COLUMN_RANGE,
    LCD_PAGE_RANGE, LCD_WIDTH,
    LcdState
} from "../lcd/Lcd";
import {
    IEN0,
    IENRTC,
    IENTB1,
    Interrupts,
    IRRI0,
    IRRTB1,
} from "./Interrupts";
import {
    CLOCK_CYCLES_PER_SECOND,
    TIMER_B1_STANDBY,
    TIMER_W_STANDBY,
    Timers
} from "./timer/Timers";
import {TIMER_B_COUNTING} from "./timer/TimerB";
import {toUnsignedByte} from "../../utils/BitUtils";
import {
    TIMER_W_CONTROL_COUNTER_CLEAR,
    TIMER_W_MODE_COUNTING,
    TIMER_W_INTERRUPT_ENABLE_A,
    TIMER_W_STATUS_MATCH_FLAG_A,
    TIMER_W_STATUS_OVERFLOW_FLAG, TIMER_W_INTERRUPT_ENABLE_OVERFLOW
} from "./timer/TimerW";
import {VectorTable} from "./VectorTable";
import {
    HALF_SECOND_INTERRUPT_ENABLE, HOUR_INTERRUPT_ENABLE,
    MINUTE_INTERRUPT_ENABLE, QUARTER_SECOND_INTERRUPT_ENABLE, Rtc, SECOND_INTERRUPT_ENABLE
} from "../rtc/Rtc";

export const CPU_CYCLES_PER_SECOND = 3686400

export enum InputKey {
    KEY_NONE = 0,
    KEY_CENTER = (1 << 0),
    KEY_LEFT = (1 << 2),
    KEY_RIGHT = (1 << 4)
}


export class Cpu {
    // TODO create component system to hold all components instead of passing them as needed
    memory: Memory
    ssu: Ssu
    eeprom: EepRom
    accelerometer: Accelerometer
    lcd: Lcd
    rtc: Rtc

    flags: Flags = new Flags()

    registers: Registers
    instructions: Instructions
    interrupts: Interrupts
    timers: Timers
    vectorTable: VectorTable

    sleep: boolean = false
    cycleCount: number = 0
    clockCycleCount: number = 0
    opcodeCount: number = 0

    cyclesCompleted: number = 0

    constructor(memory: Memory, ssu: Ssu, eeprom: EepRom, accelerometer: Accelerometer, lcd: Lcd, rtc: Rtc) {
        this.memory = memory;
        this.ssu = ssu
        this.eeprom = eeprom;
        this.accelerometer = accelerometer
        this.lcd = lcd
        this.rtc = rtc

        this.registers = new Registers(this.memory)
        this.instructions = new Instructions(this.memory)
        this.interrupts = new Interrupts(this.memory)
        this.timers = new Timers(this.memory)
        this.vectorTable = new VectorTable(this.memory)

        this.registers.pc = this.vectorTable.reset
        this.flags.I = true

    }

    execute(): number {
        this.cyclesCompleted = 0

        if (this.registers.pc == 0x08e6) {
            debugger
        }

        // skip factory tests
        if (this.registers.pc == 0x336) {
            this.registers.pc += 4
            return 2
        }

        // skip battery check
        if (this.registers.pc == 0x350) {
            this.registers.pc += 4
            this.registers.setRegister8(0b1000, 0x00)
            return 2
        }

        // accelerometer sleep
        // TODO add proper interrupt ??
        if (this.registers.pc == 0x7700) {
            this.registers.pc += 2
            return 2
        }

        // set key port back to zero after processing
        // TODO create handlers for certain instruction addr (although these solutions are bad and should be replicated with "hardware")
        if (this.registers.pc == 0x9C3E) {
            // TODO how does the hardware handle it?
            // emulator processes inputs slower for some reason
            if (this.ssu.getPort(PORT_B_ADDR) != 0)
                this.ssu.setPort(PORT_B_ADDR, InputKey.KEY_NONE)
        }

        // set watts
        // TODO where is this actually stored? is it an eeprom thing? don't want to have it set it like this
        if (this.registers.pc == 0x9a4e && this.memory.readShort(0xF78E) == 0) {
            this.memory.writeShort(0xF78E, 255)
        }

        if (!this.sleep) {
            this.instructions.loadInstructions(this.registers.pc)

            opcodeTable_aH_aL.execute(this)
        } else {
            this.cyclesCompleted = 1
        }

        const interrupt = (addr: number) => {
            this.interrupts.savedAddress = this.registers.pc
            this.interrupts.savedFlags = this.flags.copy()

            this.registers.pc = addr
            this.flags.I = true
            this.sleep = false
        }

        if (!this.flags.I) {

            if (this.interrupts.enableRegister1 & IEN0 && this.interrupts.flagRegister1 & IRRI0) {
                interrupt(this.vectorTable.irq0)
            } else if (this.interrupts.enableRegister1 & IENRTC) {
                if (this.rtc.interruptFlag & QUARTER_SECOND_INTERRUPT_ENABLE) {
                    interrupt(this.vectorTable.rtcQuarterSecond)
                } else if (this.rtc.interruptFlag & HALF_SECOND_INTERRUPT_ENABLE) {
                    interrupt(this.vectorTable.rtcHalfSecond)
                } else if (this.rtc.interruptFlag & SECOND_INTERRUPT_ENABLE) {
                    interrupt(this.vectorTable.rtcSecond)
                } else if (this.rtc.interruptFlag & MINUTE_INTERRUPT_ENABLE) {
                    interrupt(this.vectorTable.rtcMinute)
                } else if (this.rtc.interruptFlag & HOUR_INTERRUPT_ENABLE) {
                    interrupt(this.vectorTable.rtcHour)
                }
            } else if (this.interrupts.enableRegister2 & IENTB1 && this.interrupts.flagRegister2 & IRRTB1) {
                interrupt(this.vectorTable.timerB)
            }
        }


        if (this.ssu.getPort(PORT_9_ADDR) & ACCELERATOR_PIN) {
            this.accelerometer.state = AccelerometerState.Waiting
            this.accelerometer.offset = 0
        }

        if (this.ssu.getPort(PORT_1_ADDR) & EEPROM_PIN) {
            this.eeprom.state = EepRomState.Waiting
            this.eeprom.offset = 0
        }

        this.cyclesCompleted = 2 // TODO cycles have been added, but audio sounds worse, reverting for now

        for (let i = 0; i < this.cyclesCompleted; i++) {
            this.cycleCount++

            if ((this.cycleCount % 4) == 0) {

                if (~this.ssu.enableRegister & SSER_TRANSMIT_ENABLED) {
                    this.ssu.statusRegister |= SSSR_TRANSMIT_EMPTY
                }

                if (this.ssu.enableRegister & SSER_TRANSMIT_ENABLED && this.ssu.enableRegister & SSER_RECEIVE_ENABLED) {
                    if (~this.ssu.statusRegister & SSSR_TRANSMIT_EMPTY) {

                        if (~this.ssu.getPort(PORT_9_ADDR) & ACCELERATOR_PIN) {
                            switch (this.accelerometer.state) {
                                case AccelerometerState.Waiting:
                                    this.accelerometer.address = this.ssu.transmitRegister & 0xF
                                    this.accelerometer.offset = 0
                                    this.accelerometer.state = AccelerometerState.GettingBytes
                                    this.ssu.statusRegister |= SSSR_RECEIVE_DATA_FULL
                                    break;
                                case AccelerometerState.GettingBytes:
                                    this.ssu.receiveRegister = this.accelerometer.memory.readByte(this.accelerometer.address + this.accelerometer.offset)
                                    this.accelerometer.offset += 1;
                                    this.ssu.statusRegister |= SSSR_RECEIVE_DATA_FULL
                                    this.ssu.statusRegister |= SSSR_TRANSMIT_EMPTY
                                    this.ssu.statusRegister |= SSSR_TRANSMIT_END
                                    break;

                            }
                        }

                        if (~this.ssu.getPort(PORT_1_ADDR) & EEPROM_PIN) {
                            this.ssu.progress++
                            if (this.ssu.progress == 7) {
                                this.ssu.progress = 0
                                switch (this.eeprom.state) {
                                    case EepRomState.Waiting:
                                        if (this.ssu.transmitRegister == EEPROM_READ_MEMORY) {
                                            this.eeprom.state = EepRomState.GettingAddressHigh
                                        } else if (this.ssu.transmitRegister == EEPROM_READ_STATUS) {
                                            this.eeprom.state = EepRomState.GettingStatus
                                        } else {
                                            debugger
                                        }

                                        break;
                                    case EepRomState.GettingStatus:
                                        this.ssu.receiveRegister = this.eeprom.status
                                        this.ssu.statusRegister |= SSSR_TRANSMIT_END
                                        break;
                                    case EepRomState.GettingAddressHigh:
                                        this.eeprom.highAddress = this.ssu.transmitRegister
                                        this.eeprom.state = EepRomState.GettingAddressLow
                                        break;
                                    case EepRomState.GettingAddressLow:
                                        this.eeprom.lowAddress = this.ssu.transmitRegister
                                        this.eeprom.state = EepRomState.GettingBytes
                                        break;
                                    case EepRomState.GettingBytes:
                                        this.ssu.receiveRegister = this.eeprom.memory.readByte(((this.eeprom.highAddress << 8) | this.eeprom.lowAddress) + this.eeprom.offset)
                                        this.eeprom.offset++
                                        this.ssu.statusRegister |= SSSR_TRANSMIT_END
                                        break;

                                }

                                this.ssu.statusRegister |= SSSR_RECEIVE_DATA_FULL
                                this.ssu.statusRegister |= SSSR_TRANSMIT_EMPTY
                            }
                        }
                    }
                } else if (this.ssu.enableRegister & SSER_TRANSMIT_ENABLED) {
                    if (~this.ssu.statusRegister & SSSR_TRANSMIT_EMPTY) {

                        if (~this.ssu.getPort(PORT_9_ADDR) & ACCELERATOR_PIN) {
                            switch (this.accelerometer.state) {
                                case AccelerometerState.Waiting:
                                    this.accelerometer.address = this.ssu.transmitRegister
                                    this.accelerometer.state = AccelerometerState.GettingBytes
                                    this.ssu.statusRegister |= SSSR_RECEIVE_DATA_FULL
                                    break;
                                case AccelerometerState.GettingBytes:
                                    this.accelerometer.memory.writeByte(this.accelerometer.address, this.ssu.transmitRegister)
                                    this.ssu.statusRegister |= SSSR_RECEIVE_DATA_FULL
                                    this.ssu.statusRegister |= SSSR_TRANSMIT_EMPTY
                                    this.ssu.statusRegister |= SSSR_TRANSMIT_END
                                    break;

                            }
                        }

                        if (~this.ssu.getPort(PORT_1_ADDR) & EEPROM_PIN) {
                            this.ssu.progress++
                            if (this.ssu.progress == 7) {
                                this.ssu.progress = 0
                                switch (this.eeprom.state) {
                                    case EepRomState.Waiting:
                                        if (this.ssu.transmitRegister == EEPROM_WRITE_ENABLE) {
                                            this.eeprom.status |= EEPROM_WRITE_UNLOCK
                                            this.ssu.statusRegister |= SSSR_TRANSMIT_END
                                        } else if (this.ssu.transmitRegister == EEPROM_WRITE) {
                                            this.eeprom.state = EepRomState.GettingAddressHigh
                                        } else {
                                            debugger
                                        }
                                        break;
                                    case EepRomState.GettingAddressHigh:
                                        this.eeprom.highAddress = this.ssu.transmitRegister
                                        this.eeprom.state = EepRomState.GettingAddressLow
                                        break;
                                    case EepRomState.GettingAddressLow:
                                        this.eeprom.lowAddress = this.ssu.transmitRegister
                                        this.eeprom.state = EepRomState.GettingBytes
                                        break;
                                    case EepRomState.GettingBytes:
                                        this.eeprom.memory.writeByte((((this.eeprom.highAddress << 8) | this.eeprom.lowAddress) + this.eeprom.offset), this.ssu.transmitRegister)
                                        this.eeprom.offset++
                                        this.eeprom.offset %= 128
                                        this.ssu.statusRegister |= SSSR_TRANSMIT_END
                                        break;

                                }

                                this.ssu.statusRegister |= SSSR_TRANSMIT_EMPTY
                            }
                        }

                        if (this.ssu.getPort(PORT_1_ADDR) & LCD_DATA_PIN) {
                            this.ssu.progress++
                            if (this.ssu.progress == 7) {
                                this.ssu.progress = 0

                                const addr = (this.lcd.page * LCD_WIDTH * LCD_COLUMN_SIZE) + (this.lcd.column * LCD_COLUMN_SIZE) + this.lcd.offset
                                this.lcd.memory.writeByte(addr, this.ssu.transmitRegister)

                                if (this.lcd.offset == 1) {
                                    this.lcd.column++
                                }
                                this.lcd.offset++
                                this.lcd.offset %= 2

                                this.ssu.statusRegister |= SSSR_TRANSMIT_EMPTY
                                this.ssu.statusRegister |= SSSR_TRANSMIT_END
                            }
                        } else if (~this.ssu.getPort(PORT_1_ADDR) & LCD_PIN) {
                            switch (this.lcd.state) {
                                case LcdState.Waiting:
                                    if (LCD_LOW_COLUMN_RANGE.includes(this.ssu.transmitRegister)) {
                                        this.lcd.column &= 0xF0
                                        this.lcd.column |= this.ssu.transmitRegister & 0xF
                                        this.lcd.offset = 0
                                    } else if (LCD_HIGH_COLUMN_RANGE.includes(this.ssu.transmitRegister)) {
                                        this.lcd.column &= 0xF
                                        this.lcd.column |= (this.ssu.transmitRegister & 0b111) << 4
                                        this.lcd.offset = 0
                                    } else if (LCD_PAGE_RANGE.includes(this.ssu.transmitRegister)) {
                                        this.lcd.page = this.ssu.transmitRegister & 0xF
                                    }else if (LCD_GETTING_CONTRAST.includes(this.ssu.transmitRegister)) {
                                        this.lcd.state = LcdState.GettingContrast
                                    }
                                    break;
                                case LcdState.GettingContrast:
                                    this.lcd.contrast = this.ssu.transmitRegister
                                    this.lcd.state = LcdState.Waiting
                                    break;
                            }

                            this.ssu.statusRegister |= SSSR_TRANSMIT_EMPTY
                            this.ssu.statusRegister |= SSSR_TRANSMIT_END
                        }
                    }
                } else if (this.ssu.enableRegister & SSER_RECEIVE_ENABLED) {
                    debugger
                }
            }

            if (this.cycleCount % (Math.trunc(CPU_CYCLES_PER_SECOND / CLOCK_CYCLES_PER_SECOND)) == 0) {
                this.clockCycleCount++

                const timerB = this.timers.B
                const timerW = this.timers.W

                if (timerB.running && (this.clockCycleCount % timerB.cycleCountSelect) == 0) {
                    timerB.counter = toUnsignedByte(timerB.counter + 1)

                    if (timerB.counter == 0) {
                        this.interrupts.flagRegister2 |= IRRTB1
                        timerB.counter = timerB.loadValue
                    }
                }

                if (timerW.running && (this.clockCycleCount % timerW.cycleCountSelect) == 0) {
                    if (timerW.mode & TIMER_W_MODE_COUNTING) {
                        timerW.counter++
                    }

                    if (timerW.counter == 0) {
                        timerW.status |= TIMER_W_STATUS_OVERFLOW_FLAG
                    }

                    if (timerW.counter >= timerW.registerA) {
                        if (timerW.controlRegister & TIMER_W_CONTROL_COUNTER_CLEAR) {
                            timerW.counter = 0
                        }

                        timerW.status |= TIMER_W_STATUS_MATCH_FLAG_A
                    }

                    if (!this.flags.I) {
                        if (timerW.status & TIMER_W_STATUS_OVERFLOW_FLAG && timerW.interruptEnable & TIMER_W_INTERRUPT_ENABLE_OVERFLOW) {
                            interrupt(this.vectorTable.timerW)
                            timerW.status &= ~TIMER_W_STATUS_OVERFLOW_FLAG
                        }

                        if (timerW.status & TIMER_W_STATUS_MATCH_FLAG_A && timerW.interruptEnable & TIMER_W_INTERRUPT_ENABLE_A) {
                            interrupt(this.vectorTable.timerW)
                            timerW.status &= ~TIMER_W_STATUS_MATCH_FLAG_A
                        }
                    }

                }

                timerB.running = Boolean(this.timers.clockStop1 & TIMER_B1_STANDBY) && Boolean(timerB.mode & TIMER_B_COUNTING)
                timerW.running = Boolean(this.timers.clockStop2 & TIMER_W_STANDBY) && Boolean(timerW.mode & TIMER_W_MODE_COUNTING)

            }
        }

        if (!this.sleep)
            this.opcodeCount++

        return this.cyclesCompleted
    }

    pushKey(key: InputKey) {
        if (!this.flags.I && key == InputKey.KEY_CENTER) {
            this.interrupts.flagRegister1 |= IRRI0
        }

        this.ssu.setPort(PORT_B_ADDR, key)
        this.sleep = false
    }
}