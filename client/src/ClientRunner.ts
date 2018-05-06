import { PlayerData } from "./MatchRunner";
import { BotConfig } from "./BotRunner";
import { Address, Client } from "./index";
import * as fs from 'fs';
import { Logger } from "./Logger";
import { SignalDispatcher, ISignal } from "ste-signals";
import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";

export interface ClientRunnerParams {
    clients: ClientData[];
    address: Address;
    logFile: string;
}

export interface ClientData {
    botConfig: BotConfig;
    token: string;
    number: number;
}

export class ClientRunner {
    readonly clients: Client[];

    private runningClients = 0;

    private _onComplete = new SignalDispatcher();
    private _onError = new SimpleEventDispatcher<Error>();

    constructor(params: ClientRunnerParams) {
        const log = fs.createWriteStream(params.logFile);

        this.clients = params.clients.map((playerData) => {
            const logger = new Logger(playerData.number, log);
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
            this.runningClients += 1;
            client.onExit.subscribe(() => this.onClientExit());
            client.onError.subscribe((err) => this._onError.dispatch(err));
        });
    }

    public get onComplete() {
        return this._onComplete.asEvent();
    }

    public get onError() {
        return this._onError.asEvent();
    }

    private onClientExit() {
        this.runningClients -= 1;
        if (this.runningClients === 0) {
            this._onComplete.dispatch();
        }
    }
}