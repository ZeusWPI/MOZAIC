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

export type PlayerAction = PlayerActionTimeout;

export type PlayerActionTimeout = {
    type: 'timeout'
};

export interface LogRecord {
    player: number;
    message: LogMessage;
}

export type LogMessage
    = StepMessage
    | CommandMessage;

export interface CommandMessage {
    "type": "command";
    "content": string;
}

export interface StepMessage {
    "type": "step";
    "turn_number": number;
    "state": GameState;
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