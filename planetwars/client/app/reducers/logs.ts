import * as A from '../actions';
import * as M from '../database/models';
import { List } from 'immutable';
import { PwTypes } from 'planetwars-match-log';

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
      let log = state[matchId];
      if (log) {
        log = log.push(entry);
      } else {
        log = List.of(entry);
      }
      return { ...state, [matchId]: log };
    }
    default: return state;
  }
}
