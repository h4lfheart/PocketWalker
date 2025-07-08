type Callback<T = void> = (data: T) => void;

export class EventHandler<T extends Record<string, any>> {
    private listeners: Callback<T>[] = [];

    addListener(cb: Callback<T>) {
        this.listeners.push(cb);
    }

    invoke(data: T) {
        this.listeners.forEach(cb => cb(data));
    }
}