import * as d3 from 'd3';
const React = require('react');
const h = require('react-hyperscript');

import Config from '../util/config';
const ResourceLoader = require('../util/resourceLoader');
const spaceMath = require('../util/spacemath')
const PlanetRenderer = require('../renderers/planets');
const ExpeditionRenderer = require('../renderers/expeditions');
const Voronoi = require('./voronoi.js')
let styles = require('./renderer.scss');

class Renderer extends React.Component {
  componentDidUpdate() {
    if (this.props.game) {
      this.gameState = this.props.game.matchLog.gameStates[this.props.turnNum];
      this.calculateViewBox();
      this.draw();
      //this.voronoiRenderer(this.props.turnNum, this.voronoiContainer);
    }
  }

  componentDidMount() {
    this.loadResources();
    this.voronoiContainer = d3.select(this.svg).append('g');
    this.container = d3.select(this.svg).append('g');
    this.planetRenderer = new PlanetRenderer(this.props.game, this.container);
    this.expeditionRenderer = new ExpeditionRenderer(
      this.props.game,
      this.container,
    );

    this.gameState = this.props.game.matchLog.gameStates[0];
    this.calculateViewBox();
    // this.voronoiRenderer = Voronoi.initVoronoi(
    //   this.props.game.turns,
    //   Config.player_color,
    //   [this.min, this.max]
    // );
    this.createZoom();
    if (this.props.game) {
      this.gameState = this.props.game.matchLog.gameStates[this.props.turnNum]
      this.calculateViewBox();
      this.draw();
    }
  }

  render() {
    return h(`svg.${styles.battlefield}`, {
      ref: (svg: any) => {
        this.svg = svg;
      },
    });
  }

  calculateViewBox() {
    // TODO: hook config for this
    const offset = Config.orbitSize + Config.padding;
    const ps = Object.keys(this.gameState.planets).map((planetName: string) => {
      return this.gameState.planets[planetName];
    });
    const xMin = d3.min(ps, (p: any) => p.x - Config.planetSize)! - offset;
    const xMax = d3.max(ps, (p: any) => p.x + Config.planetSize)! + offset;
    const yMin = d3.min(ps, (p: any) => p.y - Config.planetSize)! - offset;
    const yMax = d3.max(ps, (p: any) => p.y + Config.planetSize)! + offset;
    const xWidth = xMax - xMin;
    const yWidth = yMax - yMin;
    const viewBox = `${xMin} ${yMin} ${xWidth} ${yWidth}`;
    this.scale = (xMax - xMin) / 50;
    this.min = [xMin, yMin];
    this.max = [xMax, yMax];
    d3.select(this.svg).attr('viewBox', viewBox);
  }

  loadResources() {
    // TODO: improve API
    new ResourceLoader(d3.select(this.svg)).setupPatterns();
  }

  createZoom() {
    var zoom = d3.zoom()
      .scaleExtent(Config.maxScales)
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
    const planets = Object.keys(this.gameState.planets).map((planetName) => {
      return this.gameState.planets[planetName];
    });
    this.planetRenderer.draw(planets, params);
    this.expeditionRenderer.draw(this.gameState.expeditions, params);
  }
}

module.exports = Renderer;
