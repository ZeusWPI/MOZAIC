const React = require('react');
const d3 = require('d3');
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

class Scoreboard extends React.Component {
  constructor(props){
    super(props);
    let turn = props.game.turns[props.turnNum];
    let scores = [];
    let startY = 50;
    let size = 30;
    turn.players.forEach((player, index) => {
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
      /*
      this.scores.forEach((score, i) => {
        score.player.ship_count = this.state.scores[i].player.ship_count;
        score.player.planet_count = this.state.scores[i].player.planet_count;
      });*/
      this.draw();
    }
  }

  componentWillReceiveProps(nextProps) {
    let turn = nextProps.game.turns[nextProps.turnNum];
    let scores = this.updateScore(turn.players);
    this.setState({
      'turn': turn,
      'scores': scores
    });
  }

  render() {
    return h(`svg.${styles.scoreboard}`, {
      ref: (svg) => {
        this.svg = svg;
      }
    });
  }

  draw() {
    var scores = d3.select(this.svg).selectAll('.score').data(this.scores);

    var container = scores.enter().append('g').attr('class', 'score');
    container.attr('font-family', 'sans-serif')
    .attr("font-size", 0.8 + 'vw')
    .attr('fill', d => d.player.color);

    container.append('circle').attr('r', d => 5)
    .attr('cx', '5%')
    .attr('cy', d => d.y)
    .attr('fill', d => d.player.color);

    container.append('text')
      .attr('class', 'player_name')
      .attr('x', d => "15%")
      .attr('y', d => d.y + 5)
      .text(d => d.player.name);

    container.append('text')
     .attr('class', 'planet_count')
     .attr('x', d => "50%")
     .attr('y', d => d.y + 5)
     .merge(container)
     .text(d => d.player.planet_count);

    container.append('circle')
     .attr('r', d => "3%")
     .attr('cx', d => "60%")
     .attr('cy', d => d.y)
     .attr('fill', 'url(#earth)')
     .attr('stroke', d => d.player.color);

    container.append('text').attr('class', 'strength')
     .attr('x', d => "80%")
     .attr('y', d => d.y + 5)
     .merge(container)
     .text(d => d.player.ship_count + " \u2694");
  }

  updateScore(players) {
    let scores = [];
    this.state.scores.forEach((score, i) => {
      scores.push({
        'player': players[i],
        'y': score.y
      });
    });
    return scores;
  }
}

module.exports = Scoreboard
