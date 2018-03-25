import * as fs from 'mz/fs';
import { v4 as uuidv4 } from 'uuid';
import * as Promise from 'bluebird';

import { Config } from './Config';
import { IMapMeta, GameMap, isGameMap } from './GameModels';

export class Importer {
  public static importMapFromFile(orPath: string): Promise<IMapMeta> {
    return Promise.resolve(fs.readFile(orPath))
      .then((buffer) => buffer.toString())
      .then((contents) => JSON.parse(contents))
      .then((map: GameMap) => {
        if (!isGameMap(map)) { return Promise.reject(new Error('Map is not valid')); }
        const uuid = uuidv4();
        const mapPath = Config.generateMapPath(uuid);
        const slots = map.planets.filter((p) => p.owner !== undefined).length;
        const name = map.name;
        const createdAt = new Date(Date.now());
        return Promise
          .resolve(fs.writeFile(mapPath, JSON.stringify(map, undefined, 4)))
          .return({ uuid, mapPath, slots, name, createdAt });
      });
  }
}
