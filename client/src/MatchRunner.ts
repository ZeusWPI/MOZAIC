import { ServerRunner } from "./ServerRunner";
import { ClientRunner, ClientData } from "./ClientRunner";
import { BotConfig, Address } from "./index";
import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";
import { SignalDispatcher, ISignal } from "ste-signals";

export interface MatchParams {
    players: PlayerData[];
    mapFile: string;
    maxTurns: number;
    address: Address;
    logFile: string;
}

export interface PlayerData {
    name: string;
    token: string;
    number: number;
    botConfig?: BotConfig;
}

export class MatchRunner {
    private serverRunner: ServerRunner;
    private clientRunner: ClientRunner;

    private _onComplete = new SignalDispatcher();
    private _onError = new SimpleEventDispatcher<Error>();

    constructor(serverPath: string, params: MatchParams) {
        this.serverRunner = new ServerRunner(serverPath, params);

        const { address, logFile } = params;
        let clients: ClientData[] = [];
        params.players.forEach((playerData) => {
            const { botConfig, token, number } = playerData;
            if (botConfig) {
                clients.push({ botConfig, token, number });
            }
        });
        this.clientRunner = new ClientRunner({
            clients,
            address,
            logFile,
        });

        this.serverRunner.onExit.subscribe(() => {
            this._onComplete.dispatch()
        });
        this.serverRunner.onError.subscribe((err) => {
            this._onError.dispatch(err);
        });
        // TODO: is this desired behaviour?
        this.clientRunner.onError.subscribe((err) => {
            this._onError.dispatch(err);
        })
    }

    public run() {
        this.serverRunner.runServer();
        // run clients after a second, so that we are certain the server has
        // started.
        setTimeout(() => {
            this.clientRunner.run();
        }, 1000);
    }

    public get onComplete() {
        return this._onComplete.asEvent();
    }

    public get onError() {
        return this._onError.asEvent();
    }
}
