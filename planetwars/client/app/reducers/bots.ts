import { v4 as uuidv4 } from 'uuid';

import * as A from '../actions';
import * as M from '../database/models';

export type BotsState = M.BotList;

export function botsReducer(state: BotsState = {}, action: any) {
  if (A.addBot.test(action)) {
    const { name, command } = action.payload;
    const _now = Date.now();
    const createdAt = new Date(_now);
    const lastUpdatedAt = new Date(_now);
    const uuid = uuidv4();
    const bot: M.Bot = { uuid, name, command, createdAt, lastUpdatedAt };
    return { ...state, [bot.uuid]: bot };
  }

  if (A.importBotFromDB.test(action)) {
    return { ...state, [action.payload.uuid]: action.payload };
  }

  if (A.editBot.test(action)) {
    const bot = action.payload;
    bot.lastUpdatedAt = new Date(Date.now());
    state[bot.uuid] = bot;
    return { ...state };
  }

  if (A.removeBot.test(action)) {
    const uuid = action.payload;
    const bots = { ...state };
    delete bots[uuid];
    return bots;
  }

  return state;
}
