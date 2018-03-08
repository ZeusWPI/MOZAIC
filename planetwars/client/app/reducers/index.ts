import { routerReducer as routing, RouterState } from 'react-router-redux';
import { combineReducers, Reducer } from 'redux';

import * as A from '../actions/actions';
import { IBotConfig } from '../utils/ConfigModels';
import { IGameData } from '../utils/GameModels';

// Global state
export interface IGState {
  routing: RouterState;
  about: IAboutState;
  bots: IBotsState;
  navbar: INavbarState;
  history: IHistoryState;
}

export interface IAboutState { counter: number; }
export interface IBotsState { bots: IBotConfig[]; }
export interface INavbarState { toggled: boolean; }
export interface IHistoryState { games: IGameData[]; }

export const initialState: IGState = {
  routing: { location: null },
  about: { counter: 0 },
  bots: { bots: [] },
  navbar: { toggled: false },
  history: { games: [] },
};

const aboutReducer = combineReducers<IAboutState>({
  counter: (state = 0, action) => {
    if (A.incrementAbout.test(action)) {
      return state + 1;
    }
    return state;
  },
});

const navbarReducer = combineReducers<INavbarState>({
  toggled: (state = false, action) => {
    if (A.toggleNavMenu.test(action)) {
      return !state;
    }
    return state;
  },
});

const botsReducer = combineReducers<IBotsState>({
  bots: (state = [], action) => {
    if (A.loadBot.test(action)) {
      const newA = state.slice();
      newA.push(action.payload);
      return newA;
    }
    return state;
  },
});

const historyReducer = combineReducers<IHistoryState>({
  games: (state = [], action) => {
    // TODO add relevant actions
    return state;
  },
});

export const rootReducer = combineReducers<IGState>({
  routing: routing as Reducer<any>,
  about: aboutReducer,
  bots: botsReducer,
  navbar: navbarReducer,
  history: historyReducer,
});
