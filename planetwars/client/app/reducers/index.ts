import { routerReducer as routing, RouterState } from 'react-router-redux';
import { combineReducers, Reducer } from 'redux';
import { v4 as uuidv4 } from 'uuid';

import { store } from '../index';
import * as A from '../actions/actions';
import { IBotConfig, IBotData, IBotList } from '../utils/ConfigModels';
import { IMatchMetaData, IMatchList } from '../utils/GameModels';
import { INotification } from '../components/Navbar';
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
  readonly bots: IBotsState;
  readonly matches: IMatchesState;

  readonly matchesPage: IMatchesPageState;
  readonly aboutPage: IAboutPageState;

  readonly globalErrors: any[];
}

// TODO: Remove toggled from redux store
// TODO: Make notifications their own root level prop
export interface INavbarState {
  readonly toggled: boolean;
  readonly notifications: INotification[];
}

export type IBotsState = IBotList;
export type IMatchesState = IMatchList;

export interface IMatchesPageState {
  readonly importError?: string;
}

export interface IAboutPageState { readonly counter: number; }

export const initialState: IGState = {
  routing: { location: null },
  navbar: { toggled: false, notifications: [] },
  bots: {},
  matches: {},

  matchesPage: {},
  aboutPage: { counter: 0 },
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
  notifications: (state = [], action) => {
    if (A.addNotification.test(action)) {
      const newState = state.slice();
      newState.push(action.payload);
      return newState;
    }
    return state;
  },
});

const aboutPageReducer = combineReducers<IAboutPageState>({
  counter: (state = 0, action) => {
    if (A.incrementAbout.test(action)) {
      return state + 1;
    }
    return state;
  },
});

const botsReducer = (state: IBotsState = {}, action: any) => {
  if (A.addBot.test(action)) {
    const config: IBotConfig = action.payload;
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
    case A.importMatchFromDB.type:
    case A.importMatch.type: {
      const match: IMatchMetaData = action.payload;
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

const globalErrorReducer = (state: any[] = [], action: IAction) => {
  if (A.dbError.test(action)) {
    const newA = state.slice();
    newA.push(action.payload);
    return newA;
  }
  return state;
};

export const rootReducer = combineReducers<IGState>({
  routing: routing as Reducer<any>,

  navbar: navbarReducer,
  bots: botsReducer,
  matches: matchesReducer,

  matchesPage: matchesPageReducer,
  aboutPage: aboutPageReducer,

  globalErrors: globalErrorReducer,
});
