import {Socket} from "node:net";

export class Tcp {
    socket: Socket
    connected: boolean = false

    receiveData: number[] = []

    constructor() {
        this.socket = new Socket()

        this.socket.on('connect', () => {
            this.connected = true
        })

        this.socket.on('close', () => {
            this.connected = false
        })

        this.socket.on('data', (data: Buffer) => {
            for (const byte of data) {
                this.receiveData.push(byte)
            }
        })

        this.socket.on('error', () => {
            // ignored
        })
    }

    transmit(value: number) {
        this.socket.write(Buffer.from([value]))
    }
}