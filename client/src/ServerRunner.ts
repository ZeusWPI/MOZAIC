import { Address } from "./index";
import * as tmp from 'tmp';
import * as fs from 'fs';
import { execFile, ChildProcess } from 'child_process';
import { SignalDispatcher, ISignal } from "ste-signals";
import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";


export interface ServerParams {
    ctrl_token: string;
    address: Address;
    logFile: string;
}

export interface PlayerData {
    name: string;
    token: string;
}

export class ServerRunner {
    private params: ServerParams;
    private serverPath: string;
    private serverProcess?: ChildProcess;

    private _onExit = new SignalDispatcher();
    private _onError = new SimpleEventDispatcher<Error>();

    constructor(serverPath: string, params: ServerParams) {
        this.params = params;
        this.serverPath = serverPath;
    }

    public get address() {
        return this.params.address;
    }

    public runServer() {
        const configPath = this.writeConfigFile();
        const process = execFile(this.serverPath, [configPath]);

        process.stdout.on('data', (data: Buffer) => {
            console.log(data.toString('utf-8'))
        });
        process.stderr.on('data', (data: Buffer) => {
            console.log(data.toString('utf-8'))
        });
        process.on('close', () => {
            this._onExit.dispatch();
        });
        process.on('error', (err: Error) => {
            this._onError.dispatch(err);
        });

        this.serverProcess = process;
    }

    public killServer() {
        if (this.serverProcess) {
            this.serverProcess.kill();
        }
    }

    public get onExit() {
        return this._onExit.asEvent();
    }

    public get onError() {
        return this._onError.asEvent();
    }

    private writeConfigFile() {
        // TODO: maybe doing this async would be better
        const file = tmp.fileSync();
        const json = JSON.stringify(this.configJSON());
        fs.writeFileSync(file.fd, json);
        return file.name;
    }

    private configJSON(): ServerConfigJSON {
        const { ctrl_token, address } = this.params;
        const logFile = tmp.fileSync().name;

        return {
            ctrl_token,
            address: `${address.host}:${address.port}`,
            log_file: logFile,
        };
    }
}

export interface ServerConfigJSON {
    ctrl_token: string;
    address: string;
    log_file: string;
}

export interface GameConfigJSON {
    map_file: string;
    max_turns: number;
}

export interface BotConfigJSON {
    name: string;
    token: string;
}
