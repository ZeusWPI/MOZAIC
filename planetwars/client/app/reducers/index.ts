import { routerReducer as routing, RouterState } from 'react-router-redux';
import { combineReducers, Reducer } from 'redux';
import { v4 as uuidv4 } from 'uuid';

import { store } from '../index';
import * as A from '../actions/actions';
import * as M from '../utils/database/models';
import { IAction } from '../actions/helpers';

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
export interface IGState {
  readonly routing: RouterState;

  readonly navbar: NavbarState;
  readonly bots: M.BotList;
  readonly matches: M.MatchList;
  readonly notifications: M.Notification[];
  readonly maps: M.MapList;

  readonly matchesPage: MatchesPageState;
  readonly playPage: PlayPageState;

  readonly globalErrors: any[];
}

// TODO: Remove toggled from redux store
// TODO: Make notifications their own root level prop
export interface NavbarState {
  readonly toggled: boolean;
  readonly notificationsVisible: boolean;
}

export type IBotsState = M.BotList;
export type IMatchesState = M.MatchList;

export interface PlayPageState {
  selectedBots: M.BotSlotList;
  selectedMap: string;
}

export interface MatchesPageState {
  readonly importError?: string;
}

export interface AboutPageState { }

export const initialState: IGState = {
  routing: { location: null },

  navbar: { toggled: false, notificationsVisible: false },
  bots: {},
  matches: {},
  maps: {},
  notifications: [],

  playPage: {
    selectedBots: {},
    selectedMap: "",
  },
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

const mapsReducer = (state: M.MapList = {}, action: any) => {
  if (A.importMapFromDB.test(action)) {
    return { ...state, [action.payload.uuid]: action.payload };
  }
  if (A.importMap.test(action)) {
    return { ...state, [action.payload.uuid]: action.payload };
  }
  return state;
};

const botsReducer = (state: IBotsState = {}, action: any) => {
  if (A.addBot.test(action)) {
    const config: M.BotConfig = action.payload;
    const _now = Date.now();
    const createdAt = new Date(_now);
    const lastUpdatedAt = new Date(_now);
    const uuid = uuidv4();
    const history = [config];
    const bot: M.BotData = { uuid, config, createdAt, lastUpdatedAt, history };
    return { ...state, [bot.uuid]: bot };
  }

  if (A.importBotFromDB.test(action)) {
    return { ...state, [action.payload.uuid]: action.payload };
  }

  if (A.editBot.test(action)) {
    const bot = action.payload;
    bot.history.push(bot.config);
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

const matchesReducer = (state: IMatchesState = {}, action: any): IMatchesState => {
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

const playPageReducer = combineReducers<PlayPageState>({
  selectedBots: (state: M.BotSlotList = {}, action) => {
    if (A.selectBot.test(action)) {
      const slot: M.BotSlot = { name: action.payload.name, id: action.payload.id };
      return { ...state, [action.payload.token]: slot };
    }

    if (A.unselectBot.test(action)) {
      const filteredState: M.BotSlotList = Object.keys(state)
        .filter((key) => key !== action.payload)
        .reduce((obj: M.BotSlotList, key) => {
          obj[key] = state[key];
          return obj;
        }, {});
      return filteredState;
    }

    if (A.changeLocalBot.test(action)) {
      state[action.payload.token] = action.payload.slot;
      return { ...state };
    }
    return state;
  },
  selectedMap: (state: string = "", action) => {
    if (A.selectMap.test(action)) {
      return action.payload;
    }
    return state;
  },
});

const globalErrorReducer = (state: any[] = [], action: IAction) => {
  if (A.dbError.test(action)) {
    return [...state, action.payload];
  }
  if (A.importMapError.test(action)) {
    return [...state, action.payload];
  }
  return state;
};

export const rootReducer = combineReducers<IGState>({
  routing: routing as Reducer<any>,

  navbar: navbarReducer,
  bots: botsReducer,
  matches: matchesReducer,
  maps: mapsReducer,
  notifications: notificationReducer,

  matchesPage: matchesPageReducer,
  playPage: playPageReducer,

  globalErrors: globalErrorReducer,
});
