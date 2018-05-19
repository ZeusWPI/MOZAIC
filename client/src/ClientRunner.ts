import { PlayerData } from "./MatchRunner";
import { BotConfig } from "./BotRunner";
import { Address, Client } from "./index";
import { Logger, ClientLogger } from "./Logger";
import { SignalDispatcher, ISignal } from "ste-signals";
import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";

export interface ClientRunnerParams {
    clients: ClientData[];
    address: Address;
    logger: Logger;
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
        this.clients = params.clients.map((playerData) => {
            const clientLogger = new ClientLogger(params.logger, playerData.number);
            const { token, botConfig } = playerData;
            const connData = {
                address: params.address,
                token: Buffer.from(token, 'hex'),
            };
            return new Client(connData, botConfig, clientLogger);
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