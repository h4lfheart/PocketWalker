import { Worker, WorkerOptions } from "worker_threads"

export function createWorker(path: string, options: WorkerOptions = {}) {
    return new Worker(path, {
        ...options,
        execArgv: [
            ...(options.execArgv || []),
            '--import',
            'ts-node'
        ],
    });
}