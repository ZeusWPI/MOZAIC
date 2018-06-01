import * as PwClient from 'mozaic-client';

import * as A from '../actions';
import * as M from '../database/models';
import { generateToken } from '../utils/GameRunner';

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

export interface LobbyState {
  config: PwConfig;
  address: Address;
}

export const defaultLobbyState = {
  address: defaultAddress,
  config: defaultConfig,
};

export function lobbyReducer(state: LobbyState = defaultLobbyState, action: any) {
  if (A.setConfig.test(action)) {
    return { ...state, config: action.payload };
  }

  if (A.setAddress.test(action)) {
    return { ...state, address: action.payload };
  }

  return state;
}
