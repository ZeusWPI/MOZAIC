import { BotConfig, BotRunner } from "./index";
import { Connected, GameStep, GameFinished, ClientSend } from "./events";
import { ClientParams } from "./networking/EventWire";
import { EventHandler, Client } from "./networking/Client";
import { SimpleEventEmitter, EventType } from "./SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";

export type Params = ClientParams & {
    botConfig: BotConfig,
    clientId: number;
}

export class PwClient {
    readonly clientId: number;
    readonly eventEmitter: SimpleEventEmitter;
    readonly client: Client;
    readonly botRunner: BotRunner;

    constructor(params: Params) {
        this.clientId = params.clientId;
        this.eventEmitter = new SimpleEventEmitter();
        this.client = new Client(params, this.eventEmitter);
        this.botRunner = new BotRunner(params.botConfig);
        
        this.on(GameStep).subscribe((step) => {
            this.handleGameStep(step);
        });
        this.on(GameFinished).subscribe((_step) => {
            // TODO: actually quit
            console.log(`client ${this.clientId} quit`);
            this.botRunner.killBot();
        });
        this.on(ClientSend).subscribe((e) => {
            this.client.send(e);
        });
    }

    public run() {
        const meta = JSON.stringify({
            "player_number": this.clientId,
        });
        this.botRunner.run(meta);
        this.client.connect();
    }


    private handleGameStep(step: GameStep) {
        this.botRunner.request(step.state, (response) => {
            this.dispatch(ClientSend.create({
                data: response,
            }));
        });
    }

    public dispatch(event: any) {
        this.eventEmitter.handleEvent(event);
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.eventEmitter.on(eventType);
    }
}