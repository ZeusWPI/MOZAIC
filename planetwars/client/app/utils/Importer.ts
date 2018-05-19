import { writeFile, readFile } from 'mz/fs';
import { v4 as uuidv4 } from 'uuid';
import * as Promise from 'bluebird';
import * as path from 'path';

import { Config } from './Config';
import { MapMeta, GameMap, isGameMap } from '../database/models';

export class Importer {
  public static importMapFromFile(orPath: string): Promise<MapMeta> {
    return Promise.resolve(readFile(orPath, {}))
      .then((buffer) => buffer.toString())
      .then((contents) => JSON.parse(contents))
      .then((map: GameMap) => {
        if (!isGameMap(map)) { return Promise.reject(new Error('Map is not valid')); }
        const uuid = uuidv4();
        const mapPath = Config.generateMapPath(uuid);
        const slots = map.planets.filter((p) => p.owner !== undefined).length;
        const name = path.parse(orPath).name;
        const createdAt = new Date(Date.now());
        return Promise
          .resolve(writeFile(mapPath, JSON.stringify(map, undefined, 4)))
          .return({ uuid, mapPath, slots, name, createdAt });
      });
  }
}
