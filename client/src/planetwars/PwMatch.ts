import { Reactor } from "../reactors/Reactor";
import { Client } from "../networking/Client";
import { EventType, Event, SimpleEventEmitter } from "../reactors/SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";
import { ClientParams } from "../networking/EventWire";
import { Logger } from "../Logger";
import * as events from "../eventTypes";

import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;
import { TcpStreamHandler } from "../networking/TcpStreamHandler";

export type MatchParams = {
    matchUuid: Uint8Array;
}

// TODO: create matchclient base class
// TODO: create match owner base class
export class PwMatch {
    private reactor: Reactor;
    readonly client: Client;
    private matchUuid: Uint8Array;

    constructor(params: MatchParams, logger: Logger) {
        this.reactor = new Reactor(logger);
        this.client = new Client();
        this.matchUuid = params.matchUuid;

        this.client.on(events.MatchEvent, (e) => {
            this.reactor.handleWireEvent(e);
        });
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.reactor.on(eventType);
    }

    public send(event: Event) {
        this.client.send(event);
    }

    public connect(tcpStream: TcpStreamHandler) {
        let message = proto.GameserverConnect.encode({
            client: {
                clientId: 0,
                matchUuid: this.matchUuid,
            }
        }).finish();
        this.client.connect(tcpStream, message);
    }

    public createClient(token: Uint8Array): Promise<events.CreateClientResponse>
    {
        const request = events.CreateClientRequest.create({
            token
        });
        return this.client.request(request, events.CreateClientResponse);
    }
}