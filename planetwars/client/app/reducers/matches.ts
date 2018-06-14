import * as actions from '../actions/matches';
import * as M from '../database/models';
import { ActionType, getType } from 'typesafe-actions';

export type MatchesState = M.MatchList;
export type Action = ActionType<typeof actions>;

export function matchesReducer(state: MatchesState = {}, action: Action): MatchesState {
  switch (action.type) {
    case getType(actions.saveMatch): {
      const match = action.payload;
      return { ...state, [match.uuid]: match };
    }
    case getType(actions.importMatch): {
      const match = action.payload;
      return { ...state, [match.uuid]: match };
    }
    case getType(actions.matchFinished): {
      const { matchId, stats } = action.payload;
      const match = state[matchId];
      return {
        ...state,
        [matchId]: {
          ...state[matchId],
          status: M.MatchStatus.finished,
          stats,
        },
      };
    }
    case getType(actions.matchError): {
      const { matchId, error } = action.payload;
      return {
        ...state,
        [matchId]: {
          ...state[matchId],
          status: M.MatchStatus.error,
          error,
        },
      };
    }
    default: return state;
  }
}
