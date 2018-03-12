import { store } from "../index"
import { MatchConfig } from "./Models"
import { gameStarted, gameFinished, gameCrashed } from '../actions/actions';
import Config from "./Config"

const execFile = require('child_process').execFile;

export default class GameRunner {
  conf:MatchConfig;
  constructor(conf:MatchConfig) {
    this.conf = conf;
    this.runBotRunner();
  }

  runBotRunner() {
    store.dispatch(gameStarted())
    const child = execFile(Config.binaryLocation, [this.conf], ((error:any, stdout:any, stderr:any) => {
      if (error) {
          store.dispatch(gameCrashed())
      } else {
          store.dispatch(gameFinished())
      }
    }));
  }
}
