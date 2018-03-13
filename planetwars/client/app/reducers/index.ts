import { routerReducer as routing, RouterState } from 'react-router-redux';
import { combineReducers, Reducer } from 'redux';

import { store } from '../index';
import * as A from '../actions/actions';
import { IBotConfig } from '../utils/ConfigModels';
import { IMatchMetaData } from '../utils/GameModels';
import { INotification } from '../utils/UtilModels';
// import { db, SCHEMA } from '../utils/Database';

// Global state
export interface IGState {
  readonly routing: RouterState;
  readonly navbar: INavbarState;
  readonly botsPage: IBotsPageState;
  readonly matchesPage: IMatchesPageState;
  readonly aboutPage: IAboutPageState;
  readonly globalErrors: any[];
}

export interface INavbarState {
  readonly toggled: boolean;
  readonly notifications: INotification[];
  readonly notificationsVisible: boolean;
}
export interface IBotsPageState { readonly bots: IBotConfig[]; }
export interface IMatchesPageState {
  readonly matches: IMatchMetaData[];
  readonly importError?: string;
}
export interface IAboutPageState { readonly counter: number; }

export const initialState: IGState = {
  routing: { location: null },
  navbar: { toggled: false, notifications: [], notificationsVisible: false },
  botsPage: { bots: [] },
  matchesPage: { matches: [] },
  aboutPage: { counter: 0 },
  globalErrors: [],
};

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
    } else if (A.removeNotification.test(action)) {
      const newState = state.slice();
      newState.splice(action.payload, 1);
      return newState;
    } else if (A.clearNotifications.test(action)) {
      return [];
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

const aboutPageReducer = combineReducers<IAboutPageState>({
  counter: (state = 0, action) => {
    if (A.incrementAbout.test(action)) {
      return state + 1;
    }
    return state;
  },
});

const botsPageReducer = combineReducers<IBotsPageState>({
  bots: (state = [], action) => {
    if (A.addBot.test(action)) {
      const newA = state.slice();
      newA.push(action.payload);
      return newA;
    }
    return state;
  },
});

const matchesPageReducer = combineReducers<IMatchesPageState>({
  matches: (state = [], action) => {
    if (A.addMatchMeta.test(action) || A.importMatchMeta.test(action)) {
      const newA = state.slice();
      newA.push(action.payload);
      return newA;
    }
    return state;
  },
  importError: (state = "", action) => {
    if (A.matchImportError.test(action)) {
      return action.payload;
    }
    return state;
  },
});

const globalErrorReducer = (state: any[] = [], action: any) => {
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
  botsPage: botsPageReducer,
  matchesPage: matchesPageReducer,
  aboutPage: aboutPageReducer,
  globalErrors: globalErrorReducer,
});
