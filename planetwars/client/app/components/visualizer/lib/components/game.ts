import { GameState, Player } from '../../../../lib/match/types';
import { MatchLog } from '../../../../lib/match';

import Config from '../util/config';

export default class Game {
  public matchLog: MatchLog;

  private playerColorMap: Map<number, string>;
  private planetTypeMap: Map<string, string>;

  constructor(matchLog: MatchLog) {
    this.matchLog = matchLog;
    this.planetTypeMap = new Map();
    this.playerColorMap = new Map();
    Object.keys(matchLog.players).forEach((playerNum, idx) => {
      this.playerColorMap.set(Number(playerNum), Config.playerColors[idx]);
    });
  }

  public playerColor(playerNum?: number): string {
    if (playerNum) {
      return this.playerColorMap.get(playerNum)!;
    }
    return Config.neutralColor;
  }

  public planetType(name: string): string {
    if (!this.planetTypeMap.has(name)) {
      const types: string[] = Config.planetTypes;
      const type: string = types[Math.floor(Math.random() * types.length)];
      this.planetTypeMap.set(name, type);
    }
    return this.planetTypeMap.get(name)!;
  }
}
