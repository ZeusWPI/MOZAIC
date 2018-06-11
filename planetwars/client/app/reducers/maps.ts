import * as actions from '../actions/maps';
import * as M from '../database/models';
import { ActionType, getType } from 'typesafe-actions';

export type MapsState = M.MapList;
export type MapsAction = ActionType<typeof actions>;

export function mapsReducer(state: MapsState = {}, action: MapsAction) {
  switch (action.type) {
    case getType(actions.importMap): {
      const map = action.payload;
      return { ...state, [map.uuid]: map };
    }
    default: {
      return state;
    }
  }
}
