import { combineReducers, Reducer } from 'redux';
import { routerReducer as routing, RouterState } from 'react-router-redux';

import { BotConfig } from '../utils/Models';
import * as A from '../actions/actions';
import {getNewLibraryCopy} from "bluebird";

// Global state
export interface IGState {
  routing: RouterState,
  about: AboutState,
  bots: BotsState,
  navbar: NavbarState,
}

export type AboutState = { counter: number; };
export type BotsState = { bots: BotConfig[] };
export type NavbarState = { toggled: boolean; }

export const initialState: IGState = {
  routing: { location: null },
  about: { counter: 0 },
  bots: { bots: [] },
  navbar: { toggled: false },
}

const aboutReducer = combineReducers<AboutState>({
  counter: (state = 0, action) => {
    if (A.incrementAbout.test(action)) {
      return state + 1;
    }
    return state;
  }
});

const navbarReducer = combineReducers<NavbarState>({
  toggled: (state = false, action) => {
    if (A.toggleNavMenu.test(action)) {
      return !state;
    }
    return state;
  }
});

const botsReducer = combineReducers<BotsState>({
  bots: (state = [], action) => {
    if (A.loadBot.test(action)) {
      let newA = state.slice();
      newA.push(action.payload);
      return newA;
    }
    else if (A.removeBot.test(action)) {
      let newA = state.slice();
      newA = newA.filter((value: BotConfig) => (value.name != action.payload));
      return newA;
    }

    // else if (A.saveBot.test(action)) {
    //   let newA = state.slice();
    //   let existingBotIndex = newA.indexOf((bot:BotConfig) => bot == action.payload);
    //   if (existingBotIndex == -1){
    //     newA.push(action.payload);
    //   }
    //   else {
    //     newA[existingBotIndex] = action.payload
    //   }
    //   return newA;
    // }

    else if (A.clearBots.test(action)) {
      return [];
    }

    return state
  }
});


export const rootReducer = combineReducers({
  routing: routing as Reducer<any>,
  about: aboutReducer,
  bots: botsReducer,
  navbar: navbarReducer,
});
