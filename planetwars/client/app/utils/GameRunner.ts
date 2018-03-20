import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import { execFile } from 'child_process';

import { IMatchConfig } from './ConfigModels';
import { Config } from './Config';

// TODO: maybe s/game/match/g ?
declare interface GameRunner {
  on(event: 'matchStarted', listener: () => void): this;
  on(event: 'matchEnded', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
}

class GameRunner extends EventEmitter
{
  private conf: IMatchConfig;

  constructor(conf: IMatchConfig) {
    super();
    this.conf = conf;
  }

  public run() {
    // TODO: maybe make sure this isn't called twice
    this.runBotRunner();
  }

  private runBotRunner() {
    const configFile = this.createConfig(JSON.stringify(this.conf));
    const callback = this.processEnded.bind(this);
    const child = execFile(Config.matchRunner, [configFile], callback);
    this.emit('matchStarted');
  }

  private processEnded(error: Error | null, stdout: string, stderr: string) {
    if (error) {
      this.emit('error', error);
    } else {
      this.emit('matchEnded');
    }
  }

  private createConfig(json: string) {
    const path = Config.configPath(uuidv4());
    fs.writeFileSync(path, json);
    return path;
  }
}

export default GameRunner;