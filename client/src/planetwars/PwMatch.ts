import { Reactor } from "../reactors/Reactor";
import { Client } from "../networking/Client";
import { EventType } from "../reactors/SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";

export class PwMatch {
    private reactor: Reactor;
    private client: Client;

    constructor(params) {
        this.reactor = new Reactor();
        this.client = new Client(params, this.reactor);
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.reactor.on(eventType);
    }

    public dispatch(event: any) {
        this.client.send(event);
    }
}