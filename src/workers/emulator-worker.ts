import {parentPort, workerData} from 'node:worker_threads'
import {PocketWalker} from "../emulator/pocket-walker.ts"

const {romPath, eepromPath} = workerData

const walker = new PocketWalker(romPath, eepromPath)

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