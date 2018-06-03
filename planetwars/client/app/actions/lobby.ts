import { actionCreator, actionCreatorVoid } from './helpers';
import { MapId, MatchId, Token } from '../database/models';
import { MatchParams } from 'mozaic-client';
import { PlayerData, ClientData } from '../reducers/lobby';

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

export interface ServerParams {
  matchId: string;
  address: Address;
}

export const startServer = actionCreator<ServerParams>('START_SERVER');
export const serverStarted = actionCreator<MatchId>('SERVER_STARTED');
export const stopServer = actionCreatorVoid('STOP_SERVER');
export const serverStopped = actionCreatorVoid('SERVER_STOPPED');

export interface PlayerParams {
  id: string;
  name: string;
  number: number;
  botId?: string;
}

export const createPlayer = actionCreator<PlayerParams>('CREATE_PLAYER');

export interface ClientRegistration {
  playerId: string;
  clientId: number;
  token: string;
}
export const clientRegistered = actionCreator<ClientRegistration>('CLIENT_REGISTERED');
export const clientConnected = actionCreator<{ clientId: number }>('CLIENT_CONNECTED');
export const clientDisconnected = actionCreator<{ clientId: number }>('CLIENT_DISCONNECTED');
