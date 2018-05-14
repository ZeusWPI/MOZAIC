import * as protocol_root from './proto';
import Message = protocol_root.mozaic.protocol.Message;
import { Connection } from './index';

export type MessageHandler =
    (data: Uint8Array) => Promise<Uint8Array> | void;

export class RequestResolver {
    private connection: Connection;
    private handler: MessageHandler;

    constructor(connection: Connection, handler: MessageHandler) {
        this.connection = connection;
        this.handler = handler;

        this.onMessage = this.onMessage.bind(this);
        this.connection.onMessage.subscribe(this.onMessage);
    }

    public request(data: Uint8Array): Promise<Uint8Array> {
        // TODO
        throw new Error("not implemented");
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
        const messageId = msg.messageId!;
        const response = this.handler(msg.data!);
        if (response) {
            response.then((resp) => this.sendResponse(messageId, resp));
        }
    }

    private handleResponse(response: Message.IResponse) {
        // TODO
        throw new Error("not implemented");
    }

    private sendResponse(messageId: number | Long, data: Uint8Array) {
        let response = Message.Response.create({ messageId, data });
        let message = Message.create({ response });
        let buffer = Message.encode(message).finish();
        this.connection.send(buffer);
    }
}