const d3 = require('d3');
const Config = require('../config');

class PlanetRenderer {
  constructor(container) {
    this.container = container;
  }

  bind(data) {
    return this.container.selectAll('.planet').data(data, p => p.name);
  }
  
  draw(data) {
    let selector = this.bind(data);
    let planets = selector.enter().append('g')
        .attr('class', 'planet')
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .merge(selector);
    this.drawBackgrounds(planets);
    this.drawModels(planets);
    this.drawTitles(planets);
    this.drawNameLabels(planets);
    this.drawShipCounts(planets);
  }

  drawBackgrounds(planets) {
    let backgrounds = planets.selectAll('.background').data(d => [d]);
    
    backgrounds.enter().append('circle')
      .attr('class', 'background')
      .attr('r', d => d.size)
      .merge(backgrounds)
      .attr('fill', d => this.ownerColor(d.owner));
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
      .merge(titles)
      .text(d => this.ownerName(d.owner));
  }

  drawNameLabels(planets) {
    // TODO: scale
    let scale = 0.75;
    
    let labels = planets.selectAll('.name').data(d => [d]);
    
    labels.enter().append('text')
      .attr('class', 'name')
      .attr('y', d => d.size + 2 * scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * scale + "px")
      .text(d => d.name)
      .merge(labels)
      .attr('fill', d => this.ownerColor(d.owner));
  }

  drawShipCounts(planets) {
    // TODO: scale
    let scale = 0.75;

    let labels = planets.selectAll('.ship_count').data(d => [d]);
    
    labels.enter().append('text')
      .attr('class', 'ship_count')
      .attr('y', d => d.size + 3.5 * scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * scale + "px")
      .merge(labels)
      .attr('fill', d => this.ownerColor(d.owner))
      .text(d => "\u2694 " + d.ship_count);
  }

  ownerName(owner) {
    if (owner) {
      return owner;
    } else {
      // TODO: maybe inject this config
      return Config.visual_null;
    }
  }

  ownerColor(owner) {
    // TODO
    return '#d3d3d3';
  }

}

module.exports = PlanetRenderer;
