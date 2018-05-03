import * as protocol_root from './proto';
import Message = protocol_root.mozaic.protocol.Message;
import { BotRunner, BotConfig } from "./BotRunner";
import { Connection, Address } from "./Connection";
import { Socket } from 'net';
import { BufferWriter } from 'protobufjs';
import { Logger } from './Logger';
import { TextDecoder } from 'text-encoding';
import { ServerMessage, GameState, PlayerAction } from './PwTypes';
import { RequestResolver } from './RequestResolver';
import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events';
import { SignalDispatcher, ISignal } from 'ste-signals';

export interface ConnectionData {
    token: Buffer,
    address: Address,
}

export interface Request {
    requestId: number;
    data: Buffer;
}

// TODO: expand this
enum ClientState {
    CONNECTING,
    CONNECTED,
};


export class Client {
    readonly connection: Connection;
    readonly address: Address;
    readonly botRunner: BotRunner;
    readonly logger: Logger;
    private resolver: RequestResolver;

    private turnNum: 0;
    private state: ClientState;

    private _onExit = new SignalDispatcher();
    private _onError = new SimpleEventDispatcher<Error>();

    constructor(connData: ConnectionData, botConfig: BotConfig, logger: Logger) {
        this.connection = new Connection(connData.token);

        this.handleMessage = this.handleMessage.bind(this);
        this.resolver = new RequestResolver(this.connection, this.handleMessage);


        this.address = connData.address;
        this.botRunner = new BotRunner(botConfig);
        this.logger = logger;
        this.state = ClientState.CONNECTING;
        this.turnNum = 0;

        this.botRunner.onError.subscribe((err) => {
            this._onError.dispatch(err);
        });

        this.connection.onError.subscribe((err) => {
            this._onError.dispatch(err);
        });

        this.connection.onClose.subscribe(() => {
            this.botRunner.killBot();
            this._onExit.dispatch();
        });
    }

    public run() {
        console.log('running client');
        this.connection.connect(this.address.host, this.address.port);
        this.botRunner.run();
    }

    public get onExit() {
        return this._onExit.asEvent();
    }

    public get onError() {
        return this._onError.asEvent();
    }

    private handleMessage(data: Uint8Array): void | Promise<Uint8Array> {
        switch (this.state) {
            case ClientState.CONNECTING: {
                return this.handleConnectingMessage(data);
            }
            case ClientState.CONNECTED: {
                return this.handleGameMessage(data);
            }
        }
    }

    private handleConnectingMessage(data: Uint8Array): Promise<Uint8Array> {
        this.state = ClientState.CONNECTED;
        console.log('connected');
        return Promise.resolve(data);
    }

    private handleGameMessage(data: Uint8Array): void | Promise<Uint8Array>
    {
        const text = new TextDecoder('utf-8').decode(data);
        let serverMessage: ServerMessage = JSON.parse(text);

        switch (serverMessage.type) {
            case 'game_state': {
                return this.handleGameState(serverMessage.content);
            }
            case 'player_action': {
                return this.handlePlayerAction(serverMessage.content);
            }
        }
    }

    private handleGameState(state: GameState): Promise<Uint8Array> {
        this.turnNum += 1;

        this.logger.log({
            "type": 'step',
            "turn_number": this.turnNum,
            "state": state,
        });

        return new Promise((resolve, reject) => {
            const request = JSON.stringify(state);
            this.botRunner.request(request, (response) => {
                this.logger.log({
                    "type": "command",
                    "content": response,
                });
                const buf = Buffer.from(response, 'utf-8');
                resolve(buf);
            });
        });
    }

    private handlePlayerAction(action: PlayerAction) {
        this.logger.log({
            "type": 'player_action',
            "action": action,
        })
    }   
}