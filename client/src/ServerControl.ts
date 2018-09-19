import { Client } from "./networking/Client";
import { ClientParams } from "./networking/EventWire";
import { SimpleEventEmitter, EventType, Event } from "./reactors/SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";

import * as events from './eventTypes';


import * as protocol_root from './proto';
import proto = protocol_root.mozaic.protocol;
import { Handler } from "./reactors/RequestHandler";


export class ServerControl {
    private client: Client;


    constructor(params: ClientParams) {
        this.client = new Client(params);
    }

    public on<T>(eventType: EventType<T>, handler: Handler<T>) {
        this.client.on(eventType, handler);
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

    public createMatch(controlToken: Uint8Array)
        : Promise<events.CreateMatchResponse>
    {
        const request = events.CreateMatchRequest.create({
            controlToken,
        });
        return this.client.request(request, events.CreateMatchResponse);
    }
}