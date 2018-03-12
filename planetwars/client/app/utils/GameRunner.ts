import { store } from "../index"
import { MatchConfig } from "./Models"
import { matchStarted, matchFinished, matchCrashed } from '../actions/actions';
import { Config } from "./Config"
import { v4 as uuidv4 }  from "uuid"
import * as fs from "fs"

const execFile = require('child_process').execFile;

export default class GameRunner {
  conf:MatchConfig;
  constructor(conf:MatchConfig) {
    this.conf = conf;
    this.runBotRunner();
  }

  runBotRunner() {
    store.dispatch(matchStarted())
    let configFile = this.createConfig(JSON.stringify(this.conf))
    const child = execFile(Config.matchRunner, [configFile], ((error:any, stdout:any, stderr:any) => {
      if (error) {
          store.dispatch(matchCrashed(error))
      } else {
          store.dispatch(matchFinished())
      }
    }));
  }

  createConfig(json:string) {
    let path = Config.configPath(uuidv4())
    fs.writeFileSync(path, json)
    return path
  }
}
