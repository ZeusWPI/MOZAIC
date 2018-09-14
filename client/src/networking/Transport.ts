import { TcpStreamHandler } from "./TcpStreamHandler";
import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;
import { Connection } from "./Connection";


export enum TransportState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    CLOSED,
};

export class Transport {
    private channelNum: number;
    private state: TransportState;
    private stream: TcpStreamHandler;

    lastSeqSent: number;
    lastAckSent: number;
    connection: Connection;


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

    public connect(message: Uint8Array, token: Uint8Array) {
        this.state = TransportState.CONNECTING;
        this.sendConnectionRequest(message, token);
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

    private sendConnectionRequest(message: Uint8Array, token: Uint8Array) {
        let connRequest = {
            message,
            token,
        };
        this.sendFrame(proto.ConnectionRequest.encode(connRequest).finish());
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
            throw new Error(response.error.message!);
        }
    }

    public handleMessage(data: Uint8Array) {
        console.log('got message');
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



    private sendFrame(data: Uint8Array) {
        this.stream.sendFrame({
            channelNum: this.channelNum,
            data,
        });
    }

}