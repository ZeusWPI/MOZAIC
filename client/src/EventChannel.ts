import * as protocol_root from './proto';
import ProtoEvent = protocol_root.mozaic.protocol.Event;

import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";
import { ISignal } from "ste-signals";
import { SomeEvent, WireEvent } from "./reactor";
import { Connection, ClientParams } from "./Connection";

export class EventChannel {
    private connection: Connection;

    private _onEvent = new SimpleEventDispatcher<SomeEvent>();

    constructor(params: ClientParams) {
        this.connection = new Connection(params);

        this.connection.onMessage.subscribe((bytes) => {
            const { typeId, data } = ProtoEvent.decode(bytes);
            let wireEvent = new WireEvent(typeId, data);
            this._onEvent.dispatch(wireEvent);
        });
    }

    public connect() {
        this.connection.connect();
    }

    public disconnect() {
        this.connection.close();
    }

    public dispatch(event: SomeEvent) {
        let wireEvent = event.toWireEvent();
        const encoded = ProtoEvent.encode(wireEvent).finish();
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