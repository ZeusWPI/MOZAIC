import { Client } from "./networking/Client";
import { ClientParams } from "./networking/EventWire";
import { SimpleEventEmitter, EventType, Event } from "./reactors/SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";

import * as events from './eventTypes';
import * as crypto from 'crypto';


import * as protocol_root from './proto';
import proto = protocol_root.mozaic.protocol;
import { PwMatch } from "./planetwars/PwMatch";
import { resolve } from "url";


export class ServerControl {
    private client: Client;
    private handler: SimpleEventEmitter;

    private requestCounter: number;
    private creationCallbacks: {[requestId: number ]: Function};

    constructor(params: ClientParams) {
        this.handler = new SimpleEventEmitter();
        this.client = new Client(params, this.handler);
        this.creationCallbacks = {};
        this.requestCounter = 0;

        this.on(events.MatchCreated).subscribe((e) => {
            const callback = this.creationCallbacks[e.requestId];
            if (callback) {
                callback(e.matchUuid);
            }
        });
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

    public createMatch(controlToken: Uint8Array): Promise<Uint8Array> {
        this.requestCounter += 1;
        const requestId = this.requestCounter;

        const event = events.CreateMatch.create({
            requestId,
            controlToken,
        });

        return new Promise((resolve, reject) => {
            this.send(event);
            this.creationCallbacks[requestId] = resolve;
        });
    }
}