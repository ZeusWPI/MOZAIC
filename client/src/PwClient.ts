import { BotConfig, BotRunner } from "./index";
import { ClientReactor } from "./ClientReactor";
import { LeaderConnected, GameStep, GameFinished, ClientSend } from "./events";
import { ClientParams } from "./Connection";

export type Params = ClientParams & {
    botConfig: BotConfig,
    clientId: number;
}

export class PwClient {
    readonly clientId: number;
    readonly reactor: ClientReactor;
    readonly botRunner: BotRunner;

    constructor(params: Params) {
        this.clientId = params.clientId;
        this.botRunner = new BotRunner(params.botConfig);
        this.reactor = new ClientReactor(params);
        this.reactor.on(GameStep).subscribe((step) => {
            this.handleGameStep(step);
        });
        this.reactor.on(GameFinished).subscribe((step) => {
            // TODO: actually quit
            console.log(`client ${this.clientId} quit`);
            this.botRunner.killBot();
        });

    }

    public run() {
        const meta = JSON.stringify({
            "player_number": this.clientId,
        });
        this.botRunner.run(meta);
        this.reactor.connect();
    }


    private handleGameStep(step: GameStep) {
        const query = JSON.stringify(step.state);
        this.botRunner.request(query, (response) => {
            this.reactor.dispatch(ClientSend.create({
                data: response,
            }));
        });
    }
}