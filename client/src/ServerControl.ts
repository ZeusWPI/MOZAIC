import { Client } from "./networking/Client";
import { ClientParams } from "./networking/EventWire";
import { SimpleEventEmitter, EventType, Event } from "./reactors/SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";

import * as events from './eventTypes';


import * as protocol_root from './proto';
import proto = protocol_root.mozaic.protocol;


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
        let message = proto.GameserverConnect.encode({
            serverControl: {}
        }).finish();
        this.client.connect(message);
    }

    public disconnect() {
        this.client.exit();
    }

    public createMatch(controlToken: Uint8Array): Promise<events.MatchCreated>
    {
        const event = events.CreateMatch.create({
            requestId: 0,
            controlToken,
        });
        return this.client.request(event, events.MatchCreated);
    }
}