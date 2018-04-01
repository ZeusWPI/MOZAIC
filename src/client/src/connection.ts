import * as protocol_root from './proto';
const proto = protocol_root.mozaic.protocol;
import * as net from 'net';
import * as protobufjs from 'protobufjs/minimal';
import * as stream from 'stream';
import * as Promise from 'bluebird';
import { EventEmitter } from 'events';



export class Address {
    readonly host: string;
    readonly port: number;

    public constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
    }

    public connect() : Promise<net.Socket> {
        return new Promise((resolve, reject) => {
            let socket = net.connect({
                host: this.host,
                port: this.port,
            });

            socket.on('connect', () => resolve(socket));
            socket.on('error', e => reject(e));
        });
    }
}

enum ConnectionState {
    CONNECTING,
    CONNECTED,
    CLOSED,
};


export class Connection extends EventEmitter {
    private token: Buffer;
    private state: ConnectionState;
    private socket: net.Socket;
    
    public constructor(socket: net.Socket, token: Buffer) {
        super();
        this.token = token;
        this.socket = socket;
        this.state = ConnectionState.CONNECTING;
        socket.on('data', (buf) => this.onData(buf));
        this.connect();
    }

    private connect() {
        this.state = ConnectionState.CONNECTING;
        let request = proto.ConnectRequest.create({ token: this.token });
        let bytes = proto.ConnectRequest.encodeDelimited(request).finish();
        this.socket.write(bytes);
    }

    private readMessage(reader: protobufjs.BufferReader) {
        switch (this.state) {
            case ConnectionState.CONNECTING: {
                let response = proto.ConnectResponse.decodeDelimited(reader);
                this.state = ConnectionState.CONNECTED;
                this.emit('connected');
                break;
            }
            case ConnectionState.CONNECTED: {
                let packet = proto.ClientMessage.decodeDelimited(reader);
                if (packet.gameData) {
                    this.emit('message', packet.gameData.data);
                }
                break;
            }
            case ConnectionState.CLOSED: {
                // TODO
                break;
            }
        }
    }

    private onData(buf: Buffer) {
        console.log(buf);
        let reader = new protobufjs.BufferReader(buf);
        while (reader.pos < reader.len) {
            console.log(`${reader.pos} of ${reader.len}`);
            this.readMessage(reader);
        }
        console.log(`${reader.pos} of ${reader.len}`);
    }
}