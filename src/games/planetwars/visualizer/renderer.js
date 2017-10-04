const d3 = require('d3');
const React = require('react');
const h = require('react-hyperscript');

class Renderer extends React.Component {
  render() {
    return h('svg.game-svg', { ref: (svg) => { this.svg = svg; } });
  }
}

module.exports = Renderer;
