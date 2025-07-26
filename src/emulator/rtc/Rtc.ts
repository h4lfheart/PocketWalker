import {Memory} from "../memory/memory.ts";
import {decimalToHex} from "../../extensions/bit-extensions.ts";
import {BoardComponent} from "../board/boardComponent.ts";
import {Board} from "../board/board.ts";

export const RTC_SECOND_ADDR = 0xF068
export const RTC_MINUTE_ADDR = 0xF069
export const RTC_HOUR_ADDR = 0xF06A
export const RTC_DAY_ADDR = 0xF06B

export const RTC_FLAG_ADDR = 0xF067

export const rtcFlags = {
    hour: 1 << 4,
    minute: 1 << 3,
    second: 1 << 2,
    halfSecond: 1 << 1,
    quarterSecond: 1 << 0
}

export class Rtc extends BoardComponent {
    initialized: boolean = false

    private quarterCount: number = 0
    private lastTime: Date = new Date()

    initialize() {
        this.initialized = true

        this.tick()

        this.interruptFlag |= rtcFlags.quarterSecond
        this.interruptFlag |= rtcFlags.halfSecond
        this.interruptFlag |= rtcFlags.second
        this.interruptFlag |= rtcFlags.minute
        this.interruptFlag |= rtcFlags.hour

    }

    tick() {
        const currentTime = new Date()

        this.second = decimalToHex(currentTime.getSeconds())
        this.minute = decimalToHex(currentTime.getMinutes())
        this.hour = decimalToHex(currentTime.getHours())
        this.day = decimalToHex(currentTime.getDay())

        this.quarterCount++

        this.interruptFlag |= rtcFlags.quarterSecond

        if (this.quarterCount % 2 == 0) {
            this.interruptFlag |= rtcFlags.halfSecond
        }

        if (currentTime.getSeconds() != this.lastTime.getSeconds()) {
            this.interruptFlag |= rtcFlags.second
        }

        if (currentTime.getMinutes() != this.lastTime.getMinutes()) {
            this.interruptFlag |= rtcFlags.minute
        }

        if (currentTime.getHours() != this.lastTime.getHours()) {
            this.interruptFlag |= rtcFlags.hour
        }

        this.lastTime = currentTime
    }


    get interruptFlag(): number {
        return this.board.ram.readByte(RTC_FLAG_ADDR)
    }

    set interruptFlag(value: number) {
        this.board.ram.writeByte(RTC_FLAG_ADDR, value)
    }

    get second(): number {
        return this.board.ram.readByte(RTC_SECOND_ADDR)
    }

    set second(value: number) {
        this.board.ram.writeByte(RTC_SECOND_ADDR, value)
    }

    get minute(): number {
        return this.board.ram.readByte(RTC_MINUTE_ADDR)
    }

    set minute(value: number) {
        this.board.ram.writeByte(RTC_MINUTE_ADDR, value)
    }

    get hour(): number {
        return this.board.ram.readByte(RTC_HOUR_ADDR)
    }

    set hour(value: number) {
        this.board.ram.writeByte(RTC_HOUR_ADDR, value)
    }

    get day(): number {
        return this.board.ram.readByte(RTC_DAY_ADDR)
    }

    set day(value: number) {
        this.board.ram.writeByte(RTC_DAY_ADDR, value)
    }

}