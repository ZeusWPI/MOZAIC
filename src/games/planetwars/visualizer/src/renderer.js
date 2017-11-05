const d3 = require('d3');
const React = require('react');
const h = require('react-hyperscript');
const VisualsHelper = require('./util/visualsHelper');

const PlanetRenderer = require('./renderers/planets');
const ExpeditionRenderer = require('./renderers/expeditions');


class Renderer extends React.Component {
  componentDidUpdate() {
    this.calculateViewBox();
    this.draw();
  }

  componentDidMount() {
    this.loadResources();
    this.container = d3.select(this.svg).append('g');
    this.planetRenderer = new PlanetRenderer(this.container);
    this.expeditionRenderer = new ExpeditionRenderer(this.container);
  }
  
  render() {
    return h('svg.game-svg', { ref: (svg) => { this.svg = svg; } });
  }

  calculateViewBox() {
    let padding = 5;
    // TODO: hook config for this
    let orbit_size = 5;
    let offset = orbit_size + padding;
    let ps = this.props.turn.planets;
    let x_min = d3.min(ps, p => p.x - p.size) - offset;
    let x_max = d3.max(ps, p => p.x + p.size) + offset;
    let y_min = d3.min(ps, p => p.y - p.size) - offset;
    let y_max = d3.max(ps, p => p.y + p.size) + offset;
    let x_width = x_max - x_min;
    let y_width = y_max - y_min;
    let viewBox = `${x_min} ${y_min} ${x_width} ${y_width}`;
    this.scale = (x_max - x_min) / 50;
    d3.select(this.svg).attr('viewBox', viewBox);
  }

  loadResources() {
    // TODO: improve API
    new VisualsHelper.ResourceLoader(d3.select(this.svg)).setupPatterns();
  }

  draw() {
    let params = { speed: this.props.speed, scale: this.scale };
    this.planetRenderer.draw(this.props.turn.planets, params);
    this.expeditionRenderer.draw(this.props.turn.expeditions, params);
  }
}

module.exports = Renderer;
