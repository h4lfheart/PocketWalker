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
    PORT_9_ADDR,
    SSER_RECEIVE_ENABLED,
    SSER_TRANSMIT_ENABLED,
    SSSR_RECEIVE_DATA_FULL,
    SSSR_TRANSMIT_EMPTY,
    SSSR_TRANSMIT_END,
    Ssu
} from "../ssu/Ssu";
import {EepRom} from "../eeprom/EepRom";
import {Accelerometer, AccelerometerState} from "../accelerometer/Accelerometer";


export class Cpu {
    // TODO create component system to hold all components instead of passing them as needed
    memory: Memory
    ssu: Ssu
    eeprom: EepRom
    accelerometer: Accelerometer

    flags: Flags = {
        I: false,
        U: false,
        H: false,
        N: false,
        Z: false,
        V: false,
        C: false,
        UI: false
    }
    
    registers: Registers = new Registers()
    instructions: Instructions = new Instructions()

    sleep: boolean = false
    cycleCount: number = 0
    opcodeCount: number = 0

    constructor(memory: Memory, ssu: Ssu, eeprom: EepRom, accelerometer: Accelerometer) {
        this.memory = memory;
        this.ssu = ssu
        this.eeprom = eeprom;
        this.accelerometer = accelerometer

        this.registers.pc = this.memory.readShort(0)
    }

    execute() {
        if (!this.sleep) {
            this.loadInstructions()
            opcodeTable_aH_aL.execute(this)
        }

        if (this.ssu.port(PORT_9_ADDR) & ACCELERATOR_PIN) {
            this.accelerometer.state = AccelerometerState.Waiting
            this.accelerometer.offset = 0
        }

        // TODO add cycles property to opcode
        const cyclesCompleted = 2
        for (let i = 0; i < cyclesCompleted; i++) {
            this.cycleCount++

            if ((this.cycleCount % 4) == 0) {
                if (~this.ssu.enableRegister & SSER_TRANSMIT_ENABLED) {
                    this.ssu.statusRegister |= SSSR_TRANSMIT_EMPTY
                }

                if (this.ssu.enableRegister & SSER_TRANSMIT_ENABLED && this.ssu.enableRegister & SSER_RECEIVE_ENABLED) {
                    if (~this.ssu.statusRegister & SSSR_TRANSMIT_EMPTY) {
                        if (~this.ssu.port(PORT_9_ADDR) & ACCELERATOR_PIN) {
                            switch (this.accelerometer.state) {
                                case AccelerometerState.Waiting:
                                    this.accelerometer.address = this.ssu.transmitRegister & 0xF
                                    this.accelerometer.offset = 0
                                    this.accelerometer.state = AccelerometerState.TransferringBytes
                                    this.ssu.statusRegister |= SSSR_RECEIVE_DATA_FULL
                                    break;
                                case AccelerometerState.TransferringBytes:
                                    this.ssu.receiveRegister = this.accelerometer.memory.readByte(this.accelerometer.address + this.accelerometer.offset)
                                    this.accelerometer.offset += 1;
                                    this.ssu.statusRegister |= SSSR_RECEIVE_DATA_FULL
                                    this.ssu.statusRegister |= SSSR_TRANSMIT_EMPTY
                                    this.ssu.statusRegister |= SSSR_TRANSMIT_END
                                    break;

                            }
                        }

                        if (~this.ssu.port(PORT_1_ADDR) & EEPROM_PIN) {
                            debugger
                        }

                        if (~this.ssu.port(PORT_1_ADDR) & LCD_PIN) {
                            debugger
                        }
                    }

                } else if (this.ssu.enableRegister & SSER_TRANSMIT_ENABLED) {
                    if (~this.ssu.statusRegister & SSSR_TRANSMIT_EMPTY) {
                        if (~this.ssu.port(PORT_9_ADDR) & ACCELERATOR_PIN) {
                            switch (this.accelerometer.state) {
                                case AccelerometerState.Waiting:
                                    this.accelerometer.address = this.ssu.transmitRegister
                                    this.accelerometer.state = AccelerometerState.TransferringBytes
                                    this.ssu.statusRegister |= SSSR_RECEIVE_DATA_FULL
                                    break;
                                case AccelerometerState.TransferringBytes:
                                    this.accelerometer.memory.writeByte(this.accelerometer.address, this.ssu.transmitRegister)
                                    this.ssu.statusRegister |= SSSR_RECEIVE_DATA_FULL
                                    this.ssu.statusRegister |= SSSR_TRANSMIT_EMPTY
                                    this.ssu.statusRegister |= SSSR_TRANSMIT_END
                                    break;

                            }
                        }

                        if (~this.ssu.port(PORT_1_ADDR) & EEPROM_PIN) {
                            debugger
                        }

                        if (this.ssu.port(PORT_1_ADDR) & LCD_DATA_PIN) {
                            debugger
                        } else if (~this.ssu.port(PORT_1_ADDR) & LCD_PIN) {
                            debugger
                        }
                    }

                } else if (this.ssu.enableRegister & SSER_RECEIVE_ENABLED) {
                    debugger
                }
            }
        }

        this.opcodeCount++
    }

    loadInstructions() {
        const a = this.memory.readByte(this.registers.pc)
        const b = this.memory.readByte(this.registers.pc + 1)
        const c = this.memory.readByte(this.registers.pc + 2)
        const d = this.memory.readByte(this.registers.pc + 3)
        const e = this.memory.readByte(this.registers.pc + 4)
        const f = this.memory.readByte(this.registers.pc + 5)

        this.instructions.set(a, b, c, d, e, f)
    }

}