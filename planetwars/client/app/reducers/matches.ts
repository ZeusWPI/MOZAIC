import * as A from '../actions';
import * as M from '../database/models';

export type MatchesState = M.MatchList;
export function matchesReducer(state: MatchesState = {}, action: any): MatchesState {
  switch (action.type) {
    case A.createMatch.type: {
      const match = action.payload;
      return { ...state, [match.uuid]: match };
    }
    case A.importMatchFromDB.type: {
      const match = action.payload;
      return { ...state, [match.uuid]: match };
    }
    case A.matchFinished.type: {
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
    case A.matchError.type: {
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
