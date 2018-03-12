import * as fs from 'fs';
import * as Promise from 'bluebird';
import * as util from 'util';
import * as p from 'path';

import {BotConfig, isBotConfig} from './Models';
import {Config} from './Config';

// TODO: Maybe not make static?
export class ObjectManager {

  static existsAsync = (path: string) => new Promise((res, rej) => {
    fs.exists(path, res)
  });

  static initDirs(): Promise<void> {
    const dirs = [Config.bots, Config.maps, Config.games];
    const mkdirAsync = Promise.promisify(fs.mkdir);

    return Promise.resolve(dirs)
      .filter((dir: string) => ObjectManager.existsAsync(dir).then(exists => !exists))
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

  static deleteBotByName(name: string): Promise<{}> {
    let dir: string = Config.bots;
    let path = `${dir}/${name}.json`;
    let unlinkAsync = Promise.promisify(fs.unlink);
    return ObjectManager.existsAsync(path)
      .then(
        (exists) => {
          if (exists) {
            if (confirm(`Are you sure you want to delete ${name}?`)) {
              return unlinkAsync(path);
            }
            else {
              return Promise.reject('Cancelled')
            }
          }
          else {
            throw new Error(`File ${path} does not exist`)
          }
        })
  }

  static saveBotFile(bot: BotConfig): Promise<void> {

    let mkdirAsync = Promise.promisify(fs.mkdir);
    let writeFileAsync = Promise.promisify(fs.writeFile);

    let path = Config.botPath(bot.name);
    return ObjectManager.existsAsync(Config.bots).then(
      () => Promise.resolve(),
      () => mkdirAsync(Config.bots)
    )
      .then(
        () => this.existsAsync(path)
      )
      .then(
        (exists) => {
          if (exists) {
            if (!confirm(`Bot ${bot.name} already exists, are you sure you want to overwrite it?`)) {
              return Promise.reject("cancelled");
            }
          }

          return writeFileAsync(path, JSON.stringify(
            {
              name: bot.name,
              command: bot.command,
              args: bot.args
            }
          ))
        }).then(() => Promise.resolve())
  }
}

