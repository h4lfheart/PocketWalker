import {Walker} from "./src/Walker";
import {WalkerWindow} from "./src/sdl/WalkerWindow";
import {InputKey} from "./src/emulator/cpu/Cpu";
import {WalkerAudio} from "./src/sdl/WalkerAudio";

const walker = new Walker("C:/walker.bin", "C:/Users/Max/Downloads/pw_jp_eep/pweep.rom")

const window = new WalkerWindow(8)
window.onClose(() => {
    walker.saveEeprom()
    walker.running = false
})

window.onKeyDown(key => {
    switch (key) {
        case "left":
            walker.addInput(InputKey.KEY_LEFT)
            break
        case "right":
            walker.addInput(InputKey.KEY_RIGHT)
            break
        case "down":
            walker.addInput(InputKey.KEY_CENTER)
            break
        case "tab":
            walker.emulationSpeed = 3
            break
    }
})

window.onKeyUp(key => {
    switch (key) {
        case "tab":
            walker.emulationSpeed = 1
            break
    }
})

walker.onRenderLcd(buffer => {
    window.render(buffer)
})

const audio = new WalkerAudio()

walker.onRenderAudio(props => {
    audio.render(props.frequency, props.volume, props.speed)
})


await walker.run()
