import { PlayerData } from "./MatchRunner";
import { BotConfig } from "./BotRunner";
import { Address, Client } from "./index";
import * as fs from 'fs';
import { Logger } from "./Logger";

export interface ClientRunnerParams {
    clients: ClientData[];
    address: Address;
    logFile: string;
}

export interface ClientData {
    botConfig: BotConfig;
    token: string;
}

export class ClientRunner {
    readonly clients: Client[];

    constructor(params: ClientRunnerParams) {
        const log = fs.createWriteStream(params.logFile);

        this.clients = params.clients.map((playerData, idx) => {
            const logger = new Logger(idx, log);
            const { token, botConfig } = playerData;
            const connData = {
                address: params.address,
                token: Buffer.from(token, 'hex'),
            };
            return new Client(connData, botConfig, logger);
        });
    }

    public run() {
        this.clients.forEach((client) => {
            client.run(); 
        });
    }
}