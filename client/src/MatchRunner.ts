import { ServerRunner } from "./ServerRunner";
import { BotConfig, Address, Connection } from "./index";
import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";
import { SignalDispatcher, ISignal } from "ste-signals";
import { GameState } from "./PwTypes";
import { Logger } from "./Logger";

import * as protocol_root from './proto';
import proto = protocol_root.mozaic.protocol;
import LobbyMessage = proto.LobbyMessage;
import { MessageResolver } from "./MessageResolver";
import { Client } from "./Client";
import { MatchControl } from "./MatchControl";

export interface MatchParams {
    ctrl_token: string;
    address: Address;
    logFile: string;
}

// silly aggregation class
export class MatchRunner {
    public serverRunner: ServerRunner;
    public matchControl: MatchControl;

    constructor(serverRunner: ServerRunner, matchControl: MatchControl) {
        this.serverRunner = serverRunner;
        this.matchControl = matchControl;
    }

    public static create(serverPath: string, params: MatchParams): Promise<MatchRunner> {
        return new Promise((resolve, reject) => {
            const logger = new Logger(params.logFile);

            const serverRunner = new ServerRunner(serverPath, params);
            serverRunner.onError.subscribe(reject);
            serverRunner.runServer();

            MatchControl.connect({
                host: params.address.host,
                port: params.address.port,
                token: Buffer.from(params.ctrl_token, 'hex'),
                logger: logger,
            }).then((control) => {
                const matchRunner = new MatchRunner(serverRunner, control);
                resolve(matchRunner);
            });
        });
    }

    public shutdown() {
        this.serverRunner.killServer();
    }

    public get onComplete() {
        return this.serverRunner.onExit;
    }

    public get onError() {
        return this.serverRunner.onError;
    }

    public get onPlayerConnected() {
        return this.matchControl.onPlayerConnected;
    }

    public get onPlayerDisconnected() {
        return this.matchControl.onPlayerDisconnected;
    }

    public get logger() {
        return this.matchControl.logger;
    }
}
