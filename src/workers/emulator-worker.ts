import { parentPort } from 'node:worker_threads'
import {PocketWalker} from "../emulator/pocket-walker.ts"

const walker = new PocketWalker("C:/walker.bin", "C:/Users/Max/Desktop/melon_eep.bin")

parentPort!.on('message', ({type, data}) => {
    switch (type) {
        case 'log':
            break
        case 'input':
            walker.pushKey(data)
            break
        case 'tcp-receive':
            walker.board.sci3.receiveData.push(...data)
            break
        case 'save':
            walker.save()
            break
    }
});

await walker.run()