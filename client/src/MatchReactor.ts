import * as protocol_root from './proto';
import WireEvent = protocol_root.mozaic.protocol.Event;
import { ProtobufStream } from "./ProtobufStream";
import { Reactor, STEReactor, AnyEvent, EventType } from "./reactor";
import { ISimpleEvent } from 'ste-simple-events';
import { Connection, ClientParams } from './Connection';


export class MatchReactor {
    private connection: Connection;
    private reactor: STEReactor;

    constructor(clientParams: ClientParams) {
        this.reactor = new STEReactor();
        this.connection = new Connection(clientParams);

        this.connection.onMessage.subscribe((data) => {
            const event = WireEvent.decode(data);
            this.reactor.handleWireEvent(event);
        });
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.reactor.on(eventType);
    }

    public connect() {
        this.connection.connect();
    }

    public dispatch(event: AnyEvent) {
        let wireEvent = {
            typeId: event.eventType.typeId,
            data: event.eventType.encode(event.data),
        };
        const data = WireEvent.encode(wireEvent).finish();
        this.connection.send(data);
    }
}