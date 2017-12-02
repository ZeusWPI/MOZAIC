import Game from "./game";
import Turn from "./turn";
import { Player } from "./interfaces";
import * as React from "react";
import * as d3 from "d3";

const h = require('react-hyperscript');
const {
  div,
  span,
  h1,
  button,
  i,
  li,
  input,
  p,
  ul,
  svg
} = require('hyperscript-helpers')(h);

const styles = require('./scoreboard.scss');

interface ScoreboardProps {
  game: Game,
  turnNum: number
}

interface ScoreboardState {
  turn: Turn,
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
    let turn:Turn = props.game.turns[props.turnNum];
    let scores:Array<Score> = [];
    let startY:number = 50;
    let size:number = 30;
    turn.players.forEach((player:Player, index:number) => {
      scores.push({
        'player': player,
        'y': startY + size * index
      });
    });
    this.state = {
      'turn': turn,
      'scores': scores
    }
  }

  componentDidUpdate() {
    if (this.props.game) {
      //if(!this.scores)
      this.scores = this.state.scores;

      this.scores.forEach((score:Score, i:number) => {
        score.player.ship_count = this.state.scores[i].player.ship_count;
        score.player.planet_count = this.state.scores[i].player.planet_count;
      });
      this.draw();
    }
  }

  componentWillReceiveProps(nextProps:ScoreboardProps) {
    let turn:Turn = nextProps.game.turns[nextProps.turnNum];
    let scores:Score[] = this.updateScore(turn.players);
    this.setState({
      'turn': turn,
      'scores': scores
    });
  }

  render() {
    return h(`svg.${styles.scoreboard}`, {
      ref: (svg:any) => {
        this.svg = svg;
      }
    });
  }

  draw() {
    d3.select(this.svg).selectAll('*').remove();
    var scores:any = d3.select(this.svg).selectAll('.score').data(this.scores);

    var container:any = scores.enter().append('g').attr('class', 'score');
    container.attr('font-family', 'sans-serif')
    .attr("font-size", 0.8 + 'vw')
    .attr('fill', (d:Score) => d.player.color);

    container.append('circle').attr('r', (d:Score) => 5)
    .attr('cx', '5%')
    .attr('cy', (d:Score) => d.y)
    .attr('fill', (d:Score) => d.player.color);

    container.append('text')
      .attr('class', 'player_name')
      .attr('x', (d:Score) => "15%")
      .attr('y', (d:Score) => d.y + 5)
      .text((d:Score) => d.player.name);

    container.append('text')
     .attr('class', 'planet_count')
     .attr('x', (d:Score) => "50%")
     .attr('y', (d:Score) => d.y + 5)
     .merge(container)
     .text((d:Score) => d.player.planet_count);

    container.append('circle')
     .attr('r', (d:Score) => "3%")
     .attr('cx', (d:Score) => "60%")
     .attr('cy', (d:Score) => d.y)
     .attr('fill', 'url(#earth)')
     .attr('stroke', (d:Score) => d.player.color);

    container.append('text').attr('class', 'strength')
     .attr('x', (d:Score) => "80%")
     .attr('y', (d:Score) => d.y + 5)
     .merge(container)
     .text((d:Score) => d.player.ship_count + " \u2694");
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
