import * as protocol_root from './proto';
import Message = protocol_root.mozaic.protocol.Message;
import { BotRunner, BotConfig } from "./BotRunner";
import { Connection, Address } from "./Connection";
import { Socket } from 'net';
import { BufferWriter } from 'protobufjs';
import { ClientLogger, Logger } from './Logger';
import { TextDecoder } from 'text-encoding';
import { ServerMessage, GameState, PlayerAction } from './PwTypes';
import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events';
import { SignalDispatcher, ISignal } from 'ste-signals';
import { Client, ClientParams } from './Client';
import { MessageResolver } from './MessageResolver';

export interface ConnectionData {
    token: Buffer,
    address: Address,
}

export interface Request {
    requestId: number;
    data: Buffer;
}


export type Params = ClientParams & {
    botConfig: BotConfig,
}

export class PwClient {
    readonly client: Client;
    readonly botRunner: BotRunner;

    private messageResolver: MessageResolver;

    private _onExit = new SignalDispatcher();
    private _onError = new SimpleEventDispatcher<Error>();

    constructor(client: Client, bot: BotConfig) {
        this.client = client;
        this.messageResolver = new MessageResolver(client);

        this.botRunner = new BotRunner(bot);
        const meta = JSON.stringify({
            "player_number": client.clientId
        });
        this.botRunner.run(meta);

        this.messageResolver.onMessage.subscribe(({ messageId, data }) => {
            const response = this.handleMessage(data);
            if (response) {
                response.then((responseData) => {
                    console.log('sending response');
                    this.messageResolver.sendResponse(messageId, responseData);
                });
            }
        });
    }

    public get onExit() {
        return this._onExit.asEvent();
    }

    public get onError() {
        return this._onError.asEvent();
    }

    private handleMessage(data: Uint8Array) {
        const text = new TextDecoder('utf-8').decode(data);
        let serverMessage: ServerMessage = JSON.parse(text);

        switch (serverMessage.type) {
            case 'game_state': {
                return this.handleGameState(serverMessage.content);
            }
            case 'player_action': {
                return this.handlePlayerAction(serverMessage.content);
            }
            case 'final_state': {
                return this.handleFinalState(serverMessage.content);
            }
        }
    }

    private handleGameState(state: GameState): Promise<Uint8Array> {
        this.logState(state);

        return new Promise((resolve, reject) => {
            const request = JSON.stringify(state);
            this.botRunner.request(request, (response) => {
                this.client.log({
                    "type": "command",
                    "content": response,
                });
                const buf = Buffer.from(response, 'utf-8');
                resolve(buf);
            });
        });
    }

    private handleFinalState(state: GameState) {
        this.logState(state);
    }

    private logState(state: GameState) {
        this.client.log({
            "type": 'step',
            "state": state,
        });
    }

    private handlePlayerAction(action: PlayerAction) {
        this.client.log({
            "type": 'player_action',
            "action": action,
        })
    }   
}