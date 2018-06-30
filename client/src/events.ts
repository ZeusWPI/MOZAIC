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

export interface RemoveClient {
    client_id: number;
}
export const RemoveClient = new JsonEventType<{}>(2);

export interface StartGame {
    map_path: string,
    max_turns: number,
}
export const StartGame = new JsonEventType<StartGame>(3);

export interface ClientConnected {
    client_id: number;
}
export const ClientConnected = new JsonEventType<ClientConnected>(4);

export interface ClientDisconnected {
    client_id: number;
}
export const ClientDisconnected = new JsonEventType<ClientDisconnected>(5);

export const LeaderConnected = new JsonEventType<{}>(10);
export const LeaderDisconnected = new JsonEventType<{}>(11);
export const FollowerConnected = new JsonEventType<{}>(12);
export const FollowerDisconnected = new JsonEventType<{}>(13);
