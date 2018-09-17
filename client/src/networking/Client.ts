import { ClientParams } from "./EventWire";
import { Event, EventType } from "../reactors/SimpleEventEmitter";
import { Handler } from "../reactors/RequestHandler";
import { Connection } from "./Connection";
import { TcpStreamHandler } from "./TcpStreamHandler";
import { encodeEvent } from "../reactors/utils";

export interface EventHandler {
    handleEvent: (any) => void;
    handleWireEvent: (WireEvent) => void;
}

export class Client {
    private connection: Connection;

    constructor(secretKey: Uint8Array, remotePublicKey?: Uint8Array) {
        this.connection = new Connection(secretKey, remotePublicKey);
    }

    public on<T>(eventType: EventType<T>, handler: Handler<T>) {
        this.connection.on(eventType, handler);
    }

    // TODO: should this be a method on Client?
    public connect(tcpStream: TcpStreamHandler, message: Uint8Array) {
        tcpStream.openChannel(message, this.connection);
    }

    public exit() {
        // TODO: clean termination
        this.connection.requestClose();
    }

    public send(event: Event) {
        const request = encodeEvent(event);
        this.connection.request(request);
    }

    public request<T>(event: Event, responseType: EventType<T>): Promise<T> {
        const request = encodeEvent(event);
        return this.connection.request(request, responseType);
    }
}