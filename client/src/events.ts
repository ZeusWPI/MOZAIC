import { TextDecoder } from 'text-encoding';
import { TypedEvent } from './reactor';

export class JsonEventType<T> {
    public readonly typeId: number;

    constructor(typeId: number) {
        this.typeId = typeId;
    }

    create(data: T): TypedEvent<T> {
        return new TypedEvent(this, data);
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


export interface RegisterClient {
    client_id: number;
    token: string;
}

export const RegisterClient = new JsonEventType<RegisterClient>(1);
export const Connected = new JsonEventType<{}>(2);
export const Disconnected = new JsonEventType<{}>(3);