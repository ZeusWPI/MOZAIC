/* tslint:disable:member-ordering */
import * as p from 'path';

export class Config {
  private static _data = 'data';
  private static _bots = 'bots';
  private static _matches = 'matches';
  private static _maps = 'maps';

  public static bots = p.resolve(Config._data, Config._bots);
  public static matches = p.resolve(Config._data, Config._matches);
  public static maps = p.resolve(Config._data, Config._maps);

  // static generateGamesPath(game: IGameMetrics): string {
  //   return p.resolve(Config.bots, game.timestamp + '.json');
  // }

  public static botPath(name: string): string {
    return p.resolve(Config.bots, `${name}.json`);
  }

  public static mapMath(name: string): string {
    return p.resolve(Config.maps, `${name}.json`);
  }
}
