import {createWorker} from "./extensions/worker-extensions.ts"
import Path from 'node:path'
import {WalkerWindow} from "./sdl/walker-window.ts";
import {WalkerAudio} from "./sdl/walker-audio.ts";
import {inputKey} from "./emulator/ssu/ssu.ts";

const window = new WalkerWindow()
const audio = new WalkerAudio()

const emulatorWorker = createWorker(Path.join(import.meta.dirname, './workers/emulator-worker.ts'));
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
    }
});

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
