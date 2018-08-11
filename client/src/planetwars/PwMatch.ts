import { Reactor } from "../reactors/Reactor";
import { Client } from "../networking/Client";
import { EventType } from "../reactors/SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";
import { ClientParams } from "../networking/EventWire";

export class PwMatch {
    private reactor: Reactor;
    private client: Client;

    constructor(params: ClientParams) {
        this.reactor = new Reactor();
        this.client = new Client(params, this.reactor);
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.reactor.on(eventType);
    }

    // TODO: maybe this should be named differently because the event
    // is sent to the server, not handled.
    public dispatch(event: any) {
        this.client.send(event);
    }

    public connect() {
        this.client.connect();
    }
}