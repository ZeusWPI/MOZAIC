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
