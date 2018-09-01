import { Client } from "./networking/Client";
import { ClientParams } from "./networking/EventWire";
import { SimpleEventEmitter, EventType, Event } from "./reactors/SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";

export class ServerControl {
    private client: Client;
    private handler: SimpleEventEmitter;

    constructor(params: ClientParams) {
        this.handler = new SimpleEventEmitter();
        this.client = new Client(params, this.handler);
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.handler.on(eventType);
    }

    public send(event: Event) {
        this.client.send(event);
    }

    public connect() {
        this.client.connect();
    }

    public disconnect() {
        this.client.exit();
    }
}