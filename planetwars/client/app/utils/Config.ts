/* tslint:disable:member-ordering */
import * as p from 'path';
import { IMatchMetaData, MapId } from './GameModels';

export class Config {
  private static _data = 'data';
  private static _bots = 'bots';
  private static _matches = 'matches';
  private static _maps = 'maps';
  private static _bin = 'bin';
  private static _configs = 'configs';

  public static bots = p.resolve(Config._data, Config._bots);
  public static matches = p.resolve(Config._data, Config._matches);
  public static maps = p.resolve(Config._data, Config._maps);
  public static config = p.resolve(Config._data, Config._configs);
  public static matchRunner = p.resolve(Config._bin, "mozaic_bot_driver");

  public static generateMatchPath(match: IMatchMetaData): string {
    return p.resolve(Config.matches, match.uuid + '.json');
  }

  public static generateMapPath(uuid: MapId): string {
    return p.resolve(Config.maps, uuid + '.json');
  }

  public static botPath(name: string): string {
    return p.resolve(Config.bots, `${name}.json`);
  }

  public static mapMath(name: string): string {
    return p.resolve(Config.maps, `${name}.json`);
  }

  public static configPath(uuid: string): string {
    return p.resolve(Config.config, `${uuid}.json`);
  }
}
