import * as d3 from 'd3';
import Config from '../util/config';

class PlanetRenderer {
  container: any;

  constructor(container: any) {
    this.container = container;
  }

  bind(data: any) {
    return this.container.selectAll('.planet').data(data, (p: any) => p.name);
  }

  draw(data: any, params: any) {
    let selector = this.bind(data);
    let planets = selector.enter().append('g')
      .attr('class', 'planet')
      .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`)
      .merge(selector);

    this.drawBackgrounds(planets);
    this.drawModels(planets);
    this.drawTitles(planets);
    this.drawNameLabels(planets, params);
    this.drawShipCounts(planets, params);
  }

  drawBackgrounds(planets: any) {
    const backgrounds = planets.selectAll('.background').data((d: any) => [d]);

    backgrounds.enter().append('circle')
      .attr('class', 'background')
      .attr('r', Config.planet_size)
      .merge(backgrounds)
      .attr('fill', (d: any) => Config.playerColor(d.owner));
  }

  drawModels(planets: any) {
    let models = planets.selectAll('.model').data((d: any) => [d]);

    models.enter().append('circle')
      .attr('class', 'model')
      .attr('r', Config.planet_size)
      .attr('fill', (d: any) => `url(#${d.type})`);
  }

  drawTitles(planets: any) {
    let titles = planets.selectAll('.title').data((d: any) => [d]);

    titles.enter().append('title')
      .attr('class', 'title')
      .merge(titles)
      .text((d: any) => Config.playerName(d.owner));
  }

  drawNameLabels(planets: any, params: any) {
    let labels = planets.selectAll('.name').data((d: any) => [d]);

    labels.enter().append('text')
      .attr('class', 'name')
      .attr('y', (d: any) => Config.planet_size + 1.5 * params.scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", params.scale + "px")
      .style("text-anchor", "middle")
      .text((d: any) => d.name)
      .merge(labels)
      .attr('fill', (d: any) => Config.playerColor(d.owner));
  }

  drawShipCounts(planets: any, params: any) {
    let labels = planets.selectAll('.ship_count').data((d: any) => [d]);

    labels.enter().append('text')
      .attr('class', 'ship_count')
      .attr('y', (d: any) => d.size + 3 * params.scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", Config.planet_size * params.scale + "px")
      .style("text-anchor", "middle")
      .merge(labels)
      .attr('fill', (d: any) => Config.playerColor(d.owner))
      .text((d: any) => "\u2694 " + d.shipCount);
  }
}

module.exports = PlanetRenderer;