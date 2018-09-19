import * as PwClient from 'mozaic-client';

import * as A from '../actions';
import * as M from '../database/models';
import { generateToken } from '../utils/GameRunner';

export interface HostPageState {
  slots: M.BotSlot[];
  serverRunning: boolean;
  matchParams?: M.MatchParams;
  runner?: PwClient.Reactor;
}

const defaultState = { slots: [], serverRunning: false };
export function hostReducer(state: HostPageState = defaultState, action: any) {
  if (A.playerConnected.test(action)) {
    const slots = state.slots.slice();
    slots.filter((slot: M.BotSlot) => slot.token === action.payload)[0].connected = true;
    return { ...state, slots };
  }
  if (A.playerDisconnected.test(action)) {
    const slots = state.slots.slice();
    slots.filter((slot: M.BotSlot) => slot.token === action.payload)[0].connected = false;
    return { ...state, slots };
  }
  if (A.setupServer.test(action)) {
    const slots: M.BotSlot[] = [];
    for (let i = 1; i <= action.payload.numPlayers; i++) {
      slots.push({
        type: M.BotSlotType.external,
        name: 'Player ' + i,
        token: generateToken(),
        connected: false,
        clientid: i,
      });
    }

    const params: M.MatchParams = {
      players: slots,
      map: action.payload.mapId,
      maxTurns: action.payload.maxTurns,
      address: action.payload.address,
      ctrl_token: generateToken(),
    };
    return { ...state, slots, matchParams: params };
  }
  if (A.serverStarted.test(action)) {
    return { ...state, runner: action.payload, serverRunning: true };
  }
  if (A.changeBotSlot.test(action)) {
    const slots = state.slots.slice();
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].token === action.payload.token) {
        slots[i] = action.payload;
      }
    }
    return { ...state, slots };
  }
  return state;
}
