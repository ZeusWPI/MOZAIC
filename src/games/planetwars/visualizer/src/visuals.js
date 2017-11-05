const d3 = require('d3');
const Config = require('./config');
const Utils = require('./util');
const space_math = Utils.SpaceMath;

const VisualsHelper = require('./visualsHelper');
const Planets = VisualsHelper.Planets;
const Fleet = VisualsHelper.Fleet;
const Fleets = VisualsHelper.Fleets;
const Expeditions = VisualsHelper.Expeditions;
const Scores = VisualsHelper.Scores;
const ResourceLoader = VisualsHelper.ResourceLoader;
const Preprocessor = VisualsHelper.Preprocessor;


class Visuals {
  constructor() {
    this.scale = 1;
    this.svg = d3.select('#game');
    this.container = this.svg.append('g');
    this.scoreboard_container = d3.select('#score');
    new ResourceLoader(this.svg).setupPatterns();
  }

  init(model) {
    Preprocessor.preprocess(model.turns);
    this.generateViewBox(model.turns[0].planets);
    this.generateColorMap(model.turns[0].players);
    this.createZoom();
    this.generateWinnerBox(model.winner, this.color_map[model.winner]);
    this.animateFleets();
  }

  animateFleets() {
    this.fleet_timer = d3.timer(elapsed => {
      Fleets.animateFleets(this.svg, elapsed);
    });
  }

  clearVisuals() {
    this.container.selectAll('.planet_wrapper').remove();
    this.container.selectAll('.expedition').remove();
    d3.select('#score').selectAll('.score').remove();
  }

  generateViewBox(planets) {
    // Setup view
    var min_x = Infinity;
    var min_y = Infinity;
    var max_x = 0;
    var max_y = 0;
    var padding = 5;

    planets.forEach(e => {
      var offset = (e.size + Config.orbit_size + padding);
      var n_max_x = e.x + offset;
      var n_min_x = e.x - offset;
      var n_max_y = e.y + offset;
      var n_min_y = e.y - offset;

      if (n_max_x > max_x) {
        max_x = n_max_x;
      }
      if (n_min_x < min_x) {
        min_x = n_min_x;
      }
      if (n_max_y > max_y) {
        max_y = n_max_y;
      }
      if (n_min_y < min_y) {
        min_y = n_min_y;
      }
    });

    max_x += Math.abs(min_x);
    max_y += Math.abs(min_y);

    this.min = [min_x, min_y];
    this.max = [max_x, max_y];

    this.scale = max_x / 50;

    this.svg.attr('viewBox', min_x + ' ' + min_y + ' ' + max_x + ' ' + max_y);
  }

  generateColorMap(players) {
    // Color map
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    this.color_map = players.reduce((map, o, i) => {
      map[o] = color(i);
      return map;
    }, {});
    this.color_map[null] = "#d3d3d3";
  }

  createZoom() {
    var zoom = d3.zoom()
      .scaleExtent(Config.max_scales)
      .on('zoom', () => {
        var transform = d3.event.transform;
        transform.x = space_math.clamp(transform.x, -this.max[0] / 2, this.max[0] / 2);
        transform.y = space_math.clamp(transform.y, -this.max[1] / 2, this.max[1] / 2);
        this.container.attr('transform', transform);
      });
    this.svg.call(zoom);
  }

  generateWinnerBox(winner, color) {
    var card = d3.select('#end_card');
    card.select('#winner').text(winner).attr('style', 'color: ' + color);
  }

  update(turn, speed) {
    var planets = this.container.selectAll('.planet_wrapper').data(turn.planets, d => d.name);
    var expeditions = this.container.selectAll('.expedition').data(turn.expeditions, d => d.id);
    var scores = this.scoreboard_container.selectAll('.score').data(turn.scores, d => d.player);;

    this.addNewObjects(turn, planets, expeditions, scores);

    //PLANETS
    Planets.update(planets, this.color_map, speed);
    Planets.removeOld(planets);
    // EXPEDITIONS
    Expeditions.update(expeditions, speed);
    Expeditions.removeOld(expeditions);
    // SCORES
    Scores.update(scores);
  }

  addNewObjects(turn, planets, expeditions, scores) {
    // New objects
    var new_planets = planets.enter().append('g').attr('class', 'planet_wrapper');
    //TODO: MOVE  data binding
    var fleet_wrappers = new_planets.append('g').data(turn.planets.map(d => new Fleet(d, this.scale)));
    var new_expeditions = expeditions.enter().append('g').attr('class', 'expedition');
    var new_scores = scores.enter().append('g').attr('class', 'score');

    // Add the new objects
    Planets.addPlanetVisuals(new_planets, this.color_map, this.scale);
    Fleets.addFleetVisuals(fleet_wrappers, this.color_map);
    Expeditions.addExpeditionVisuals(new_expeditions, this.color_map, this.scale);
    Scores.addScores(new_scores, this.color_map);
  }
}


module.exports = Visuals;
