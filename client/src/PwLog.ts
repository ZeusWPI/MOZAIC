export type ServerMessage
    = GameStateMessage
    | PlayerActionMessage;

export type GameStateMessage = {
    type: 'game_state';
    content: GameState;
};

export type PlayerActionMessage = {
    type: 'player_action';
    content: PlayerAction;
}

export type PlayerAction
    = PlayerActionTimeout
    | PlayerActionParseError
    | PlayerActionCommands;

export type PlayerActionTimeout = {
    type: 'timeout'
};

export type PlayerActionParseError = {
    type: 'parse_error';
    content: string;
}

export type PlayerActionCommands = {
    type: 'commands';
    content: PlayerCommand[];
}

export type PlayerCommand = {
    command: Command;
    error?: DispatchError;
}

export type DispatchError
    = 'NotEnoughShips'
    | 'OriginNotOwned'
    | 'ZeroShipMove'
    | 'OriginDoesNotExist'
    | 'DestinationDoesNotExist';


export interface Command {
    "origin": string;
    "destination": string;
    "ship_count": number;
}

export interface LogRecord {
    player: number;
    message: LogMessage;
}

export type LogMessage
    = StepMessage
    | CommandMessage
    | PlayerActionLogMessage;

export interface CommandMessage {
    "type": "command";
    "content": string;
}

export interface StepMessage {
    "type": "step";
    "turn_number": number;
    "state": GameState;
}

export interface PlayerActionLogMessage {
    "type": "player_action";
    "action": PlayerAction;
}

export interface GameState {
    "planets": Planet[],
    "expeditions": Expedition[],
}

export interface Planet {
    "ship_count": number;
    "x": number;
    "y": number;
    "owner": number;
    "name": string;
}

export interface Expedition {
    "id": number;
    "origin": string;
    "destination": string;
    "owner": number;
    "ship_count": number;
    "turns_remaining": number;
}