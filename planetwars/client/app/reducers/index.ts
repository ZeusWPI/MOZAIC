import { routerReducer as routing, RouterState } from 'react-router-redux';
import { combineReducers, Reducer } from 'redux';
import { v4 as uuidv4 } from 'uuid';

import { store } from '../index';
import * as A from '../actions/index';
import * as M from '../utils/database/models';
import { generateToken } from '../utils/GameRunner'
import { Action } from '../actions/helpers';

// ----------------------------------------------------------------------------
// State
// ----------------------------------------------------------------------------

/*
 * The global state is the root and source of all data in the app.
 * All components are essentially functions of this state to HTML + JS.
 *
 * There is a big focus on immutability and simple state management.
 * Dynamic changing of object properties is dangerous, and should be avoided,
 * in favour of effectively cloning the objects in question.
 *
 * For separation-of-concerns arguments 'bots' and 'botsPage' are different
 * properties of the state, as one ('bots') could be reused in other pages, and
 * only represents the actual data state, with no little consideration for the
 * logic above it. Same goes for matches.
 */
export interface GState {
  readonly routing: RouterState;

  readonly bots: BotsState;
  readonly matches: MatchesState;
  readonly notifications: NotificationsState;
  readonly maps: MapsState;
  readonly host: HostState;

  // TODO: Remove this state
  readonly matchesPage: MatchesPageState;
  readonly navbar: NavbarState;

  readonly globalErrors: any[];
}

// TODO: Remove toggled from redux store
// TODO: Make notifications their own root level prop
export interface NavbarState {
  readonly toggled: boolean;
  readonly notificationsVisible: boolean;
}

export type NotificationsState = M.Notification[];
export type BotsState = M.BotList;
export type MatchesState = M.MatchList;
export type MapsState = M.MapList;

export type HostState = M.BotSlot[];

export interface MatchesPageState {
  readonly importError?: string;
}

export interface AboutPageState { }

export const initialState: GState = {
  routing: { location: null },

  navbar: { toggled: false, notificationsVisible: false },
  bots: {},
  matches: {},
  maps: {},
  notifications: [],
  host: [],

  matchesPage: {},
  globalErrors: [],
};

// ----------------------------------------------------------------------------
// Reducers
// ----------------------------------------------------------------------------

const navbarReducer = combineReducers<NavbarState>({
  toggled: (state = false, action) => {
    if (A.toggleNavMenu.test(action)) {
      return !state;
    }
    return state;
  },
  notificationsVisible: (state = false, action) => {
    if (A.showNotifications.test(action)) {
      return true;
    } else if (A.hideNotifications.test(action)) {
      return false;
    } else if (A.toggleNotifications.test(action)) {
      return !state;
    }
    return state;
  },
});

const notificationReducer = (state: M.Notification[] = [], action: any) => {
  if (A.addNotification.test(action)) {
    const newState = state.slice();
    newState.push(action.payload);
    return newState;
  } else if (A.removeNotification.test(action)) {
    const newState = state.slice();
    newState.splice(action.payload, 1);
    return newState;
  } else if (A.clearNotifications.test(action)) {
    return [];
  }
  return state;
};

const hostReducer = (state: HostState = [], action: Action) =>  {
  if (A.playerConnected.test(action)) {
    const newState = state.slice();
    newState.filter((slot: M.BotSlot) => slot.token === action.payload.token)[0].connected = true;
    return newState;
  }
  if (A.playerDisconnected.test(action)) {
    const newState = state.slice();
    newState.filter((slot: M.BotSlot) => slot.token === action.payload.token)[0].connected = false;
    return newState;
  }
  if (A.newBotSlots.test(action)) {
    const newState = [];
    for (let i = 1; i <= action.payload; i++) {
      newState.push({
        type: 'external',
        name: 'Player ' + i,
        token: generateToken(),
        connected: false,
      });
    }
    return newState;
  }
  if (A.changeBotSlot.test(action)) {
    const newState = state.slice();
    for (let i = 0; i < state.length; i++) {
      if (state[i].token === action.payload.token) {
        newState[i] = action.payload;
      }
    }
    return newState;
  }
  return state;
};

const mapsReducer = (state: M.MapList = {}, action: any) => {
  if (A.importMapFromDB.test(action)) {
    return { ...state, [action.payload.uuid]: action.payload };
  }
  if (A.importMap.test(action)) {
    return { ...state, [action.payload.uuid]: action.payload };
  }
  return state;
};

const botsReducer = (state: BotsState = {}, action: any) => {
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
};

// const botsPageReducer = combineReducers<IBotsPageState>({});

const matchesReducer = (state: MatchesState = {}, action: any): MatchesState => {
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
};

const matchesPageReducer = combineReducers<MatchesPageState>({
  importError: (state = "", action) => {
    if (A.importMatchError.test(action)) {
      return action.payload;
    }
    return state;
  },
});

const globalErrorReducer = (state: any[] = [], action: Action) => {
  if (A.dbError.test(action)) {
    return [...state, action.payload];
  }
  if (A.importMapError.test(action)) {
    return [...state, action.payload];
  }
  return state;
};

export const rootReducer = combineReducers<GState>({
  routing: routing as Reducer<any>,

  bots: botsReducer,
  matches: matchesReducer,
  maps: mapsReducer,
  notifications: notificationReducer,
  host: hostReducer,

  navbar: navbarReducer,
  matchesPage: matchesPageReducer,

  globalErrors: globalErrorReducer,
});
