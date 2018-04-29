import { PlayerData } from "./MatchRunner";
import { BotConfig } from "./BotRunner";
import { Address, Client } from "./index";

export interface ClientData {
    botConfig: BotConfig;
    token: string;
}

export class ClientRunner {
    readonly clients: Client[];

    constructor(address: Address, players: ClientData[]) {
        this.clients = players.map((playerData) => {
            const { token, botConfig } = playerData;
            const connData = {
                address,
                token: Buffer.from(token, 'hex'),
            };
            return new Client(connData,botConfig);
        });
    }

    public run() {
        this.clients.forEach((client) => {
            client.run(); 
        });
    }
}