import { GameMetrics } from "./Models"

export class Config {
  static botsLocation = "./bots/"
  static gamesLocation = "./games/"
  static mapsLocation = "./maps/"

  static generateGamesPath(game:GameMetrics)
  {
    return Config.botsLocation + game.timestamp + ".json"
  }
}
