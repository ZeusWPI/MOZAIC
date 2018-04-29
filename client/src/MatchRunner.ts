import { ServerRunner } from "./ServerRunner";
import { ClientRunner, ClientData } from "./ClientRunner";
import { BotConfig, Address } from "./index";

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
    botConfig?: BotConfig;
}

export class MatchRunner {
    private serverRunner: ServerRunner;
    private clientRunner: ClientRunner

    constructor(serverPath: string, params: MatchParams) {
        this.serverRunner = new ServerRunner(serverPath, params);

        const { address, logFile } = params;
        let clients: ClientData[] = [];
        params.players.forEach((playerData) => {
            const { botConfig, token } = playerData;
            if (botConfig) {
                clients.push({ botConfig, token });
            }
        });
        this.clientRunner = new ClientRunner({
            clients,
            address,
            logFile,
        });
    }

    public run() {
        this.serverRunner.runServer();
        // run clients after a second, so that we are certain the server has
        // started.
        setTimeout(() => {
            this.clientRunner.run();
        }, 1000);
    }
}
