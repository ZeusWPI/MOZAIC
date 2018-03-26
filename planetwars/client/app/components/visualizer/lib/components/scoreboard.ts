import Game from "./game";
import * as React from "react";
import { Component } from "react";
import * as d3 from "d3";
import { Player } from '../../../../lib/match/types';
import { GameState } from '../../../../lib/match/log';

const h = require('react-hyperscript');
const {
  table,
  tr,
  td,
  tbody
} = require('hyperscript-helpers')(h);

const styles = require('./scoreboard.scss');

interface ScoreboardProps {
  game: Game;
  turnNum: number;
}

function countPlanets(players: Player[], state: GameState) {
  const counts: any = {};
  players.forEach((player) => {
    counts[player.uuid] = 0;
  });
  Object.keys(state.planets).forEach((planetName) => {
    const planet = state.planets[planetName];
    if (planet.owner) {
      counts[planet.owner.uuid] += 1;
    }
  });
  return counts;
}

function countShips(players: Player[], state: GameState) {
  const counts: any = {};
  players.forEach((player) => {
    counts[player.uuid] = 0;
  });
  Object.keys(state.planets).forEach((planetName) => {
    const planet = state.planets[planetName];
    if (planet.owner) {
      counts[planet.owner.uuid] += planet.shipCount;
    }
  });
  state.expeditions.forEach((expedition) => {
    counts[expedition.owner.uuid] += expedition.shipCount;
  });
  return counts;
}

export default class Scoreboard extends Component<ScoreboardProps> {
  svg: any;

  render() {
    const { game, turnNum } = this.props;
    const gameState = game.matchLog.gameStates[turnNum];
    const planetCounts = countPlanets(game.matchLog.players, gameState);
    const shipCounts = countShips(game.matchLog.players, gameState);

    const rows = game.matchLog.players.map((player) => {
      const planetCount = planetCounts[player.uuid];
      return tr({ style: { color: game.playerColor(player) } }, [
        h('i.fa.fa-cogs', {
          'aria-hidden': true
        }),
        td(player.name),
        td(planetCount),
        h('i.fa.fa-globe', {
          'aria-hidden': true
        }),
        td(shipCounts[player.uuid]),
        h('i.fa.fa-rocket', {
          'aria-hidden': true
        })
      ]);
    });
    return table(`.${styles.scoreboard}`, {}, tbody(rows));
  }
}
