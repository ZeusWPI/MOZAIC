import { GameState } from '../../../../lib/match/types';
import { Player, TurnData } from './interfaces';
import Turn from './turn';

const d3 = require('d3');
const Config = require('../util/config');

interface MetaData {
  players: string[]
}

export default class Game {
  winner?: Player;
  playerColors: any;
  planetTypeMap: Map<string, string>;
  metaData: MetaData;
  players: string[];
  turns: Turn[];

  constructor(playerData: MetaData, gameLog: GameState[]) {
    this.playerColors = d3.scaleOrdinal(d3.schemeCategory10);
    this.planetTypeMap = new Map();

    this.metaData = playerData
    this.players = this.metaData.players;
    // TODO: fix
    //this.turns = gameLog.map((turn) => new Turn(turn, this))

    this.findWinner();
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

  findWinner() {
    let players: Player[] = this.turns[this.turns.length - 1].players;
    let survivors: Player[] = players.filter(p => p.ship_count > 0);
    if (survivors.length > 1) {
      // it's a draw
      this.winner = {
        name: "Nobody",
        color: d3.color("black"),
        ship_count: 0,
        planet_count: 0
      };
    } else {
      this.winner = survivors[0];
    }
  }
}
