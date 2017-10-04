const d3 = require('d3');
const React = require('react');
const h = require('react-hyperscript');

class Renderer extends React.Component {
  componentDidUpdate() {
    this.calculateViewBox();
    console.log(this.props.turn);
  }

  componentDidMount() {
    this.container = d3.select(this.svg).append('g');
  }

  calculateViewBox() {
    let padding = 5;
    // TODO: hook config for this
    let orbit_size = 5;
    let offset = orbit_size + padding;
    let ps = this.props.turn.planets;
    let x_min = d3.min(ps, p => p.x - p.size) + offset;
    let x_max = d3.max(ps, p => p.x + p.size) + offset;
    let y_min = d3.min(ps, p => p.y - p.size) - offset;
    let y_max = d3.max(ps, p => p.y + p.size) + offset;
    let x_width = x_max - x_min;
    let y_width = y_max - y_min;
    let viewBox = `${x_min} ${y_min} ${x_width} ${y_width}`;
    d3.select(this.svg).attr('viewBox', viewBox);
  }
  
  render() {
    return h('svg.game-svg', { ref: (svg) => { this.svg = svg; } });
  }
}

module.exports = Renderer;
