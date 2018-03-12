import { GameMetrics } from "./Models"

export default class Config {
  static botsLocation = "./bots/"
  static gamesLocation = "./games/"
  static mapsLocation = "./maps/"
  static binaryLocation = ""

  static generateGamesPath(game:GameMetrics)
  {
    return Config.botsLocation + game.timestamp + ".json"
  }
}
