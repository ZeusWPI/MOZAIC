import * as A from '../actions';
import * as M from '../database/models';

export type MapsState = M.MapList;
export function mapsReducer(state: MapsState = {}, action: any) {
  if (A.importMapFromDB.test(action)) {
    return { ...state, [action.payload.uuid]: action.payload };
  }
  if (A.importMap.test(action)) {
    return { ...state, [action.payload.uuid]: action.payload };
  }
  return state;
}
