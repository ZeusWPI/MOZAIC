import { Player, TurnData } from "./interfaces"
import Turn from "./turn"

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

  constructor(json:string) {
    this.playerColors = d3.scaleOrdinal(d3.schemeCategory10);
    this.planetTypeMap = new Map();

    this.parseTurns(json);
    this.findWinner();
  }

  parseTurns(json:string) {
    let turns_json:string[] = json.trim().split('\n');
    let meta_json:string = turns_json.shift() as string;

    this.metaData = JSON.parse(meta_json);

    this.players = this.metaData.players;
    this.turns = turns_json.map(turn_json => {
      let obj:TurnData = JSON.parse(turn_json);
      return new Turn(obj, this);
    });
  }

  playerColor(name:string) {
    return this.playerColors(name);
  }

  planetType(name:string) {
    if (!this.planetTypeMap.has(name)) {
      var types:string[] = Config.planet_types;
      var type:string = types[Math.floor(Math.random() * types.length)];
      this.planetTypeMap.set(name, type);
    }
    return this.planetTypeMap.get(name);
  }

  findWinner() {
    let players:Player[] = this.turns[this.turns.length -1].players;
    let survivors:Player[] = players.filter(p => p.ship_count > 0);
    if (survivors.length > 1) {
      // it's a draw
      this.winner = undefined;
    } else {
      this.winner = survivors[0];
    }
  }
}
