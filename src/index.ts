import {createWorker} from "./extensions/worker-extensions.ts"
import Path from 'node:path'
import {WalkerWindow} from "./sdl/walker-window.ts";
import {WalkerAudio} from "./sdl/walker-audio.ts";
import {inputKey} from "./emulator/ssu/ssu.ts";


const isServer = process.argv.includes('-server')

const window = new WalkerWindow()
const audio = new WalkerAudio()

const emulatorWorker = createWorker(Path.join(import.meta.dirname, './workers/emulator-worker.ts'), {
    workerData: {
        romPath: "C:/walker.bin",
        eepromPath: isServer ? "C:/Users/Max/Desktop/melon_eep.bin" : "C:/Users/Max/Desktop/arceus_eep.rom"
    }
});
emulatorWorker.on('message', ({type, data}) => {
    switch (type) {
        case 'log':
            console.log(data)
            break
        case 'lcd-data':
            window.render(data)
            break
        case 'audio':
            audio.render(data.frequency, data.volume, 1)
            break
        case 'tcp-transmit':
            tcpWorker.postMessage({
                type: 'transmit',
                data: data
            })
            break
    }
});

const tcpWorkerName = process.argv.includes('-server') ? 'tcp-server-worker' : 'tcp-client-worker'
const tcpWorker = createWorker(Path.join(import.meta.dirname, `./workers/${tcpWorkerName}.ts`));
tcpWorker.on('message', ({type, data}) => {
    switch (type) {
        case 'log':
            console.log(data)
            break
        case 'receive':
            emulatorWorker.postMessage({
                type: 'tcp-receive',
                data: data
            })
            break
    }
});

window.onClose(() => {
    emulatorWorker.postMessage({
        type: 'save'
    })
})

window.onKeyDown(key => {
    switch (key) {
        case "left":
            emulatorWorker.postMessage({
                type: 'input',
                data: inputKey.KEY_LEFT
            })
            break
        case "right":
            emulatorWorker.postMessage({
                type: 'input',
                data: inputKey.KEY_RIGHT
            })
            break
        case "down":
            emulatorWorker.postMessage({
                type: 'input',
                data: inputKey.KEY_CENTER
            })
            break
    }
})
