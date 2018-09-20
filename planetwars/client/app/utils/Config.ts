/* tslint:disable:member-ordering */
import * as p from 'path';
import { remote } from 'electron';
import { v4 as uuidv4 } from 'uuid';

import { Match, MapId, MatchId } from '../database/models';

export const appPath = (process.env.NODE_ENV === 'development') ?
  p.resolve('.') :
  p.resolve(remote.app.getAppPath());

export class Config {
  private static _data = 'data';
  private static _bots = 'bots';
  private static _matches = 'matches';
  private static _maps = 'maps';
  private static _bin = 'bin';
  private static _configs = 'configs';
  private static _resources = p.resolve(appPath, 'resources');

  // Base path for user data
  public static base = p.resolve(remote.app.getPath('userData'));

  // Path were we keep binaries such as the matchrunner
  public static bin = p.resolve(appPath, Config._bin);

  // Data folder in user data for maps, bots, matches, ...
  public static data = p.resolve(Config.base, Config._data);

  public static bots = p.resolve(Config.data, Config._bots);
  public static matches = p.resolve(Config.data, Config._matches);
  public static maps = p.resolve(Config.data, Config._maps);
  public static configs = p.resolve(Config.data, Config._configs);
  public static matchRunner = p.resolve(Config.bin, 'mozaic_bot_driver');
  public static isDev = (process.env.NODE_ENV === 'development');

  // This used for knowing which dirs need initialisation
  public static dirs = [
    Config.data,
    Config.bots,
    Config.matches,
    Config.maps,
    Config.configs,
  ];

  public static staticMaps = p.resolve(Config._resources, 'maps');

  // Yes this sucks, but it's the simplest thing right now
  private static _staticBots = p.resolve(Config._resources, 'bots');
  public static staticBots: { [key: string]: string } = {
    [p.resolve(Config._staticBots, 'simple1.py')]: 'SimpleBot 1',
    [p.resolve(Config._staticBots, 'simple2.py')]: 'SimpleBot 2',
  };

  public static generateMatchId(): MatchId {
    return uuidv4();
  }

  public static matchLogPath(matchId: MatchId): string {
    return p.resolve(Config.matches, matchId + '.json');
  }

  public static generateMapPath(uuid: MapId): string {
    return p.resolve(Config.maps, uuid + '.json');
  }

  public static mapMath(name: string): string {
    return p.resolve(Config.maps, `${name}.json`);
  }

  public static configPath(uuid: string): string {
    return p.resolve(Config.configs, `${uuid}.json`);
  }
}
