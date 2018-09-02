import { BotConfig, BotRunner } from "../index";
import { GameStep, GameFinished, ClientSend } from "../eventTypes";
import { ClientParams } from "../networking/EventWire";
import { Client } from "../networking/Client";
import { EventType } from "../reactors/SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";
import { Reactor } from "../reactors/Reactor";
import { Logger } from "../Logger";
import { WriteStream } from "fs";
import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;


export type Params = ClientParams & {
    botConfig: BotConfig,
    clientId: number;
    matchUuid: Uint8Array;
    logSink: WriteStream;
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
        const logger = new Logger(params.clientId, params.logSink);
        this.reactor = new Reactor(logger);
        this.client = new Client(params, this.reactor);
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

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.reactor.on(eventType);
    }
}