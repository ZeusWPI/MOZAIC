import * as Promise from 'bluebird';
import * as fs from 'fs';
import * as p from 'path';
import * as util from 'util';

import { Config } from './Config';
import { IBotConfig, isBotConfig } from './ConfigModels';
import { IMatchMetaData } from './GameModels';

// TODO: Maybe not make static?
export class ObjectLoader {

  public static initDirs(): Promise<void> {
    const dirs = [Config.bots, Config.maps, Config.matches];
    const mkdirAsync = Promise.promisify(fs.mkdir);
    const existsAsync = (path: string) => new Promise((res, rej) => {
      fs.exists(path, res)
    });

    return Promise.resolve(dirs)
      .filter((dir: string) => existsAsync(dir).then(exists => !exists))
      .each((dir: string) => mkdirAsync(dir))
      .all().then()
  }

  // public static loadBots(): Promise<IBotConfig[]> {
  //   const dir = Config.bots;
  //   const readDirAsync = Promise.promisify(fs.readdir);
  //   const readFileAsync = Promise.promisify(fs.readFile);

  //   type Parser = (path: string) => Promise<IBotConfig>;
  //   const parse: Parser = (path) =>
  //     readFileAsync(p.resolve(dir, path))
  //       .then((data) => data.toString())
  //       .then(JSON.parse)
  //       .then((data) => {
  //         if (!isBotConfig(data)) {
  //           const obj = JSON.stringify(data);
  //           throw new Error(`File is not a valid botconfig: ${path}, ${obj}`);
  //         }
  //         return data;
  //       });

  //   return readDirAsync(dir).map((path: string) => parse(path));
  // }
}
