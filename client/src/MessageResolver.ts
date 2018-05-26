import * as protocol_root from './proto';
import ProtoMessage = protocol_root.mozaic.protocol.Message;
import IMessage = protocol_root.mozaic.protocol.IMessage;
import { Connection } from './index';
import { Client } from './Client';
import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events';

interface PromiseHandle {
    resolve: (data: Uint8Array) => void;
    reject: (err: Error) => void;
}
type PromiseHandles = { [messageId: number]: PromiseHandle };

export interface Message {
    messageId: number;
    data: Uint8Array;
}

export interface Transport {
    send: (data: Uint8Array) => void;
    onMessage: ISimpleEvent<Uint8Array>;
}

export class MessageResolver {
    private messageCounter: number;
    private promiseHandles: PromiseHandles;
    private transport: Transport;

    private _onMessage = new SimpleEventDispatcher<Message>();

    constructor(transport: Transport) {
        this.messageCounter = 0;
        this.promiseHandles = {};
        this.transport = transport;
        transport.onMessage.subscribe((msg) => this.handleMessage(msg));
    }

    public sendMessage(data: Uint8Array) {
        this._sendMessage(data);
    }

    public sendResponse(messageId: number, data: Uint8Array) {
        let response = ProtoMessage.Response.create({ messageId, data });
        const encoded = ProtoMessage.encode({ response }).finish();
    }

    public request(data: Uint8Array): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            let messageId = this._sendMessage(data);
            this.promiseHandles[messageId] = { resolve, reject };
        });
    }

    public get onMessage() {
        return this._onMessage.asEvent();
    }

    private _sendMessage(data: Uint8Array): number {
        const messageId = this.messageCounter;
        this.messageCounter += 1;

        const message = ProtoMessage.Message.create({ messageId, data });
        const encoded = ProtoMessage.encode({ message }).finish();
        this.transport.send(encoded);
        return messageId;
    }

    public handleMessage(data: Uint8Array) {
        let m = ProtoMessage.decode(data);

        if (m.message) {
           this._handleMessage(m.message);
        } else if (m.response) {
            this._handleResponse(m.response);
        }
    }


    private _handleMessage(msg: ProtoMessage.IMessage) {
        if (!msg.messageId || !msg.data) { return };
        this._onMessage.dispatch({
            messageId: Number(msg.messageId),
            data: msg.data,
        });
    }

    private _handleResponse(response: ProtoMessage.IResponse) {
        if (!response.messageId || !response.data) { return; }
        const messageId = Number(response.messageId);
        const handle = this.promiseHandles[messageId];

        if (!handle) {
            // TODO: log this
            return;
        }

        handle.resolve(response.data);
        delete this.promiseHandles[messageId];
    }
}