const d3 = require('d3');
const Config = require('../util/config');

class PlanetRenderer {
  constructor(container) {
    this.container = container;
  }

  bind(data) {
    return this.container.selectAll('.planet').data(data, p => p.name);
  }

  draw(data, params) {
    let selector = this.bind(data);
    let planets = selector.enter().append('g')
      .attr('class', 'planet')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .merge(selector);

    this.drawBackgrounds(planets);
    this.drawModels(planets);
    this.drawTitles(planets);
    this.drawNameLabels(planets, params);
    this.drawShipCounts(planets, params);
  }

  drawBackgrounds(planets) {
    let backgrounds = planets.selectAll('.background').data(d => [d]);

    backgrounds.enter().append('circle')
      .attr('class', 'background')
      .attr('r', d => d.size)
      .merge(backgrounds)
      .attr('fill', d => Config.player_color(d.owner));
  }

  drawModels(planets) {
    let models = planets.selectAll('.model').data(d => [d]);

    models.enter().append('circle')
      .attr('class', 'model')
      .attr('r', d => d.size)
      .attr('fill', d => `url(#${d.type})`);
  }

  drawTitles(planets) {
    let titles = planets.selectAll('.title').data(d => [d]);

    titles.enter().append('title')
      .attr('class', 'title')
      .merge(titles)
      .text(d => Config.player_name(d.owner));
  }

  drawNameLabels(planets, params) {
    let labels = planets.selectAll('.name').data(d => [d]);

    labels.enter().append('text')
      .attr('class', 'name')
      .attr('y', d => d.size + 1.5 * params.scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", params.scale + "px")
      .style("text-anchor", "middle")
      .text(d => d.name)
      .merge(labels)
      .attr('fill', d => Config.player_color(d.owner));
  }

  drawShipCounts(planets, params) {
    let labels = planets.selectAll('.ship_count').data(d => [d]);

    labels.enter().append('text')
      .attr('class', 'ship_count')
      .attr('y', d => d.size + 3 * params.scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * params.scale + "px")
      .style("text-anchor", "middle")
      .merge(labels)
      .attr('fill', d => Config.player_color(d.owner))
      .text(d => "\u2694 " + d.ship_count);
  }
}

module.exports = PlanetRenderer;