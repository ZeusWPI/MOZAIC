import { ServerRunner } from "./ServerRunner";
import { ClientRunner, ClientData } from "./ClientRunner";
import { BotConfig, Address, Connection } from "./index";
import { TextDecoder } from 'text-encoding';
import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";
import { SignalDispatcher, ISignal } from "ste-signals";
import { MessageHandler, RequestResolver } from "./RequestResolver";
import { GameState } from "./PwTypes";
import { Logger } from "./Logger";

import * as protocol_root from './proto';
import proto = protocol_root.mozaic.protocol;
import LobbyMessage = proto.LobbyMessage;

export interface MatchParams {
    ctrl_token: string;
    address: Address;
    logFile: string;
}

export class MatchRunner {
    private connection: Connection;
    private serverRunner: ServerRunner;
    readonly logger: Logger;

    private connHandler: RequestResolver;

    private _onComplete = new SignalDispatcher();
    private _onError = new SimpleEventDispatcher<Error>();

    private _onPlayerConnected = new SimpleEventDispatcher<number>();
    private _onPlayerDisconnected = new SimpleEventDispatcher<number>();

    constructor(serverPath: string, params: MatchParams) {
        this.serverRunner = new ServerRunner(serverPath, params);
        let token = Buffer.from(params.ctrl_token, 'hex');
        this.connection = new Connection(token);
        this.logger = new Logger(params.logFile);


        const { address, logFile } = params;

        this.serverRunner.onExit.subscribe(() => {
            this._onComplete.dispatch()
        });
        this.serverRunner.onError.subscribe((err) => {
            this._onError.dispatch(err);
        });

        this.connHandler = new RequestResolver(this.connection, (data) => {
            const text = new TextDecoder('utf-8').decode(data);
            let message: ServerMessage = JSON.parse(text);
            
            switch (message.type) {
                case 'player_connected': {
                    const { player_id } = message.content;
                    this._onPlayerConnected.dispatch(player_id);
                    break;
                }
                case 'player_disconnected': {
                    const { player_id } = message.content;
                    this._onPlayerDisconnected.dispatch(player_id);
                    break;
                }
                case 'game_state': {
                    this.logger.log({
                        type: "game_state",
                        state: message.content,
                    });
                    break;
                }
            }
        });
    }

    public addPlayer(token: Uint8Array): Promise<number> {
        let addPlayer = LobbyMessage.AddPlayerRequest.create({ token });
        return this.lobbyRequest({ addPlayer }).then((data) => {
            const response = LobbyMessage.AddPlayerResponse.decode(data);
            return Number(response.clientId);
        });
    }

    public removePlayer(clientId: number): Promise<void> {
        let removePlayer = new LobbyMessage.RemovePlayerRequest({ clientId });
        return this.lobbyRequest({ removePlayer }).then((data) => {});
    }

    public startGame(config: object): Promise<void> {
        let payload = Buffer.from(JSON.stringify(config), 'utf-8');
        let startGame = new LobbyMessage.StartGameRequest({ payload });
        return this.lobbyRequest({ startGame }).then((data) => {});
    }

    private lobbyRequest(params: proto.ILobbyMessage): Promise<Uint8Array> {
        let msg = LobbyMessage.encode(params).finish();
        return this.controlChannel.request(msg);
    }

    public run() {
        this.serverRunner.runServer();
        // run clients after a short delay, so that we are certain the server
        // has started.
        setTimeout(() => {
            this.connection.connect(
                this.serverRunner.address.host,
                this.serverRunner.address.port,
            );
        }, 300);
    }

    public get controlChannel() {
        return this.connHandler;
    }

    public get onComplete() {
        return this._onComplete.asEvent();
    }

    public get onError() {
        return this._onError.asEvent();
    }

    public get onPlayerConnected() {
        return this._onPlayerConnected.asEvent();
    }

    public get onPlayerDisconnected() {
        return this._onPlayerDisconnected.asEvent();
    }

    public get onConnect() {
        return this.connection.onConnect;
    }
}

type ServerMessage
    = PlayerConnectedMessage
    | PlayerDisconnectedMessage
    | GameStateMessage;
                

interface PlayerConnectedMessage {
    type: "player_connected";
    content: {
        player_id: number;
    }
}

interface PlayerDisconnectedMessage {
    type: "player_disconnected";
    content: {
        player_id: number;
    }
}

interface GameStateMessage {
    type: "game_state";
    content: GameState;
}