import { GameMetrics } from './Models'
import * as p from 'path';


export class Config {
  static _data = 'data'
  static _bots = 'bots'
  static _games = 'games'
  static _maps = 'maps'

  static bots = p.resolve(Config._data, Config._bots)
  static games = p.resolve(Config._data, Config._games)
  static maps = p.resolve(Config._data, Config._maps)

  static generateGamesPath(game: GameMetrics): string {
    return p.resolve(Config.bots, game.timestamp + '.json');
  }

  static botPath(name: string): string {
    return p.resolve(Config.bots, `${name}.json`)
  }

  static mapMath(name: string): string {
    return p.resolve(Config.maps, `${name}.json`)
  }
}
