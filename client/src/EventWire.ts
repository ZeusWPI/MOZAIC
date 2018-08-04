import * as protocol_root from './proto';
import proto = protocol_root.mozaic.protocol;

import * as net from 'net';
import * as stream from 'stream';

import {
    SimpleEventDispatcher,
    SignalDispatcher,
    ISignal,
    ISimpleEvent,
} from 'strongly-typed-events';

import { BufferWriter, BufferReader } from 'protobufjs/minimal';
import { read } from 'fs';
import { ProtobufReader, ProtobufStream } from './ProtobufStream';
import { execFileSync } from 'child_process';

export interface Address {
    host: string;
    port: number;
}

export interface ClientParams {
    host: string;
    port: number;
    token: Uint8Array;
}

enum ConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    CLOSED,
};

export interface WireEvent {
    typeId: number,
    data: Uint8Array,
}

export class EventWire {
    private state: ConnectionState;
    private stream: ProtobufStream;

    private params: ClientParams;

    private _onConnect = new SignalDispatcher();
    private _onDisconnect = new SignalDispatcher();
    private _onEvent = new SimpleEventDispatcher<WireEvent>();
    private _onError = new SimpleEventDispatcher<Error>();
    private _onClose = new SignalDispatcher();
    
    public constructor(params: ClientParams) {
        this.state = ConnectionState.DISCONNECTED;
        this.stream = new ProtobufStream();
        this.params = params;

        this.stream.onConnect.subscribe(() => {
            this.sendConnectionRequest();
        });
        this.stream.onClose.subscribe(() => {
            this._onClose.dispatch();
        });
        this.stream.onMessage.subscribe((data) => {
            this.handleMessage(data);
        })
    }

    public get onConnect() {
        return this._onConnect.asEvent();
    }

    public get onDisconnect() {
        return this._onDisconnect.asEvent();
    }
    
    public get onEvent() {
        return this._onEvent.asEvent();
    }
    
    public get onError() {
        return this._onError.asEvent();
    }
    
    public get onClose() {
        return this._onClose.asEvent();
    }
    
    public connect() {
        this.state = ConnectionState.CONNECTING;
        this.stream.connect(this.params.host, this.params.port);

        // Introduced in version 9.0.0, node.js has a strict politeness policy.
        // Needless to say, it would be really rude to just connect to somebody
        // without ever greeting them.
        // Therefore, we greet the user when connecting so that we are certain
        // that he has been properly greeted when establishing a connection.
        const user = execFileSync('whoami');
        console.log(`hello ${user.toString('utf-8')}`);
        
    }

    public close() {
        // TODO: implement this in a more reliable way
        // i.e. don't just leave
        this.stream.end();
    }

    public send(event: any) {
        let eventType = event.constructor as any;
        let typeId = eventType.typeId;
        if (!typeId) {
            throw "invalid event";
        }
        let data = eventType.encode(event).finish();
        this.sendWireEvent({ typeId, data });

    }

    public sendWireEvent(wireEvent: WireEvent) {
        // TODO: maybe ensure that the connection handshake has completed here
        let event = proto.Event.create(wireEvent);
        let packet = proto.Packet.create({ event });
        this.stream.write(proto.Packet.encode(packet));
    }

    private handleMessage(data: Uint8Array) {
        switch (this.state) {
            case ConnectionState.CONNECTING: {
                this.handleConnectionResponse(data);
                break;
            }
            case ConnectionState.CONNECTED: {
                this.handlePacket(data);
                break;
            }
        }
    }
    
    // initiate connection handshake
    private sendConnectionRequest() {
        let request = { token: this.params.token };
        this.stream.write(proto.ConnectionRequest.encode(request));
    }

    private handleConnectionResponse(message: Uint8Array) {
        let response = proto.ConnectionResponse.decode(message);
        if (response.success) {
            this.state = ConnectionState.CONNECTED;
            this._onConnect.dispatch();
        } else if (response.error) {
            // TODO: should there be a special error state?
            this.state = ConnectionState.CLOSED;;
            // TODO this is not particulary nice
            const err = new Error(response.error.message!);
            this._onError.dispatch(err);
        }
    }

    private handlePacket(data: Uint8Array) {
        const packet = proto.Packet.decode(data);

        if (packet.event) {
            const { typeId, data } = packet.event;
            // these values should be present according to protobuf3 spec
            this._onEvent.dispatch({
                typeId: typeId!,
                data: data!
            });
        }
        // TODO: other options
    }
}