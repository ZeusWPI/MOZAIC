import * as fs from 'fs';
import * as Promise from 'bluebird';
import * as util from 'util';
import * as p from 'path';

import { BotConfig, isBotConfig } from './Models';
import { Config } from './Config';

// TODO: Maybe not make static?
export class ObjectLoader {

  static initDirs(): Promise<void> {
    const dirs = [Config.bots, Config.maps, Config.games];
    const mkdirAsync = Promise.promisify(fs.mkdir);
    const existsAsync = (path: string) => new Promise((res, rej) => {
      fs.exists(path, res)
    });

    return Promise.resolve(dirs)
      .filter((dir: string) => existsAsync(dir).then(exists => !exists))
      .each((dir: string) => mkdirAsync(dir))
      .all().then()
  }

  static loadBots(): Promise<BotConfig[]> {
    let dir = Config.bots;
    let readDirAsync = Promise.promisify(fs.readdir);
    let readFileAsync = Promise.promisify(fs.readFile);

    type Parser = (path: string) => Promise<BotConfig>;
    let parse: Parser = (path) =>
      readFileAsync(p.resolve(dir, path))
        .then(data => data.toString())
        .then(JSON.parse)
        .then(data => {
          if (!isBotConfig(data)) {
            let obj = JSON.stringify(data);
            throw new Error(`File is not a valid botconfig: ${path}, ${obj}`);
          }
          return data;
        });

    return readDirAsync(dir).map((path: string) => parse(path));
  }
}