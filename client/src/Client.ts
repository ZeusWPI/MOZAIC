import { BotRunner, BotConfig } from "./BotRunner";
import { Connection } from "./connection";
import { Socket } from 'net';

export interface ConnectionData {
    token: Buffer,
    address: Address,
}

export interface Address {
    host: string;
    port: number;
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
    // TODO: get rid of this
    readonly address: Address;
    readonly botRunner: BotRunner;
    readonly requestQueue: number[];
    private state: ClientState;

    constructor(connData: ConnectionData, botConfig: BotConfig) {
        this.connection = new Connection(connData.token);
        this.botRunner = new BotRunner(botConfig);
        this.address = connData.address;
        this.requestQueue = [];
        this.state = ClientState.CONNECTING;
        this.initHandlers();
    }

    public run() {
        let socket = new Socket();
        socket.once('connect', () => {
            this.connection.connect(socket);
        });
        socket.connect(this.address.port, this.address.host);
        this.botRunner.run();
    }

    public handleBotMessage(message: Buffer) {
        let requestId = this.requestQueue.shift();
        if (requestId) {
            this.connection.respond(requestId, message);
        }
    }

    public handleRequest(request: Request) {
        switch (this.state) {
            case ClientState.CONNECTING: {
                let hello = Buffer.from("hello", 'utf-8');
                this.connection.respond(request.requestId, hello);
                this.state = ClientState.CONNECTED;
                break;
            }
            case ClientState.CONNECTED: {
                this.requestQueue.push(request.requestId);
                this.botRunner.sendMessage(request.data);
                break;
            }
        }
    }

    private initHandlers() {
        this.botRunner.on('message', (message: Buffer) => {
            this.handleBotMessage(message);
        });

        this.connection.on('request', (request: Request) => {
            this.handleRequest(request);
        });

        this.connection.on('close', () => {
            this.botRunner.killBot();
        })
    }
}