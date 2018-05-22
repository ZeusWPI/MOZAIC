import * as protocol_root from './proto';
import Message = protocol_root.mozaic.protocol.Message;
import IMessage = protocol_root.mozaic.protocol.IMessage;
import { Connection } from './index';

export type MessageHandler =
    (data: Uint8Array) => Promise<Uint8Array> | void;

type ResponseHandlers = { [messageId: number]: (Uint8Array) => void };


export class RequestResolver {
    private connection: Connection;
    private messageCounter: number;
    private handler: MessageHandler;
    private response_handlers: ResponseHandlers;

    constructor(connection: Connection, handler: MessageHandler) {
        this.connection = connection;
        this.handler = handler;
        this.messageCounter = 0;
        this.response_handlers = {};

        this.onMessage = this.onMessage.bind(this);
        this.connection.onMessage.subscribe(this.onMessage);
    }

    public send(data: Uint8Array): number {
        let messageId = this.messageCounter;
        this.messageCounter += 1;
        
        let message = Message.Message.create({ messageId, data });
        this.sendMessage({ message });
        return messageId;
    }

    public request(data: Uint8Array): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            let messageId = this.send(data);
            this.response_handlers[messageId] = resolve;
        });
    }

    private onMessage(data: Uint8Array) {
        let msg = Message.decode(data);

        if (msg.message) {
            this.handleMessage(msg.message);
        } else if (msg.response) {
            this.handleResponse(msg.response);
        }
    }

    private handleMessage(msg: Message.IMessage) {
        if (!msg.messageId || ! msg.data) { return; }
        const messageId = Number(msg.messageId);
        const response = this.handler(msg.data);
        if (response) {
            response.then((resp) => this.sendResponse(messageId, resp));
        }
    }

    private handleResponse(response: Message.IResponse) {
        if (!response.messageId || !response.data) { return; }
        const messageId = Number(response.messageId);
        
        const handler = this.response_handlers[messageId]
        if (handler) {
            handler(response.data);
            delete this.response_handlers[messageId];
        }
    }

    private sendResponse(messageId: number, data: Uint8Array) {
        let response = Message.Response.create({ messageId, data });
        this.sendMessage({ response });
    }

    private sendMessage(message: IMessage) {
        let msg = Message.create(message);
        let buffer = Message.encode(msg).finish();
        this.connection.send(buffer);
    }
}