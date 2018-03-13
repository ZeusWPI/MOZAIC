import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { execFile } from 'child_process';

import { store } from '../index';
import { IMatchConfig } from './ConfigModels';
import { matchStarted, matchFinished, matchCrashed } from '../actions/actions';
import { Config } from './Config';

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
      } else {
        store.dispatch(matchFinished());
      }
    }));
  }

  private createConfig(json: string) {
    const path = Config.configPath(uuidv4());
    fs.writeFileSync(path, json);
    return path;
  }
}
