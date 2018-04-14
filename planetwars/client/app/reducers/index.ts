import { routerReducer as routing, RouterState } from 'react-router-redux';
import { combineReducers, Reducer } from 'redux';
import { v4 as uuidv4 } from 'uuid';

import { store } from '../index';
import * as A from '../actions/actions';
import { BotConfig, IBotData, IBotList, BotID, BotSlot, BotSlotList } from '../utils/ConfigModels';
import { Match, IMatchList, IMapList } from '../utils/GameModels';
import { Notification } from '../utils/UtilModels';
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

  readonly navbar: INavbarState;
  readonly bots: IBotList;
  readonly matches: IMatchList;
  readonly notifications: Notification[];
  readonly maps: IMapList;

  readonly matchesPage: IMatchesPageState;
  readonly playPage: IPlayPageState;

  readonly globalErrors: any[];
}

// TODO: Remove toggled from redux store
// TODO: Make notifications their own root level prop
export interface INavbarState {
  readonly toggled: boolean;
  readonly notificationsVisible: boolean;
}

export type IBotsState = IBotList;
export type IMatchesState = IMatchList;

export interface IPlayPageState {
  selectedBots: BotSlotList;
  selectedMap: string;
}

export interface IMatchesPageState {
  readonly importError?: string;
}

export interface IAboutPageState { }

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

const navbarReducer = combineReducers<INavbarState>({
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

const notificationReducer = (state: Notification[] = [], action: any) => {
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

const mapsReducer = (state: IMapList = {}, action: any) => {
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
    const config: BotConfig = action.payload;
    const _now = Date.now();
    const createdAt = new Date(_now);
    const lastUpdatedAt = new Date(_now);
    const uuid = uuidv4();
    const history = [config];
    const bot: IBotData = { uuid, config, createdAt, lastUpdatedAt, history };
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

const matchesPageReducer = combineReducers<IMatchesPageState>({
  importError: (state = "", action) => {
    if (A.importMatchError.test(action)) {
      return action.payload;
    }
    return state;
  },
});

const playPageReducer = combineReducers<IPlayPageState>({
  selectedBots: (state: BotSlotList = {}, action) => {
    if (A.selectBot.test(action)) {
      const slot: BotSlot = { name: action.payload.name, id: action.payload.id };
      return { ...state, [action.payload.token]: slot };
    }

    if (A.unselectBot.test(action)) {
      const filteredState: BotSlotList = Object.keys(state)
        .filter((key) => key !== action.payload)
        .reduce((obj: BotSlotList, key) => {
          obj[key] = state[key];
          return obj;
        }, {});
      return filteredState;
    }

    if (A.changeLocalBot.test(action)) {
      state[action.payload.token] = action.payload.slot;
      return {...state};
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
