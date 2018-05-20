import { ServerRunner } from "./ServerRunner";
import { ClientRunner, ClientData } from "./ClientRunner";
import { BotConfig, Address, Connection } from "./index";
import { TextDecoder } from 'text-encoding';
import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";
import { SignalDispatcher, ISignal } from "ste-signals";
import { MessageHandler, RequestResolver } from "./RequestResolver";
import { GameState } from "./PwTypes";
import { Logger } from "./Logger";

export interface MatchParams {
    ctrl_token: string;
    players: PlayerData[];
    mapFile: string;
    maxTurns: number;
    address: Address;
    logFile: string;
}

export interface PlayerData {
    name: string;
    token: string;
    number: number;
    botConfig?: BotConfig;
}

export class MatchRunner {
    private connection: Connection;
    private serverRunner: ServerRunner;
    private clientRunner: ClientRunner;
    private logger: Logger;

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
        let clients: ClientData[] = [];
        params.players.forEach((playerData) => {
            const { botConfig, token, number } = playerData;
            if (botConfig) {
                clients.push({ botConfig, token, number });
            }
        });
        this.clientRunner = new ClientRunner({
            clients,
            address,
            logger: this.logger,
        });

        this.serverRunner.onExit.subscribe(() => {
            this._onComplete.dispatch()
        });
        this.serverRunner.onError.subscribe((err) => {
            this._onError.dispatch(err);
        });
        // TODO: is this desired behaviour?
        this.clientRunner.onError.subscribe((err) => {
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

    public run() {
        this.serverRunner.runServer();
        // run clients after a second, so that we are certain the server has
        // started.
        setTimeout(() => {
            this.connection.connect(
                this.serverRunner.address.host,
                this.serverRunner.address.port,
            );
            this.clientRunner.run();
        }, 1000);
    }

    public start_match() {
        let cmd: LobbyCommand = { type: "start_match" };
        let text = JSON.stringify(cmd);
        this.connHandler.send(Buffer.from(text, 'utf-8'));
    }

    public get controlChannel() {
        return this.connection;
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

interface LobbyCommand {
    type: "start_match"
}