import { actionCreator, actionCreatorVoid } from './helpers';
import { PwTypes } from 'planetwars-match-log';

export const createLog = actionCreator<string>('CREATE_LOG');

export interface AddLogEntry {
  matchId: string;
  entry: PwTypes.LogEntry;
}

export const addLogEntry = actionCreator<AddLogEntry>('ADD_LOG_ENTRY');
