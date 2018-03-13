const d3 = require('d3');
const React = require('react');
const h = require('react-hyperscript');

const ResourceLoader = require('../util/resourceLoader');
const spaceMath = require('../util/spacemath')
const Config = require('../util/config');
const PlanetRenderer = require('../renderers/planets');
const ExpeditionRenderer = require('../renderers/expeditions');
const Voronoi = require('./voronoi.js')
let styles = require('./renderer.scss');


class Renderer extends React.Component {
  componentDidUpdate() {
    if (this.props.game) {
      this.turn = this.props.game.turns[this.props.turnNum];
      this.calculateViewBox();
      this.draw();
      this.voronoiRenderer(this.props.turnNum, this.voronoiContainer);
    }
  }

  componentDidMount() {
    this.loadResources();
    this.voronoiContainer = d3.select(this.svg).append('g');
    this.container = d3.select(this.svg).append('g');
    this.planetRenderer = new PlanetRenderer(this.container);
    this.expeditionRenderer = new ExpeditionRenderer(this.container);

    this.turn = this.props.game.turns[0];
    this.calculateViewBox();
    this.voronoiRenderer = Voronoi.initVoronoi(this.props.game.turns, Config.player_color, [this.min, this.max]);
    this.createZoom();
    if (this.props.game) {
      this.turn = this.props.game.turns[this.props.turnNum]
      this.calculateViewBox();
      this.draw();
    }
  }

  render() {
    return h(`svg.${styles.battlefield}`, {
      ref: (svg) => {
        this.svg = svg;
      }
    });
  }

  calculateViewBox() {
    let padding = 5;
    // TODO: hook config for this
    let orbit_size = 5;
    let offset = orbit_size + padding;
    let ps = this.turn.planets;
    let x_min = d3.min(ps, p => p.x - p.size) - offset;
    let x_max = d3.max(ps, p => p.x + p.size) + offset;
    let y_min = d3.min(ps, p => p.y - p.size) - offset;
    let y_max = d3.max(ps, p => p.y + p.size) + offset;
    let x_width = x_max - x_min;
    let y_width = y_max - y_min;
    let viewBox = `${x_min} ${y_min} ${x_width} ${y_width}`;
    this.scale = (x_max - x_min) / 50;
    this.min = [x_min, y_min];
    this.max = [x_max, y_max];
    d3.select(this.svg).attr('viewBox', viewBox);
  }

  loadResources() {
    // TODO: improve API
    new ResourceLoader(d3.select(this.svg)).setupPatterns();
  }

  createZoom() {
    var zoom = d3.zoom()
      .scaleExtent(Config.max_scales)
      .on('zoom', () => {
        var transform = d3.event.transform;
        transform.x = spaceMath.clamp(transform.x, -this.max[0] / 2, this.max[0] / 2);
        transform.y = spaceMath.clamp(transform.y, -this.max[1] / 2, this.max[1] / 2);
        this.container.attr('transform', transform);
        this.voronoiContainer.attr('transform', transform);
      });
    d3.select(this.svg).call(zoom);
  }

  draw() {
    let params = {
      speed: this.props.speed,
      scale: this.scale
    };
    this.planetRenderer.draw(this.turn.planets, params);
    this.expeditionRenderer.draw(this.turn.expeditions, params);
  }
}

module.exports = Renderer;