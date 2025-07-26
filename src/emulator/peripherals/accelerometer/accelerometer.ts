import {Memory} from "../../memory/memory.ts"
import {BoardComponent} from "../../board/boardComponent.ts"
import {Board} from "../../board/board.ts"

const RAM_SIZE = 0x7F

export const accelerometerState = {
    address: 0,
    data: 1
}

export class Accelerometer extends BoardComponent {
    memory: Memory

    state: number = accelerometerState.address
    address: number = 0
    offset: number = 0

    constructor(board: Board) {
        super(board)

        this.memory = Memory.fromSize(RAM_SIZE)
    }
}