import { TextDecoder } from 'text-encoding';

interface EventType<T> {
    typeId: number;
    encode: (T) => Uint8Array;
    decode: (Uint8Array) => T;
}

interface TypedEvent<T> {
    eventType: EventType<T>,
    data: T,
}

type AnyEvent = TypedEvent<any>;

class JsonEventType<T> {
    public readonly typeId: number;

    constructor(typeId: number) {
        this.typeId = typeId;
    }

    encode(data: T): Uint8Array {
        let json = JSON.stringify(data);
        return Buffer.from(json, 'utf-8');
    }

    decode(data: Uint8Array): T {
        let string = new TextDecoder('utf-8').decode(data);
        return JSON.parse(string);
    }
}