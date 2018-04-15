import * as fs from 'fs';
import * as tmp from 'tmp';
import { EventEmitter } from 'events';
import { execFile } from 'child_process';

// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');

import { BotConfig, MatchConfig, Token, BotSlot } from './ConfigModels';
import { Config } from './Config';

// TODO: maybe s/game/match/g ?
declare interface GameRunner {
  on(event: 'matchStarted', listener: () => void): this;
  on(event: 'matchEnded', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
}

class GameRunner extends EventEmitter {
  private conf: ExternalMatchConfig;

  constructor(conf: MatchConfig) {
    super();
    const { gameConfig: { maxTurns, mapFile }, logFile } = conf;
    const players = Object.keys(conf.players).map((token) => this.convertBotConfig(token, conf.players[token]));
    // tslint:disable-next-line:variable-name
    const game_config = { max_turns: maxTurns, map_file: mapFile };
    this.conf = { players, game_config, log_file: logFile };
  }

  public run() {
    // TODO: maybe make sure this isn't called twice
    this.runBotRunner();
  }

  private convertBotConfig(token: Token, bot: BotSlot): ExternalBotConfig {
    return { token, name: bot.name };
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
    const file = tmp.fileSync();
    const json = JSON.stringify(this.conf);
    fs.writeFileSync(file.fd, json);
    return file.name;
  }
}

// External Configs -----------------------------------------------------------
// How the game server expects them

export interface ExternalMatchConfig {
  players: ExternalBotConfig[];
  game_config: ExternalGameConfig;
  log_file: string;
}

export interface ExternalBotConfig {
  name: string;
  token: Token;
}

interface ExternalGameConfig {
  map_file: string;
  max_turns: number;
}

export default GameRunner;
