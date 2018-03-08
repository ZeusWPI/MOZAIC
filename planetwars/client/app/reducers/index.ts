import {combineReducers, Reducer} from 'redux';
import {routerReducer as routing, RouterState} from 'react-router-redux';
import * as path from "path";
import * as fs from "fs";


export interface IState {
  routing: RouterState,
  about: AboutState,
  botpage: BotsState,
}

export type AboutState = { counter: number; };
export type BotsState = { bots: string[] };

const aboutReducer = combineReducers<AboutState>({
  counter: (state = 0, action) => {
    switch (action.type) {
      case 'TEST': {
        return state + 1;
      }
      default:
        return state;
    }
  }
});

const botsReducer = combineReducers<BotsState>({
  rerender: (state = [], action) => {
    switch (action.type) {
      case 'botsRerender': {
        return action.bots;
      }
      default:
        return state;
    }
  },

  removeBot: (state = [], action) => {
    switch (action.type) {
      case 'removeBot': {

        let index: number = state.indexOf(action.name);
        if (index > -1) {
          return state.slice(index, 1)
        }
        else {
          return state
        }
      }
      default:
        return state;
    }
  }
});

// function readBots(): string[] {
//   let dir = "./bots";
//   if (fs.existsSync(dir)) {
//     let fileNames = fs.readdirSync(dir);
//     fileNames = fileNames.filter(file => fs.lstatSync("./bots/" + file).isFile());
//     let paths = fileNames.map((f) => path.parse(path.resolve(dir, f)));
//     let rslt: string[] = paths.map((x: path.ParsedPath) => x.name);
//     console.log(rslt);
//     return rslt;
//
//   }
//   return [];
// }
//
// function removeBot(name: string, evt: any) {
//   evt.preventDefault(); // Stop the Link from being activated
//   let path = `./bots/${ name }.json`;
//   if (fs.existsSync(path) && confirm(`Are you sure you want to delete ${ name }?`)) {
//     fs.unlinkSync(path);
//   }
// }

const rootReducer = combineReducers({
  routing: routing as Reducer<any>,
  about: aboutReducer,
  botpage: botsReducer
});

export default rootReducer;
