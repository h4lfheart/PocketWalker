import {Memory} from "../../memory/memory.ts";
import {range} from "../../../extensions/collection-extensions.ts";
import {BoardComponent} from "../../board/board-component.ts";
import {Board} from "../../board/board.ts";
import {parentPort} from "node:worker_threads";
import {debug} from "node:util";
import {PeripheralComponent} from "../peripheral-component.ts";
import {Ssu, ssuFlags} from "../../ssu/ssu.ts";

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

export const lcdState = {
    waiting: 0,
    gettingContrast: 1
}

export class Lcd extends PeripheralComponent {
    memory: Memory
    state: number = lcdState.waiting

    column: number = 0
    offset: number = 0
    page: number = 0

    bufferIndex: number = 0

    contrast: number = 20

    constructor(board: Board) {
        super(board);

        this.memory = Memory.fromSize(128 * 176 / 4)
    }

    override tick() {
        const buffer = Buffer.alloc(LCD_WIDTH * LCD_HEIGHT * 3)

        for (let y = 0; y < LCD_HEIGHT; y++) {
            const stripeOffset = y % 8
            const row = Math.floor(y / 8)
            const rowOffset = row * LCD_WIDTH * LCD_COLUMN_SIZE
            const bufferOffset = this.bufferIndex * LCD_WIDTH * LCD_BUFFER_SEPARATION

            for (let x = 0; x < LCD_WIDTH; x++) {
                const baseIndex = 2 * x + rowOffset + bufferOffset

                const firstBit = (this.memory.readByte(baseIndex) >> stripeOffset) & 1
                const secondBit = (this.memory.readByte(baseIndex + 1) >> stripeOffset) & 1

                const paletteIndex = (firstBit << 1) | secondBit
                const color = LCD_PALETTE[paletteIndex]

                const baseOffset = (y * LCD_WIDTH + x) * 3

                buffer[baseOffset] = (color >> 16) & 0xFF
                buffer[baseOffset + 1] = (color >> 8) & 0xFF
                buffer[baseOffset + 2] = (color >> 0) & 0xFF
            }
        }

        this.bufferIndex = this.bufferIndex ? 0 : 1

        parentPort?.postMessage({
            type: 'lcd-data',
            data: buffer
        })
    }

    transmit(ssu: Ssu, meta?: string) {
        if (meta == 'data') {
            ssu.progress++
            if (ssu.progress == 7) {
                ssu.progress = 0

                const addr = (this.page * LCD_WIDTH * LCD_COLUMN_SIZE) + (this.column * LCD_COLUMN_SIZE) + this.offset
                this.memory.writeByte(addr, ssu.transmit)

                if (this.offset == 1) {
                    this.column++
                }
                this.offset++
                this.offset %= 2

                ssu.status |= ssuFlags.status.TRANSMIT_EMPTY
                ssu.status |= ssuFlags.status.TRANSMIT_END
            }
        } else {
            switch (this.state) {
                case lcdState.waiting:
                    if (LCD_LOW_COLUMN_RANGE.includes(ssu.transmit)) {
                        this.column &= 0xF0
                        this.column |= ssu.transmit & 0xF
                        this.offset = 0
                    } else if (LCD_HIGH_COLUMN_RANGE.includes(ssu.transmit)) {
                        this.column &= 0xF
                        this.column |= (ssu.transmit & 0b111) << 4
                        this.offset = 0
                    } else if (LCD_PAGE_RANGE.includes(ssu.transmit)) {
                        this.page = ssu.transmit & 0xF
                    } else if (LCD_GETTING_CONTRAST.includes(ssu.transmit)) {
                        this.state = lcdState.gettingContrast
                    }
                    break;
                case lcdState.gettingContrast:
                    this.contrast = ssu.transmit
                    this.state = lcdState.waiting
                    break;
            }

            ssu.status |= ssuFlags.status.TRANSMIT_EMPTY
            ssu.status |= ssuFlags.status.TRANSMIT_END
        }
    }
}
