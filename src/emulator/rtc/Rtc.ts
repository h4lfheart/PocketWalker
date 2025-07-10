import {Memory} from "../memory/Memory";
import {decimalToHex} from "../../utils/BitUtils";

export const RTC_SECOND_ADDR = 0xF068
export const RTC_MINUTE_ADDR = 0xF069
export const RTC_HOUR_ADDR = 0xF06A
export const RTC_DAY_ADDR = 0xF06B


export const RTC_FLAG_ADDR = 0xF067

export const QUARTER_SECOND_INTERRUPT_ENABLE = (1 << 0)
export const HALF_SECOND_INTERRUPT_ENABLE = (1 << 1)
export const SECOND_INTERRUPT_ENABLE = (1 << 2)
export const MINUTE_INTERRUPT_ENABLE = (1 << 3)
export const HOUR_INTERRUPT_ENABLE = (1 << 4)

export class Rtc {
    memory: Memory

    initialized: boolean = false

    private quarterCount: number = 0
    private lastTime: Date = new Date()

    constructor(memory: Memory) {
        this.memory = memory
    }

    initialize() {
        this.initialized = true

        this.update()

        this.interruptFlag |= QUARTER_SECOND_INTERRUPT_ENABLE
        this.interruptFlag |= HALF_SECOND_INTERRUPT_ENABLE
        this.interruptFlag |= SECOND_INTERRUPT_ENABLE
        this.interruptFlag |= MINUTE_INTERRUPT_ENABLE
        this.interruptFlag |= HOUR_INTERRUPT_ENABLE

    }

    update() {
        const currentTime = new Date()

        this.second = decimalToHex(currentTime.getSeconds())
        this.minute = decimalToHex(currentTime.getMinutes())
        this.hour = decimalToHex(currentTime.getHours())
        this.day = decimalToHex(currentTime.getDay())

        this.quarterCount++

        this.interruptFlag |= QUARTER_SECOND_INTERRUPT_ENABLE

        if (this.quarterCount % 2 == 0) {
            this.interruptFlag |= HALF_SECOND_INTERRUPT_ENABLE
        }

        if (currentTime.getSeconds() != this.lastTime.getSeconds()) {
            this.interruptFlag |= SECOND_INTERRUPT_ENABLE
        }

        if (currentTime.getMinutes() != this.lastTime.getMinutes()) {
            this.interruptFlag |= MINUTE_INTERRUPT_ENABLE
        }

        if (currentTime.getHours() != this.lastTime.getHours()) {
            this.interruptFlag |= MINUTE_INTERRUPT_ENABLE
        }

        this.lastTime = currentTime
    }


    get interruptFlag(): number {
        return this.memory.readByte(RTC_FLAG_ADDR)
    }

    set interruptFlag(value: number) {
        this.memory.writeByte(RTC_FLAG_ADDR, value)
    }

    get second(): number {
        return this.memory.readByte(RTC_SECOND_ADDR)
    }

    set second(value: number) {
        this.memory.writeByte(RTC_SECOND_ADDR, value)
    }

    get minute(): number {
        return this.memory.readByte(RTC_MINUTE_ADDR)
    }

    set minute(value: number) {
        this.memory.writeByte(RTC_MINUTE_ADDR, value)
    }

    get hour(): number {
        return this.memory.readByte(RTC_HOUR_ADDR)
    }

    set hour(value: number) {
        this.memory.writeByte(RTC_HOUR_ADDR, value)
    }

    get day(): number {
        return this.memory.readByte(RTC_DAY_ADDR)
    }

    set day(value: number) {
        this.memory.writeByte(RTC_DAY_ADDR, value)
    }

}