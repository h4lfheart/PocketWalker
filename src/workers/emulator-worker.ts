import { parentPort } from 'node:worker_threads'
import {PocketWalker} from "../emulator/pocket-walker.ts"

const walker = new PocketWalker("C:/walker.bin", "C:/Users/Max/Downloads/pweep.rom")

parentPort!.on('message', ({type, data}) => {
    switch (type) {
        case 'log':
            break
        case 'input':
            walker.pushKey(data)
            break
    }
});

await walker.run()