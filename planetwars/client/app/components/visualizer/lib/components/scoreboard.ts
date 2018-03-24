import Game from "./game";
import Turn from "./turn";
import { Player } from "./interfaces";
import * as React from "react";
import * as d3 from "d3";

const h = require('react-hyperscript');
const {
  table,
  tr,
  td,
  tbody
} = require('hyperscript-helpers')(h);

const styles = require('./scoreboard.scss');

interface ScoreboardProps {
  game: Game,
  turnNum: number
}

interface ScoreboardState {
  scores: Score[]
}

interface Score {
  player: Player,
  y: number
}

export default class Scoreboard extends React.Component<ScoreboardProps, ScoreboardState> {
  svg:any;
  scores: Score[];

  constructor(props:ScoreboardProps){
    super(props);
    // let scores:Array<Score> = [];
    // let startY:number = 50;
    // let size:number = 30;
    // turn.players.forEach((player:Player, index:number) => {
    //   scores.push({
    //     'player': player,
    //     'y': startY + size * index
    //   });
    // });
    // this.state = {
    //   scores: scores,
    // }
  }

  componentDidUpdate() {
    if (this.props.game) {
      this.scores = this.state.scores;
      this.scores.forEach((score:Score, i:number) => {
        score.player.ship_count = this.state.scores[i].player.ship_count;
        score.player.planet_count = this.state.scores[i].player.planet_count;
      });
    }
  }

  componentWillReceiveProps(nextProps:ScoreboardProps) {
    // let scores:Score[] = this.updateScore(turn.players);
    // this.setState({ scores });
  }

  render() {
    let rows = this.state.scores.map((x:Score) => {
      return tr({ style:{ color: x.player.color } }, [
        td("\u25CF"),
        td(x.player.name),
        td(x.player.planet_count + ((x.player.planet_count == 1) ? "Planet" : " Planets")),
        td(x.player.ship_count + "\u2694")
      ])
  });
    return table(`.${styles.scoreboard}`, {}, tbody(rows));
  }
  updateScore(players:Player[]) {
    let scores:Score[] = [];
    this.state.scores.forEach((score:Score, i:number) => {
      scores.push({
        'player': players[i],
        'y': score.y
      });
    });
    return scores;
  }
}
