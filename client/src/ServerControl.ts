import { Client } from "./networking/Client";
import { ClientParams } from "./networking/EventWire";
import { SimpleEventEmitter, EventType, Event } from "./reactors/SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";

import * as events from './eventTypes';


import * as protocol_root from './proto';
import proto = protocol_root.mozaic.protocol;
import { RequestHandler } from "./reactors/utils";


export class ServerControl {
    private client: Client;
    private handler: SimpleEventEmitter;

    private requestCounter: number;
    creationHandler: RequestHandler<events.MatchCreated>;

    constructor(params: ClientParams) {
        this.handler = new SimpleEventEmitter();
        this.client = new Client(params, this.handler);
        this.creationHandler = new RequestHandler(events.MatchCreated);
        this.creationHandler.register(this.handler);
        this.requestCounter = 0;
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
        this.requestCounter += 1;
        const requestId = this.requestCounter;

        const event = events.CreateMatch.create({
            requestId,
            controlToken,
        });
        this.send(event);
        return this.creationHandler.responseFor(requestId);
    }
}