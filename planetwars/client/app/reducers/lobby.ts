import * as PwClient from 'mozaic-client';

import * as A from '../actions';
import * as M from '../database/models';
import { generateToken } from '../utils/GameRunner';
import { Token } from '../database/models';

export interface Address {
  host: string;
  port: number;
}

export interface PwConfig {
  mapId: M.MapId;
  maxTurns: number;
}

export const defaultConfig: PwConfig = {
  mapId: '',
  maxTurns: 500,
};

export const defaultAddress: Address = {
  host: '127.0.0.1',
  port: 9142,
};

export interface PlayerData {
  id: string;
  name: string;
  number: number;
}

export interface LobbyState {
  matchId?: M.MatchId;
  config: PwConfig;
  address: Address;
  players: { [playerId: string]: PlayerData };
}

export const defaultLobbyState = {
  address: defaultAddress,
  config: defaultConfig,
  players: {},
  clients: {},
};

export function lobbyReducer(state: LobbyState = defaultLobbyState, action: any) {
  if (A.setConfig.test(action)) {
    return { ...state, config: action.payload };
  }

  if (A.setAddress.test(action)) {
    return { ...state, address: action.payload };
  }

  if (A.savePlayer.test(action)) {
    const player = action.payload;
    const players = { ...state.players, [player.id]: player };
    return { ...state, players };
  }

  if (A.serverStarted.test(action)) {
    const matchId = action.payload;
    return { ...state, matchId };
  }

  if (A.serverStopped.test(action)) {
    const matchId = undefined;
    return { ...state, matchId };
  }

  return state;
}
