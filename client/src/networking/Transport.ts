import { TcpStreamHandler } from "./TcpStreamHandler";
import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;
import { Connection } from "./Connection";
import { SignalDispatcher, ISignal } from "ste-signals";
import * as sodium from 'libsodium-wrappers';


export enum TransportState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    FINISHED,
    ERROR,
};

export class Transport {
    private channelNum: number;
    private state: TransportState;
    private stream: TcpStreamHandler;

    lastSeqSent: number;
    lastAckSent: number;
    connection: Connection;

    private _onFinish = new SignalDispatcher();


    constructor(
        stream: TcpStreamHandler,
        channelNum: number,
        connection: Connection,
        
    ) {
        this.channelNum = channelNum;
        this.state = TransportState.DISCONNECTED;
        this.stream = stream;
        this.connection = connection;

        // TODO: properly get these values or something
        this.lastSeqSent = 0;
        this.lastAckSent = 0;
    }

    public connect(message: Uint8Array) {
        this.state = TransportState.CONNECTING;
        this.sendConnectionRequest(message);
    }

    public send(packet: proto.Packet) {
        console.log(`sending ${JSON.stringify(packet.toJSON())}`);
        this.lastSeqSent = packet.seqNum;
        this.lastAckSent = packet.ackNum;
        this.sendFrame(proto.Packet.encode(packet).finish());
    }

    public sendAck() {
        const packet = proto.Packet.create({
            seqNum: this.connection.seqNum,
            ackNum: this.connection.ackNum,
        });
        this.send(packet);
    }

    private sendSignedMessage(data: Uint8Array) {
        const key = this.connection.secretKey;
        const signature = sodium.crypto_sign_detached(data, key);
        const encodedMessage = proto.SignedMessage.encode({
            data,
            signature,
        }).finish();
        this.sendFrame(encodedMessage);
    }

    private sendConnectionRequest(message: Uint8Array) {
        let encodedRequest = proto.ConnectionRequest.encode({ message }).finish();
        this.sendSignedMessage(encodedRequest);
    }

    private sendChallengeResponse(nonce: Uint8Array) {
        let encodedResponse = proto.ChallengeResponse.encode({ nonce }).finish();
        this.sendSignedMessage(encodedResponse);
    }

    private handleHandshakeMessage(message: Uint8Array) {
        let response = proto.HandshakeServerMessage.decode(message);
        if (response.challenge) {
            this.sendChallengeResponse(response.challenge.nonce!);
        } else if (response.connectionAccepted) {
            this.state = TransportState.CONNECTED;
            this.connection.connect(this);
        } else if (response.connectionRefused) {
            this.state = TransportState.ERROR;;
            // TODO this is not particulary nice
            throw new Error(response.connectionRefused.message!);
        }
    }

    public handleMessage(data: Uint8Array) {
        switch (this.state) {
            case TransportState.CONNECTING: {
                this.handleHandshakeMessage(data);
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
        
        if (this.connection.isFinished()) {
            this.finish();
        }
    }

    public close() {
        this.stream.closeChannel(this.channelNum);
    }

    public get onFinish(): ISignal {
        return this._onFinish.asEvent();
    }

    private sendFrame(data: Uint8Array) {
        this.stream.sendFrame({
            channelNum: this.channelNum,
            data,
        });
    }

    private finish() {
        this.state = TransportState.FINISHED;
        this.stream.closeChannel(this.channelNum);
        this._onFinish.dispatch();
    }
}