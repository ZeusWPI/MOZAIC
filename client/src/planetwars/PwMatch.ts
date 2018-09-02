import { Reactor } from "../reactors/Reactor";
import { Client } from "../networking/Client";
import { EventType } from "../reactors/SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";
import { ClientParams } from "../networking/EventWire";
import { Logger } from "../Logger";

import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;

// TODO: create matchclient base class
// TODO: create match owner base class
export class PwMatch {
    private reactor: Reactor;
    private client: Client;

    constructor(params: ClientParams, logger: Logger) {
        this.reactor = new Reactor(logger);
        this.client = new Client(params, this.reactor);
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.reactor.on(eventType);
    }

    public send(event: any) {
        this.client.send(event);
    }

    public connect(matchUuid: Uint8Array) {
        let message = proto.GameserverConnect.encode({
            client: {
                clientId: 0,
                matchUuid: matchUuid,
            }
        }).finish();
        this.client.connect(message);
    }
}