import { store } from "../index";
import { IMatchConfig } from "./ConfigModels";
import { matchStarted, matchFinished, matchCrashed, addNotification } from '../actions/actions';
import { Config } from "./Config";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import { execFile } from 'child_process';

export default class GameRunner {
  private conf: IMatchConfig;

  constructor(conf: IMatchConfig) {
    this.conf = conf;
    this.runBotRunner();
  }

  private runBotRunner() {
    store.dispatch(matchStarted());
    const configFile = this.createConfig(JSON.stringify(this.conf));
    const child = execFile(Config.matchRunner, [configFile], ((error: any, stdout: any, stderr: any) => {
      if (error) {
        store.dispatch(matchCrashed(error));
        store.dispatch(addNotification({
          title: "Match has crashed",
          body: "" + error,
          type: "Error",
        }));
      } else {
        store.dispatch(matchFinished());
        store.dispatch(addNotification({
          title: "Match has finished",
          body: "Click here for more info",
          type: "Finished",
        }));
      }
    }));
  }

  private createConfig(json: string) {
    const path = Config.configPath(uuidv4());
    fs.writeFileSync(path, json);
    return path;
  }
}
