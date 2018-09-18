import { TcpStreamHandler } from "./TcpStreamHandler";
import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;
import { Connection } from "./Connection";
import { SignalDispatcher, ISignal } from "ste-signals";
import { Handshaker } from "./Handshaker";

import * as sodium from 'libsodium-wrappers';


export enum TransportState {
    DISCONNECTED,
    HANDSHAKING,
    CONNECTED,
    FINISHED,
    ERROR,
};

// TODO: split this into a handshaking and transport step
export class Transport {
    private channelNum: number;
    private state: TransportState;
    private stream: TcpStreamHandler;

    private handshaker: Handshaker;
    private encryptor?: Encryptor;

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
            .then((sessionKeys) => {
                this.state = TransportState.CONNECTED;
                this.encryptor = new Encryptor(sessionKeys);
                this.connection.connect(this);
            })
            .catch((err) => {
                this.state = TransportState.ERROR;
                throw err;
            })
    }

    public send(packet: proto.Packet) {
        this.lastSeqSent = packet.seqNum;
        this.lastAckSent = packet.ackNum;

        let bytes = this.encryptor!.encrypt_packet(packet);
        this.sendFrame(bytes);
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
                const packet = this.encryptor!.decrypt_packet(data);
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

// TODO: document this better
export class Encryptor {
    private keys: sodium.CryptoKX;
    private sendNonce: Uint8Array;

    constructor(keys: sodium.CryptoKX) {
        this.keys = keys;
        this.sendNonce = sodium.randombytes_buf(
            sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES
        );
    }

    public encrypt_packet(packet: proto.Packet): Uint8Array {
        let data = proto.Packet.encode(packet).finish();

        // make sure the nonce is fresh
        sodium.increment(this.sendNonce);

        let encrypted = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
            data,                           // data
            null,                           // additional data
            null,                           // secret nonce (not used)
            this.sendNonce,                 // public nonce
            this.keys.sharedTx,             // key
        );
        
        return proto.EncryptedPacket.encode({
            nonce: this.sendNonce,
            data: encrypted,
        }).finish();
    }

    public decrypt_packet(data: Uint8Array) : proto.Packet {
        let encryptedPacket = proto.EncryptedPacket.decode(data);
        let decrypted = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
            null,                           // secret nonce (not used)
            encryptedPacket.data,           // data
            null,                           // additional data
            encryptedPacket.nonce,          // public nonce
            this.keys.sharedRx,             // key
        );
        return proto.Packet.decode(decrypted);
    }
}