import sdl from "@kmamal/sdl";
import AudioPlaybackInstance = sdl.Sdl.Audio.AudioPlaybackInstance;

export const AUDIO_RENDER_FREQUENCY = 256

const SAMPLE_RATE = 44100
const BASE_AMPLITUDE = 32768 / 2
const TARGET_LATENCY = 10

const MIN_FREQUENCY = 100
const MAX_FREQUENCY = 20000

export class WalkerAudio {
    audio: AudioPlaybackInstance

    private currentPhase: number = 0

    constructor() {
        this.audio = sdl.audio.openDevice({ type: 'playback' }, {channels: 1, frequency: SAMPLE_RATE, format: 's16sys'})
        this.audio.play()
    }

    render(frequency: number, volumeMultiplier: number = 1, speed: number = 1) {

        const latency = this.audio.queued / (SAMPLE_RATE / 1000);
        let sampleCount = Math.ceil(SAMPLE_RATE / (AUDIO_RENDER_FREQUENCY * speed));
        if (latency > TARGET_LATENCY) {
            sampleCount = Math.max(1, sampleCount - 1);
        }

        const audioBuffer = Buffer.alloc(sampleCount * 2)
        let targetAmplitude = BASE_AMPLITUDE * volumeMultiplier
        if (frequency >= MIN_FREQUENCY && frequency <= MAX_FREQUENCY) {
            const samplesPerCycle = SAMPLE_RATE / frequency;
            const onSamples = samplesPerCycle * 0.5;
            const numSamples = audioBuffer.length / 2;

            for (let i = 0; i < numSamples; i++) {
                const cyclePosition = (this.currentPhase + i) % samplesPerCycle;
                const sample = cyclePosition < onSamples ? targetAmplitude : -targetAmplitude;
                audioBuffer.writeInt16LE(sample, i * 2);
            }

            this.currentPhase += numSamples
            this.currentPhase %= samplesPerCycle
        }

        this.audio.enqueue(audioBuffer)

    }
}