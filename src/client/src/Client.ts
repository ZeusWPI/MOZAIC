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

export class Client {
    readonly connection: Connection;
    // TODO: get rid of this
    readonly address: Address;
    readonly botRunner: BotRunner;

    constructor(connData: ConnectionData, botConfig: BotConfig) {
        this.connection = new Connection(connData.token);
        this.botRunner = new BotRunner(botConfig);
        this.address = connData.address;
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

    public handleBotMessage(message: string) {
        this.connection.sendMessage(Buffer.from(message, 'utf-8'));
    }

    public handleServerMessage(message: Buffer) {
        this.botRunner.sendMessage(message);
    }

    private initHandlers() {
        this.botRunner.on('message', (message: string) => {
            this.handleBotMessage(message);
        });

        this.connection.on('message', (message: Buffer) => {
            this.handleServerMessage(message);
        });

        this.connection.on('close', () => {
            this.botRunner.killBot();
        })
    }
}