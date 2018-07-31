import * as protocol_root from './proto';
import ProtoEvent = protocol_root.mozaic.protocol.Event;

import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";
import { ISignal } from "ste-signals";
import { Connection, ClientParams } from "./Connection";

export interface WireEvent {
    typeId: number,
    data: Uint8Array,
}

export class EventChannel {
    private connection: Connection;

    private _onEvent = new SimpleEventDispatcher<WireEvent>();

    constructor(params: ClientParams) {
        this.connection = new Connection(params);

        this.connection.onMessage.subscribe((bytes) => {
            const { typeId, data } = ProtoEvent.decode(bytes);
            this._onEvent.dispatch({ typeId, data });
        });
    }

    public connect() {
        this.connection.connect();
    }

    public disconnect() {
        this.connection.close();
    }

    public sendEvent(event: any) {
        const eventType = event.constructor as any;
        const typeId = eventType.typeId;
        if (!typeId) {
            throw new Error("invalid event");
        }
        const data = eventType.encode(event).finish();

        this.sendWireEvent({ typeId, data });
    }

    public sendWireEvent(event: WireEvent) {
        let protoEvent = ProtoEvent.create(event);
        const encoded = ProtoEvent.encode(protoEvent).finish();
        this.connection.send(encoded);
    }

    public get onEvent() {
        return this._onEvent.asEvent();
    }

    public get onConnect() {
        return this.connection.onConnect;
    }

    public get onDisconnect() {
        return this.connection.onClose;
    }
}