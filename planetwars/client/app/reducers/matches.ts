import * as A from '../actions';
import * as M from '../database/models';

export type MatchesState = M.MatchList;
export function matchesReducer(state: MatchesState = {}, action: any): MatchesState {
  switch (action.type) {
    case A.saveMatch.type: {
      const match = action.payload;
      return { ...state, [match.uuid]: match };
    }
    case A.importMatchFromDB.type: {
      const match = action.payload;
      return { ...state, [match.uuid]: match };
    }
    default: return state;
  }
}
