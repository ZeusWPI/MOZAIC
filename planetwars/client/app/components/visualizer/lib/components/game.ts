import { GameState, Player } from '../../../../lib/match/types';
import { MatchLog } from '../../../../lib/match';

import Config from '../util/config';

type PlayerNameFn = (playerNum: number) => string;

export default class Game {
  public matchLog: MatchLog;

  private _playerName: PlayerNameFn;
  private playerColorMap: Map<number, string>;
  private planetTypeMap: Map<string, string>;

  constructor(matchLog: MatchLog, playerName: PlayerNameFn) {
    this.matchLog = matchLog;
    this._playerName = playerName;
    this.planetTypeMap = new Map();
    this.playerColorMap = new Map();

    matchLog.getPlayers().forEach((playerNum) => {
      // player numbers are 1-based
      const colorNum = (playerNum - 1) % Config.playerColors.length;
      this.playerColorMap.set(playerNum, Config.playerColors[colorNum]);
    });
  }

  public playerName(playerNum?: number): string {
    if (playerNum) {
      return this._playerName(playerNum);
    } else {
      return 'Nobody';
    }
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
