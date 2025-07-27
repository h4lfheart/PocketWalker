import {Socket} from "node:net";
import {parentPort} from "node:worker_threads";
import {setInterval} from "node:timers";

let connected = false
const socket = new Socket()

socket.on('connect', () => {
    connected = true
})

socket.on('close', () => {
    connected = false
})

socket.on('data', (data: Buffer) => {
    parentPort!.postMessage({
        type: 'receive',
        data: Array.from(data)
    })

    parentPort!.postMessage({
        type: 'log',
        data: `[TCP] Buffer: ${Array.from(data).map(item => (item ^ 0xAA).toString(16)).join(' ')}`
    })
})

socket.on('error', () => {
    // ignored
})

parentPort?.on('message', ({type, data}) => {
    switch (type) {
        case 'transmit':
            parentPort!.postMessage({
                type: 'log',
                data: `[TCP] Transmit: ${(data ^ 0xAA).toString(16)}`
            })
            socket.write(Buffer.from([data]))
            break
    }
})

setInterval(() => {
    if (!connected) {
        socket.connect(8081, '0.0.0.0')
    }
})