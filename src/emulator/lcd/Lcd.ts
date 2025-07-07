import {Memory} from "../memory/Memory";
import {range} from "../../utils/CollectionUtils";

export const LCD_PAGE_SIZE = 0xFF
export const LCD_PAGE_COUNT = 21
export const LCD_COLUMN_COUNT = 0x74

export const LCD_RAM_SIZE = LCD_PAGE_SIZE * LCD_PAGE_COUNT

export const LCD_LOW_COLUMN_RANGE = range(0x0, 0xF)
export const LCD_HIGH_COLUMN_RANGE = range(0x10, 0x17)
export const LCD_PAGE_RANGE = range(0xB0, 0xBF)
export const LCD_GETTING_CONTRAST = [0x81]

export const LCD_WIDTH = 96
export const LCD_HEIGHT = 64
export const LCD_COLUMN_SIZE = 2
export const LCD_BUFFER_SEPARATION = 16

export const LCD_COLOR_0 = 0x333333
export const LCD_COLOR_1 = 0x666666
export const LCD_COLOR_2 = 0x999999
export const LCD_COLOR_3 = 0xCCCCCC

export const LCD_PALETTE = [LCD_COLOR_3, LCD_COLOR_2, LCD_COLOR_1, LCD_COLOR_0]

export class Lcd {
    memory: Memory
    state: LcdState = LcdState.Waiting

    column: number = 0
    offset: number = 0
    page: number = 0

    bufferIndex: number = 0

    contrast: number = 20

    constructor(memory: Memory) {
        this.memory = memory
    }
}

export enum LcdState {
    Waiting,
    GettingContrast
}