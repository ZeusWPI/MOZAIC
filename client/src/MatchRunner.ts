import { ServerRunner } from "./ServerRunner";
import { BotConfig, Address, Connection } from "./index";
import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";
import { SignalDispatcher, ISignal } from "ste-signals";
import { GameState } from "./PwTypes";

import * as protocol_root from './proto';
import proto = protocol_root.mozaic.protocol;
import LobbyMessage = proto.LobbyMessage;

export interface MatchParams {
    ctrl_token: string;
    address: Address;
    logFile: string;
}

// silly aggregation class
export class MatchRunner {
    public serverRunner: ServerRunner;

    constructor(serverRunner: ServerRunner) {
        this.serverRunner = serverRunner;
    }

    public static create(serverPath: string, params: MatchParams): Promise<MatchRunner> {
        return new Promise((resolve, reject) => {

            const serverRunner = new ServerRunner(serverPath, params);
            serverRunner.onError.subscribe(reject);
            serverRunner.runServer();

            // MatchControl.connect({
            //     host: params.address.host,
            //     port: params.address.port,
            //     token: Buffer.from(params.ctrl_token, 'hex'),
            //     logger: logger,
            // }).then((control) => {
            //     const matchRunner = new MatchRunner(serverRunner, control);
            //     resolve(matchRunner);
            // });
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
}
