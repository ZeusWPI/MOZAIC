import * as protocol_root from './proto';
import Message = protocol_root.mozaic.protocol.Message;
import { BotRunner, BotConfig } from "./BotRunner";
import { Connection, Address } from "./Connection";
import { Socket } from 'net';
import { BufferWriter } from 'protobufjs';
import { Logger } from './Logger';
import { TextDecoder } from 'text-encoding';
import { GameState } from './PwLog';

export interface ConnectionData {
    token: Buffer,
    address: Address,
}

export interface Request {
    requestId: number;
    data: Buffer;
}

// TODO: expand this
enum ClientState {
    CONNECTING,
    CONNECTED,
};


export class Client {
    readonly connection: Connection;
    readonly botRunner: BotRunner;
    readonly requestQueue: (number | Long)[];
    readonly logger: Logger;
    private turnNum: 0;
    private state: ClientState;

    constructor(connData: ConnectionData, botConfig: BotConfig, logger: Logger) {
        this.connection = new Connection(connData.address, connData.token);
        this.botRunner = new BotRunner(botConfig);
        this.logger = logger;
        this.requestQueue = [];
        this.state = ClientState.CONNECTING;
        this.initHandlers();
        this.turnNum = 0;
    }

    public run() {
        this.connection.connect();
        this.botRunner.run();
    }

    public handleBotMessage(message: Uint8Array) {
        this.logger.log({
            "type": "command",
            "content": new TextDecoder('utf-8').decode(message),
        });
        let requestId = this.requestQueue.shift();
        if (requestId) {
            this.sendResponse(requestId, message);
        }
    }

    public handleServerMessage(data: Uint8Array) {
        let message = Message.decode(data);
        switch (message.payload) {
            case 'message': {
                this.handleMessage(message.message!);
                break;
            }
            case 'response': {
                this.handleResponse(message.response!);
                break;
            }
        }
    }

    public handleResponse(response: Message.IResponse) {
        // TODO
    }

    public handleMessage(message: Message.IMessage) {
        let messageId = message.messageId! as number;
        this.onServerMessage(messageId, message.data!);
    }

    public onServerMessage(messageId: number | Long, data: Uint8Array) {
        switch (this.state) {
            case ClientState.CONNECTING: {
                let hello = Buffer.from("hello", 'utf-8');
                this.sendResponse(messageId, hello);
                this.state = ClientState.CONNECTED;
                break;
            }
            case ClientState.CONNECTED: {
                // got a game state
                this.turnNum += 1;
                const msg = new TextDecoder('utf-8').decode(data);
                let state: GameState = JSON.parse(msg);
                let log_entry = { 'state': state };

                this.logger.log({
                    "type": 'step',
                    "turn_number": this.turnNum,
                    "state": state,
                });

                this.requestQueue.push(messageId);
                this.botRunner.sendMessage(data);
                break;
            }
        }
    }

    public sendResponse(messageId: number | Long, data: Uint8Array) {
        let response = Message.Response.create({ messageId, data });
        let message = Message.create({ response });
        let buffer = Message.encode(message).finish();
        this.connection.send(buffer);
    }

    private initHandlers() {
        this.botRunner.on('message', (message: Uint8Array) => {
            this.handleBotMessage(message);
        });

        this.connection.on('message', (message: Uint8Array) => {
            this.handleServerMessage(message);
        });

        this.connection.on('close', () => {
            this.botRunner.killBot();
        })
    }
}