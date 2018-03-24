import { GameState } from '../../../../lib/match/types';
import { MatchLog } from '../../../../lib/match/log';

const d3 = require('d3');
const Config = require('../util/config');

export default class Game {
  playerColors: any;
  planetTypeMap: Map<string, string>;
  matchLog: MatchLog;

  constructor(matchLog: MatchLog) {
    this.playerColors = d3.scaleOrdinal(d3.schemeCategory10);
    this.planetTypeMap = new Map();
    this.matchLog = matchLog;
  }

  playerColor(name: string) {
    return this.playerColors(name);
  }

  planetType(name: string) {
    if (!this.planetTypeMap.has(name)) {
      var types: string[] = Config.planet_types;
      var type: string = types[Math.floor(Math.random() * types.length)];
      this.planetTypeMap.set(name, type);
    }
    return this.planetTypeMap.get(name);
  }
}
