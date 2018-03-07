import { combineReducers, Reducer } from 'redux';
import { routerReducer as routing, RouterState } from 'react-router-redux';


export interface IState {
  routing: RouterState,
  about: AboutState,
  botpage: BotsState,
}

export type AboutState = { counter: number; };
export type BotsState = { bots: string[]};

const aboutReducer = combineReducers<AboutState>({
  counter: (state = 0, action) => {
    switch(action.type) {
      case 'TEST': {
        return state + 1;
      }
      default: return state;
    }
  }
});

const botsReducer = combineReducers<BotsState>( {
  rerender: (state = 0, action) => {
    switch(action.type) {
      case 'botsRerender': {
        return
      }
      default: return state;
    }
  }
})

const rootReducer = combineReducers({
  routing: routing as Reducer<any>,
  about: aboutReducer,
});

export default rootReducer;
