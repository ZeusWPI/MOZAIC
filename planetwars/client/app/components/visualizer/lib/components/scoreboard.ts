import Game from "./game";
import * as React from "react";
import { Component } from "react";
import * as d3 from "d3";
import { GameState, Player, PlayerMap } from '../../../../lib/match';

import * as h from 'react-hyperscript';

const {
  table,
  tr,
  td,
  tbody,
  // tslint:disable-next-line:no-var-requires
} = require('hyperscript-helpers')(h);

// tslint:disable-next-line:no-var-requires
const styles = require('./scoreboard.scss');

interface ScoreboardProps {
  game: Game;
  turnNum: number;
}

function countPlanets(players: PlayerMap<Player>, state: GameState) {
  const counts: { [playerNum: number]: number} = {};

  Object.keys(players).forEach((playerNum) => {
    counts[Number(playerNum)] = 0;
  });

  Object.keys(state.planets).forEach((planetName) => {
    const planet = state.planets[planetName];
    if (planet.owner) {
      counts[planet.owner] += 1;
    }
  });
  return counts;
}

function countShips(players: PlayerMap<Player>, state: GameState) {
  const counts: { [playerNum: number]: number} = {};

  Object.keys(players).forEach((playerNum) => {
    counts[Number(playerNum)] = 0;
  });

  Object.keys(state.planets).forEach((planetName) => {
    const planet = state.planets[planetName];
    if (planet.owner) {
      counts[planet.owner] += planet.shipCount;
    }
  });
  state.expeditions.forEach((expedition) => {
    counts[expedition.owner] += expedition.shipCount;
  });
  return counts;
}

export default class Scoreboard extends Component<ScoreboardProps> {
  private svg: any;

  public render() {
    const { game, turnNum } = this.props;
    const gameState = game.matchLog.gameStates[turnNum];
    const planetCounts = countPlanets(game.matchLog.players, gameState);
    const shipCounts = countShips(game.matchLog.players, gameState);

    const rows = Object.keys(game.matchLog.players).map((playerNum) => {
      const player = game.matchLog.players[Number(playerNum)];
      const planetCount = planetCounts[player.number];
      return tr({ style: { color: game.playerColor(player.number) } }, [
        h('i.fa.fa-cogs', {
          'aria-hidden': true,
        }),
        td(player.name),
        td(planetCount),
        h('i.fa.fa-globe', {
          'aria-hidden': true,
        }),
        td(shipCounts[player.number]),
        h('i.fa.fa-rocket', {
          'aria-hidden': true,
        }),
      ]);
    });
    return table(`.${styles.scoreboard}`, {}, tbody(rows));
  }
}
