import { actionCreator, actionCreatorVoid } from './helpers';
import { MapId, MatchId, Token } from '../database/models';
import { MatchParams } from 'mozaic-client';
import { PlayerData } from '../reducers/lobby';

interface Config {
  mapId: MapId;
  maxTurns: number;
}

interface Address {
  host: string;
  port: number;
}

export const setAddress = actionCreator<Address>('SET_ADDRESS');
export const setConfig = actionCreator<Config>('SET_CONFIG');
export const savePlayer = actionCreator<PlayerData>('SAVE_PLAYER');
