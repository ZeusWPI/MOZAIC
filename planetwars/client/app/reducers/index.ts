import { combineReducers, Reducer } from 'redux';
import { routerReducer as routing, RouterState } from 'react-router-redux';


export interface IState {
  routing: RouterState,
  about: AboutState,
  botpage: BotsState,
  navbar: NavbarState,
}

export type AboutState = { counter: number; };
export type BotsState = {};
export type NavbarState = { toggled: boolean; }

const aboutReducer = combineReducers<AboutState>({
  counter: (state = 0) => {
    return state + 1;
  }
});

const navbarReducer = combineReducers<NavbarState>({
  toggled: (state = false) => {
    return !state;
  }
});

const rootReducer = combineReducers({
  routing: routing as Reducer<any>,
  about: aboutReducer,
  navbar: navbarReducer,
});

export default rootReducer;
