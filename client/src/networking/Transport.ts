import { TcpStreamHandler } from "./TcpStreamHandler";
import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;
import { Connection } from "./Connection";
import { SignalDispatcher, ISignal } from "ste-signals";
import { Handshaker } from "./Handshaker";


export enum TransportState {
    DISCONNECTED,
    HANDSHAKING,
    CONNECTED,
    FINISHED,
    ERROR,
};

export class Transport {
    private channelNum: number;
    private state: TransportState;
    private stream: TcpStreamHandler;

    private handshaker: Handshaker;

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

        // TODO: get rid of this
        this.handshaker = new Handshaker(this, connection);
    }

    public connect(message: Uint8Array) {
        this.state = TransportState.HANDSHAKING;
        this.handshaker.initiate(message)
            .then(() => {
                this.state = TransportState.CONNECTED;
                this.connection.connect(this);
            })
            .catch((err) => {
                this.state = TransportState.ERROR;
                throw err;
            })
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

    public handleMessage(data: Uint8Array) {
        switch (this.state) {
            case TransportState.HANDSHAKING: {
                this.handshaker.handleMessage(data);
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

    public sendFrame(data: Uint8Array) {
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