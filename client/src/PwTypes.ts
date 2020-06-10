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

export interface Command {
    "origin": string;
    "destination": string;
    "ship_count": number;
}

/**
 * A PlayerAction describes the action a player took in his turn
 */
export type PlayerAction
    = PlayerActionTimeout
    | PlayerActionParseError
    | PlayerActionCommands;

export type PlayerActionTimeout = {
    type: 'timeout'
};

export type PlayerActionParseError = {
    type: 'parse_error';
    value: string;
}

export type PlayerActionCommands = {
    type: 'commands';
    value: PlayerCommand[];
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


/**
 * Messages the client receives from the server
 */

export type ServerMessage
    = GameStateMessage
    | PlayerActionMessage
    | FinalStateMessage;


export type GameStateMessage = {
    type: 'game_state';
    content: GameState;
};

export type FinalStateMessage = {
    type: 'final_state';
    content: GameState;
}

export type PlayerActionMessage = {
    type: 'player_action';
    content: PlayerAction;
}

/**
 * Types for the log
 */

export type LogEntry
    = PlayerLogEntry
    | GameStateEntry;

export interface GameStateEntry {
    type: "game_state";
    state: GameState;
}

export interface PlayerLogEntry {
    type: "player_entry",
    player: number,
    record: LogRecord,
}

export type LogRecord
    = StepRecord
    | CommandRecord
    | PlayerActionRecord;

    
export interface StepRecord {
    "type": "step";
    "state": GameState;
}
    
export interface CommandRecord {
    "type": "command";
    "content": string;
}

export interface PlayerActionRecord {
    "type": "player_action";
    "action": PlayerAction;
}