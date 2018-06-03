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
  clientId?: number;
  botId?: string;
}

export interface ClientData {
  clientId: number;
  playerId: string;
  token: string;
  connected: boolean;
}

export interface LobbyState {
  matchId?: M.MatchId;
  config: PwConfig;
  address: Address;
  players: { [playerId: string]: PlayerData };
  clients: { [clientId: string]: ClientData };
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

  if (A.createPlayer.test(action)) {
    const player = action.payload;
    const players = { ...state.players, [player.id]: player };
    return { ...state, players };
  }

  if (A.clientRegistered.test(action)) {
    const { clientId, playerId, token } = action.payload;

    // update player data
    const player = { ...state.players[playerId], clientId };
    const players = { ...state.players, [playerId]: player };

    // add client
    const client = {
      clientId,
      playerId,
      token,
      connected: false,
    };
    const clients = { ...state.clients, [clientId]: client };
    return { ...state, clients, players };
  }

  if (A.clientConnected.test(action)) {
    const { clientId } = action.payload;
    return {
      ...state,
      clients: {
        ...state.clients,
        [clientId]: {
          ...state.clients[clientId],
          connected: true,
        },
      },
    };
  }

  if (A.clientDisconnected.test(action)) {
    const { clientId } = action.payload;
    return {
      ...state,
      clients: {
        ...state.clients,
        [clientId]: {
          ...state.clients[clientId],
          connected: false,
        },
      },
    };
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
