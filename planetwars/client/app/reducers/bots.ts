import { v4 as uuidv4 } from 'uuid';

import * as A from '../actions';
import * as actions from '../actions/bots';
import * as M from '../database/models';
import { ActionType, getType } from 'typesafe-actions';

export type BotsState = M.BotList;
export type BotsAction = ActionType<typeof actions>;

export function botsReducer(state: BotsState = {}, action: BotsAction) {
  switch (action.type) {
    case getType(actions.addBot): {
      const bot = action.payload;
      return { ...state, [bot.uuid]: bot };
    }
    case getType(actions.editBot): {
      const bot = action.payload;
      return { ...state, [bot.uuid]: bot };
    }
    case getType(actions.removeBot): {
      const uuid = action.payload;
      const bots = { ...state };
      delete bots[uuid];
      return bots;
    }
  }
}
