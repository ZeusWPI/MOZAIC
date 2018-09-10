    import { ProtobufStream } from "./ProtobufStream";
import { ClientParams } from "./EventWire";
import { Connection, Payload } from "./Connection";

import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;
import { SignalDispatcher, ISignal } from "ste-signals";
import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";


export enum TransportState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    CLOSED,
};


export class Transport {
    state: TransportState;
    stream: ProtobufStream;

    connection: Connection;

    lastSeqSent: number;
    lastAckSent: number;

    params: ClientParams;

    private _onConnect = new SignalDispatcher();
    private _onDisconnect = new SignalDispatcher();
    private _onError = new SimpleEventDispatcher<Error>();
    private _onClose = new SignalDispatcher();


    // TODO: dont use clientparams
    constructor(params: ClientParams, connection: Connection) {
        this.state = TransportState.DISCONNECTED;
        this.stream = new ProtobufStream();
        this.lastSeqSent = 0;
        this.lastAckSent = 0;

        this.connection = connection;

        this.params = params;

        this.stream.onMessage.subscribe((data) => {
            this.handleMessage(data);
        });
    }
        
    public connect(message: Uint8Array) {
        this.state = TransportState.CONNECTING;
        this.stream.connect(this.params.host, this.params.port);

        this.stream.onConnect.one(() => {
            this.sendConnectionRequest(message);
        });

        this.stream.onClose.one(() => {
            console.log('disconnect');
            if (!this.connection.isFinished()) {
                console.log('CONNECTION WAS NOT FINISHED');
            }
        });
    }

    public send(packet: proto.Packet) {
        console.log(`sending ${JSON.stringify(packet.toJSON())}`);
        this.lastSeqSent = packet.seqNum;
        this.lastAckSent = packet.ackNum;
        this.stream.write(proto.Packet.encode(packet));
    }

    public sendAck() {
        const packet = proto.Packet.create({
            seqNum: this.connection.seqNum,
            ackNum: this.connection.ackNum,
        });
        this.send(packet);
    }

    public get onConnect() {
        return this._onConnect.asEvent();
    }

    public get onDisconnect() {
        return this._onDisconnect.asEvent();
    }
        
    public get onError() {
        return this._onError.asEvent();
    }
    
    public get onClose() {
        return this._onClose.asEvent();
    }

    public exit() {
        this.stream.end();
    }

    // initiate connection handshake
    private sendConnectionRequest(message: Uint8Array) {
        let connRequest = {
            message,
            token: this.params.token,
        };
        this.stream.write(proto.ConnectionRequest.encode(connRequest));
    }

    private handleConnectionResponse(message: Uint8Array) {
        let response = proto.ConnectionResponse.decode(message);
        if (response.success) {
            this.state = TransportState.CONNECTED;
            this.connection.connect(this);
        } else if (response.error) {
            // TODO: should there be a special error state?
            this.state = TransportState.CLOSED;;
            // TODO this is not particulary nice
            const err = new Error(response.error.message!);
            this._onError.dispatch(err);
        }
    }

    private handleMessage(data: Uint8Array) {
        switch (this.state) {
            case TransportState.CONNECTING: {
                this.handleConnectionResponse(data);
                break;
            }
            case TransportState.CONNECTED: {
                const packet = proto.Packet.decode(data);
                console.log(`received ${JSON.stringify(packet.toJSON())}`);
                this.connection.handlePacket(packet);
                
                if (this.lastSeqSent == this.connection.seqNum
                    && this.lastAckSent < this.connection.ackNum)
                {
                    this.sendAck();
                }
                break;
            }
        }
    }
}