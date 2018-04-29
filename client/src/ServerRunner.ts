import { Address } from "./index";
import * as tmp from 'tmp';
import * as fs from 'fs';
import { execFile } from 'child_process';


export interface ServerParams {
    players: PlayerData[];
    mapFile: string;
    maxTurns: number;
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

    constructor(serverPath: string, params: ServerParams) {
        this.params = params;
        this.serverPath = serverPath;
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
            // TODO
            console.log('done');
        });
        process.on('error', (err: Error) => {
            console.log(err);
        });
    }

    private writeConfigFile() {
        // TODO: maybe doing this async would be better
        const file = tmp.fileSync();
        const json = JSON.stringify(this.configJSON());
        fs.writeFileSync(file.fd, json);
        return file.name;
    }

    private configJSON() : ServerConfigJSON {
        const { players, mapFile, maxTurns, address } = this.params;
        const logFile = tmp.fileSync().name;

        const game_config = {
            map_file: mapFile,
            max_turns: maxTurns,
        };
        return {
            players,
            game_config,
            address: `${address.host}:${address.port}`,
            log_file: logFile,
        };
    }
}

export interface ServerConfigJSON {
    players: BotConfigJSON[];
    game_config: GameConfigJSON;
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
