import * as protocol_root from './proto';
import proto = protocol_root.mozaic.protocol;
import Packet = proto.Packet;

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

export interface Address {
    host: string;
    port: number;
}

enum ConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    CLOSED,
};

export class Connection {
    private state: ConnectionState;
    private token: Buffer;
    private stream: ProtobufStream;

    private _onConnect = new SignalDispatcher();
    private _onMessage = new SimpleEventDispatcher<Uint8Array>();
    private _onError = new SimpleEventDispatcher<Error>();
    private _onClose = new SignalDispatcher();
    
    public constructor(token: Buffer) {
        this.state = ConnectionState.DISCONNECTED;
        this.stream = new ProtobufStream();
        this.token = token;

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
    
    public get onMessage() {
        return this._onMessage.asEvent();
    }
    
    public get onError() {
        return this._onError.asEvent();
    }
    
    public get onClose() {
        return this._onClose.asEvent();
    }
    
    public connect(host: string, port: number) {
        this.state = ConnectionState.CONNECTING;
        this.stream.connect(host, port);
    }

    public send(data: Uint8Array) {
        // TODO: maybe ensure that the connection handshake has completed here
        let message = Packet.Message.create({ data });
        let packet = Packet.create({ message });
        this.stream.write(Packet.encode(packet));
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
        let request = proto.ConnectionRequest.create({ token: this.token });
        this.stream.write(proto.ConnectionRequest.encode(request));
    }

    private handleConnectionResponse(message: Uint8Array) {
        let response = proto.ConnectionResponse.decode(message);
        switch (response.response) {
            case 'success': {
                this.state = ConnectionState.CONNECTED;
                this._onConnect.dispatch();
                break;
            }
            case 'error': {
                const error = response.error!;
                // TODO: should there be a special error state?
                this.state = ConnectionState.CLOSED;;
                // TODO this is not particulary nice
                const err = new Error(error.message!);
                this._onError.dispatch(err);
                break;
            }
        }
    }

    private handlePacket(data: Uint8Array) {
        const packet = Packet.decode(data);

        if (packet.message) {
            this._onMessage.dispatch(packet.message.data!);
        }
        // TODO: other options
    }
}