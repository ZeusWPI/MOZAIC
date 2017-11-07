const React = require('react');
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

class Scoreboard extends React.Component {
  constructor(props){
    super(props);
    let turn = props.game.turns[props.turnNum]; 
    this.state = {
      turn: turn,
      players: turn.players
    } 
  }

  componentWillReceiveProps(nextProps) {
    let turn = nextProps.game.turns[nextProps.turnNum]; 
    this.setState({
      turn: turn,
      players: turn.players
    });
  }

  render() {
    let playerStats = this.state.players.map((player) => {
      return li([
        div([
          span([`${player.name}: ${player.ship_count} Ships | ${player.planet_count} Planets`]),
        ])
      ])
    });
    return div('#scoreboard', [
      ul('#scoreboard-player-stats', playerStats)
    ]);
  };
}

module.exports = Scoreboard