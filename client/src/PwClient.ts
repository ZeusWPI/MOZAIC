import { BotConfig, BotRunner } from "./index";
import { ClientReactor } from "./ClientReactor";
import { Connected, GameStep, GameFinished, ClientSend } from "./events";
import { ClientParams } from "./EventWire";

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
        this.botRunner.request(step.state, (response) => {
            this.reactor.dispatch(ClientSend.create({
                data: response,
            }));
        });
    }
}