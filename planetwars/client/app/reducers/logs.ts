import * as A from '../actions';
import * as M from '../database/models';
import { List } from 'immutable';
import { PwTypes } from '../lib/match';

export interface LogList {
  [matchId: string]: Log;
}

export type Log = List<PwTypes.LogEntry>;

export type LogsState = LogList;
export function logsReducer(state: LogsState = {}, action: any): LogsState {
  switch (action.type) {
    case A.createLog.type: {
      const matchId = action.payload;
      return { ...state, [matchId]: List() };
    }
    case A.addLogEntry.type: {
      const { matchId, entry } = action.payload;
      const log = state[matchId];
      return { ...state, [matchId]: log.push(entry) };
    }
    default: return state;
  }
}
