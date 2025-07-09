import sdl from "@kmamal/sdl";
import Window = sdl.Sdl.Video.Window;
import {LCD_COLOR_3, LCD_HEIGHT, LCD_WIDTH} from "../emulator/lcd/Lcd";
import {getPath} from "../utils/FileUtils";
import {PNG} from 'pngjs'
import {readFileSync} from "node:fs";
import {EventHandler} from "../utils/EventUtils";

const MARGIN_SIZE = 4;

export class WalkerWindow {
    window: Window

    private scale: number
    private baseWidth: number
    private baseHeight: number

    private onKeyDownHandler: EventHandler<string> = new EventHandler<string>()
    private onKeyUpHandler: EventHandler<string> = new EventHandler<string>()
    private onCloseHandler: EventHandler<void> = new EventHandler<void>()

    constructor(scale: number) {
        this.baseWidth = LCD_WIDTH + MARGIN_SIZE * 2
        this.baseHeight = LCD_HEIGHT + MARGIN_SIZE * 2

        this.scale = scale
        this.window = sdl.video.createWindow({
            title: "Pocket-Walker",
            width: this.baseWidth * this.scale,
            height: this.baseHeight * this.scale,
            resizable: false
        })

        const iconPath = getPath('assets', 'logo.png')
        const iconData = readFileSync(iconPath)
        const iconPng = PNG.sync.read(iconData)
        this.window.setIcon(iconPng.width, iconPng.height, iconPng.width * 4, 'rgba32', iconPng.data)

        this.window.on('keyDown', (args: any) => this.onKeyDownHandler.invoke(args.key))
        this.window.on('keyUp', (args: any) => this.onKeyUpHandler.invoke(args.key))
        this.window.on('close', () => this.onCloseHandler.invoke())

        this.window.render(1, 1, 3, 'rgb24', Buffer.alloc(3, 0xCC), {
            dstRect: {
                x: 0,
                y: 0,
                width: this.window.width,
                height: this.window.height
            }
        });

    }

    render(buffer: Buffer) {
        const screenBuffer = Buffer.alloc(this.baseWidth * this.baseHeight * 3, LCD_COLOR_3 & 0xFF);

        for (let y = 0; y < LCD_HEIGHT; y++) {
            for (let x = 0; x < LCD_WIDTH; x++) {
                const srcIndex = (y * LCD_WIDTH + x) * 3;
                const dstX = MARGIN_SIZE + x;
                const dstY = MARGIN_SIZE + y;
                const dstIndex = (dstY * this.baseWidth + dstX) * 3;

                screenBuffer[dstIndex] = buffer[srcIndex];
                screenBuffer[dstIndex + 1] = buffer[srcIndex + 1];
                screenBuffer[dstIndex + 2] = buffer[srcIndex + 2];
            }
        }

        this.window.render(this.baseWidth, this.baseHeight, this.baseWidth * 3, 'rgb24', screenBuffer);
    }

    onKeyDown(action: (key: string) => void) {
        this.onKeyDownHandler.addListener(action)
    }

    onKeyUp(action: (key: string) => void) {
        this.onKeyUpHandler.addListener(action)
    }

    onClose(action: () => void) {
        this.onCloseHandler.addListener(action)
    }
}