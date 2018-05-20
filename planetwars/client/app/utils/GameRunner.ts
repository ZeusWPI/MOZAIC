import * as fs from 'fs';
import * as tmp from 'tmp';
import { EventEmitter } from 'events';
import { execFile } from 'child_process';

// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');

import * as crypto from 'crypto';
import { MatchConfig, Token, BotSlot } from '../database/models';
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
    const { gameConfig: { maxTurns, mapFile }, logFile, address } = conf;
    const players = conf.players;
    const gameConfig = { max_turns: maxTurns, map_file: mapFile };
    this.conf = {
      players,
      address,
      game_config: gameConfig,
      log_file: logFile,
    };
  }

  public run() {
    // TODO: maybe make sure this isn't called twice
    this.runBotRunner();
  }

  private runBotRunner() {
    const configFile = this.writeConfigFile();
    console.log(configFile);
    const process = execFile(Config.matchRunner, [configFile]);
    process.stdout.on('data', (d: Buffer) => console.log(d.toString('utf-8')));
    process.stderr.on('data', (d: Buffer) => console.log(d.toString('utf-8')));
    process.on('close', () => this.emit('matchEnded'));
    process.on('error', (err: Error) => this.emit('error', err));
    this.emit('matchStarted');
  }

  private writeConfigFile() {
    // TODO: maybe doing this async would be better
    const file = tmp.fileSync();
    const json = JSON.stringify(this.conf);
    fs.writeFileSync(file.fd, json);
    return file.name;
  }
}

export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// External Configs -----------------------------------------------------------
// How the game server expects them

export interface ExternalMatchConfig {
  players: ExternalBotConfig[];
  game_config: ExternalGameConfig;
  address: string;
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
