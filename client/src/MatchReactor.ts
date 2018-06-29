import * as protocol_root from './proto';
import ProtoEvent = protocol_root.mozaic.protocol.Event;
import { ProtobufStream } from "./ProtobufStream";
import { Reactor, STEReactor, AnyEvent, EventType, WireEvent } from "./reactor";
import { ISimpleEvent } from 'ste-simple-events';
import { Connection, ClientParams } from './Connection';


export class MatchReactor {
    private connection: Connection;
    private reactor: STEReactor;

    constructor(clientParams: ClientParams) {
        this.reactor = new STEReactor();
        this.connection = new Connection(clientParams);

        this.connection.onMessage.subscribe((bytes) => {
            const { typeId, data } = ProtoEvent.decode(bytes);
            this.reactor.handleWireEvent(new WireEvent(typeId, data));
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
        const data = ProtoEvent.encode(wireEvent).finish();
        this.connection.send(data);
    }

    public get onConnect() {
        return this.connection.onConnect;
    }
}