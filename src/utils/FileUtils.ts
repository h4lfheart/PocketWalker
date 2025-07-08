import {fileURLToPath} from "url";
import {dirname, resolve} from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const basePath = resolve(__dirname, "..", "..")

export function getPath(...paths: string[]): string {
    return resolve(basePath, ...paths)
}