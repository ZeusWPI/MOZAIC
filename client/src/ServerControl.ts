import { Client } from "./networking/Client";
import { ClientParams } from "./networking/EventWire";
import { SimpleEventEmitter, EventType, Event } from "./reactors/SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";

import * as events from './eventTypes';


import * as protocol_root from './proto';
import proto = protocol_root.mozaic.protocol;
import { ResponseEmitter } from "./reactors/ResponseEmitter";


export class ServerControl {
    private client: Client;
    private handler: ResponseEmitter;


    constructor(params: ClientParams) {
        this.handler = new ResponseEmitter();
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

    public createMatch(controlToken: Uint8Array): Promise<events.MatchCreated> {
        const requestId = this.client.nextRequestId();;

        this.send(events.CreateMatch.create({
            requestId,
            controlToken,
        }));
        return this.handler
            .resolver(events.MatchCreated)
            .responseFor(requestId);
    }
}