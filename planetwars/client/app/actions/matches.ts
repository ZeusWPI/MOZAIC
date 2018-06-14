import * as M from '../database/models';
import { actionCreator } from './helpers';
import { createAction } from 'typesafe-actions';

// export const importMatchFromDB = actionCreator<M.Match>('IMPORT_MATCH_FROM_DB');
// export const importMatchError = actionCreator<string>('IMPORT_MATCH_ERROR');

export const importMatch = createAction('IMPORT_MATCH', (resolve) => {
  return (match: M.Match) => resolve(match);
});

export const saveMatch = createAction('SAVE_MATCH', (resolve) => {
  return (match: M.Match) => resolve(match);
});

export interface JoinMatchParams {
  matchId: string;
  token: string;
  botId: M.BotId;
  name: string;
  address: M.Address;
}
export const joinMatch = createAction('JOIN_MATCH', (resolve) => {
  return (params: JoinMatchParams) => resolve(params);
});

export interface MatchFinished {
  matchId: string;
  stats: M.MatchStats;
}
export const matchFinished = createAction('MATCH_FINISHED', (resolve) => {
  return (params: MatchFinished) => resolve(params);
});

export interface MatchError {
  matchId: string;
  error: string;
}
export const matchError = createAction('MATCH_ERROR', (resolve) => {
  return (params: MatchError) => resolve(params);
});
