import { BotConfig, BotRunner } from "../index";
import { GameStep, GameFinished, ClientSend } from "../eventTypes";
import { ClientParams } from "../networking/EventWire";
import { Client } from "../networking/Client";
import { EventType } from "../reactors/SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";
import { Reactor } from "../reactors/Reactor";
import { Logger, ClientLogger } from "../Logger";
import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;


export type Params = ClientParams & {
    botConfig: BotConfig,
    clientId: number;
    matchUuid: Uint8Array;
    logger: Logger;
}

export class PwClient {
    readonly clientId: number;
    readonly matchUuid: Uint8Array;
    readonly reactor: Reactor;
    readonly client: Client;
    readonly botRunner: BotRunner;

    constructor(params: Params) {
        this.clientId = params.clientId;
        this.matchUuid = params.matchUuid;
        const logger = new ClientLogger(params.logger, params.clientId);
        this.reactor = new Reactor(logger);
        this.client = new Client(params);
        this.botRunner = new BotRunner(params.botConfig);
        
        this.reactor.on(GameStep).subscribe((step) => {
            this.handleGameStep(step);
        });
        this.reactor.on(GameFinished).subscribe((_step) => {
            // TODO: actually quit
            console.log(`client ${this.clientId} quit`);
            this.botRunner.killBot();
        });
        this.reactor.on(ClientSend).subscribe((e) => {
            this.client.send(e);
        });

        this.client.on(GameStep, (e) => this.reactor.dispatch(e));
        this.client.on(GameFinished, (e) => this.reactor.dispatch(e));
    }

    public run() {
        const meta = JSON.stringify({
            "player_number": this.clientId,
        });
        this.botRunner.run(meta);

        let message = proto.GameserverConnect.encode({
            client: {
                clientId: this.clientId,
                matchUuid: this.matchUuid,
            }
        }).finish();
        this.client.connect(message);
    }


    private handleGameStep(step: GameStep) {
        this.botRunner.request(step.state, (response) => {
            this.dispatch(ClientSend.create({
                data: response,
            }));
        });
    }

    public dispatch(event: any) {
        this.reactor.handleEvent(event);
    }
}