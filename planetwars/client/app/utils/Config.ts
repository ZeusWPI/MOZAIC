/* tslint:disable:member-ordering */
import * as p from 'path';
import { remote } from 'electron';
import { Match, MapId, MatchId } from './GameModels';

export class Config {
  private static _data = 'data';
  private static _bots = 'bots';
  private static _matches = 'matches';
  private static _maps = 'maps';
  private static _bin = 'bin';
  private static _configs = 'configs';

  public static base = p.resolve(remote.app.getPath('userData'));
  public static bin = p.resolve(Config._bin);
  public static data = p.resolve(Config.base, Config._data);

  public static bots = p.resolve(Config.data, Config._bots);
  public static matches = p.resolve(Config.data, Config._matches);
  public static maps = p.resolve(Config.data, Config._maps);
  public static configs = p.resolve(Config.data, Config._configs);
  public static matchRunner = p.resolve(Config.bin, 'mozaic_bot_driver');

  // This used for knowing which dirs need initialisation
  public static dirs = [
    Config.data,
    Config.bin,
    Config.bots,
    Config.matches,
    Config.maps,
    Config.configs,
  ];

  public static matchLogPath(matchId: MatchId): string {
    return p.resolve(Config.matches, matchId + '.json');
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
    return p.resolve(Config.configs, `${uuid}.json`);
  }
}
