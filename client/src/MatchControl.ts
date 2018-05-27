import { TextDecoder } from 'text-encoding';
import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";

import * as protocol_root from './proto';
import proto = protocol_root.mozaic.protocol;
import LobbyMessage = proto.LobbyMessage;

import { Client, ClientParams } from "./Client";
import { MessageResolver } from "./MessageResolver";
import { Logger } from "./index";
import { GameState } from "./PwTypes";

export type MatchControlParams = ClientParams & {

}


export class MatchControl {
    private client: Client;
    private messageResolver: MessageResolver;
    public logger: Logger;

    private _onPlayerConnected = new SimpleEventDispatcher<number>();
    private _onPlayerDisconnected = new SimpleEventDispatcher<number>();


    constructor(client: Client, logger: Logger) {
        this.client = client;
        this.messageResolver = new MessageResolver(client);
        this.logger = logger;
        this.messageResolver.onMessage.subscribe(({ messageId, data }) => {
            this.handleMessage(data);
        });
    }

    public static connect(params: MatchControlParams): Promise<MatchControl> {
        return Client.connect(params).then((client) => {
            return new MatchControl(client, params.logger);
        });
    }

    public get onPlayerConnected() {
        return this._onPlayerConnected.asEvent();
    }

    public get onPlayerDisconnected() {
        return this._onPlayerDisconnected.asEvent();
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
        return this.lobbyRequest({ removePlayer }).then((data) => { });
    }

    public startGame(config: object): Promise<void> {
        let payload = Buffer.from(JSON.stringify(config), 'utf-8');
        let startGame = new LobbyMessage.StartGameRequest({ payload });
        return this.lobbyRequest({ startGame }).then((data) => { });
    }

    private lobbyRequest(params: proto.ILobbyMessage): Promise<Uint8Array> {
        let msg = LobbyMessage.encode(params).finish();
        return this.messageResolver.request(msg);
    }

    private handleMessage(data: Uint8Array) {
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