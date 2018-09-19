import * as M from '../database/models';
import { actionCreator } from './helpers';

export const importMatchFromDB = actionCreator<M.Match>('IMPORT_MATCH_FROM_DB');
export const importMatchError = actionCreator<string>('IMPORT_MATCH_ERROR');
export const importMatch = actionCreator<M.Match>('IMPORT_MATCH');

export const createMatch = actionCreator<M.Match>('CREATE_MATCH');

export interface JoinMatchParams {
  matchId: string;
  token: string;
  botId: M.BotId;
  name: string;
  address: M.Address;
}
export const joinMatch = actionCreator<JoinMatchParams>('JOIN_MATCH');

export interface MatchFinished {
  matchId: string;
  stats: M.MatchStats;
}
export const matchFinished = actionCreator<MatchFinished>('MATCH_FINISHED');

export interface MatchError {
  matchId: string;
  error: string;
}
export const matchError = actionCreator<MatchError>('MATCH_ERROR');
