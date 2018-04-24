import * as protocol_root from './proto';
import proto = protocol_root.mozaic.protocol;
import Packet = proto.Packet;
import * as net from 'net';
import * as stream from 'stream';
import { EventEmitter } from 'events';
import { BufferWriter, BufferReader } from 'protobufjs/minimal';
import { read } from 'fs';

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

export class Connection extends EventEmitter {
    private state: ConnectionState;
    private token: Buffer;
    private address: Address;
    private socket: net.Socket;

    private recvBuffer: Buffer;
    
    public constructor(address: Address, token: Buffer) {
        super();
        this.state = ConnectionState.DISCONNECTED;
        this.address = address;
        this.token = token;
        this.recvBuffer = new Buffer(0);
        this.socket = new net.Socket();
        this.setCallbacks();
    }

    public connect() {
        this.state = ConnectionState.CONNECTING;
        // drop old receive buffer
        this.recvBuffer = new Buffer(0);
        this.socket.connect(this.address.port, this.address.host);
    }

    // initiate connection handshake
    private sendConnectionRequest() {
        let request = proto.ConnectionRequest.create({ token: this.token });
        this.writeMessage(proto.ConnectionRequest.encode(request));
    }

    public send(data: Uint8Array) {
        let message = Packet.Message.create({ data });
        let packet = Packet.create({ message });
        this.writeMessage(Packet.encode(packet));
    }

    private setCallbacks() {
        this.socket.on('connect', () => this.sendConnectionRequest());
        this.socket.on('data', (buf: Buffer) => this.readMessages(buf));
        this.socket.on('close', () => {
            this.state = ConnectionState.DISCONNECTED;
            this.emit('close');
        }); 
    }

    // write a write-op to the underlying socket.
    // it is illegal to call this when not connected.
    private writeMessage(write: BufferWriter) {
        let buf = write.ldelim().finish();
        this.socket.write(buf);
    }

    private handleMessage(buf: Buffer) {
        switch (this.state) {
            case ConnectionState.CONNECTING: {
                let response = proto.ConnectionResponse.decode(buf);
                if (response.success) {
                    this.state = ConnectionState.CONNECTED;
                    this.emit('connected');
                }
                if (response.error) {
                    // TODO: should there be a special error state?
                    this.state = ConnectionState.CLOSED;;
                    this.emit('error', response.error.message);
                }
                break;
            }
            case ConnectionState.CONNECTED: {
                let packet = Packet.decode(buf);
                if (packet.message) {
                    this.emit('message', packet.message.data!);
                }
                break;
            }
            case ConnectionState.DISCONNECTED: {
                throw new Error(
                    "tried reading from a disconnected connection"
                );
            }
            case ConnectionState.CLOSED: {
                throw new Error(
                    "tried reading from a closed connection"
                );
            }
        }
    }

    private readMessages(bytes: Buffer) {
        // Buffer.concat returns a new buffer, so the bytes are copied over
        // from recvBuffer, so that the old value becomes garbage.
        this.recvBuffer = Buffer.concat([this.recvBuffer, bytes]);

        let pos = 0;
        let reader = new BufferReader(this.recvBuffer);

        while (pos < this.recvBuffer.length) {
            let end: number;
            try {
                // try reading segment length at pos
                reader.pos = pos;
                let len = reader.uint32();
                end = reader.pos + len;
            } catch(err) {
                if (err instanceof RangeError) {
                    // range errors are due to incomplete data
                    break;
                } else {
                    // other errors are not supposed to happen
                    throw(err);
                }
            }

            if (end > this.recvBuffer.length) {
                // not enough data
                break;
            }

            // reader.pos is now at the first byte after the segment length
            let bytes = this.recvBuffer.slice(reader.pos, end);
            this.handleMessage(bytes);
            // advance position
            pos = end;
        }

        // set recvBuffer to a view of the current value to avoid realloc
        this.recvBuffer = this.recvBuffer.slice(pos);
    }
}