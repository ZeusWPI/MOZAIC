import * as fs from 'fs';
import * as tmp from 'tmp';
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
    const configFile = this.writeConfigFile();
    console.log(configFile);
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

  private writeConfigFile() {
    // TODO: maybe doing this async would be better
    let file = tmp.fileSync();
    let json = JSON.stringify(this.conf);
    fs.writeFileSync(file.fd, json);
    return file.name;
  }
}

export default GameRunner;