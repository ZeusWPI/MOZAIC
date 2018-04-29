export interface LogRecord {
    player: number;
    message: LogMessage;
}

export type LogMessage =
    StepMessage;

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