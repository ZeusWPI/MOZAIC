import * as d3 from 'd3';
import Game from '../components/game';
import { Planet } from '../../../../lib/match/types';
import Config from '../util/config';

export class PlanetRenderer {
  private container: any;
  private game: Game;

  constructor(game: Game, container: any) {
    this.game = game;
    this.container = container;
  }

  public bind(data: any) {
    return this.container
      .selectAll('.planet')
      .data(data, (p: Planet) => p.name);
  }

  public draw(data: any, params: any) {
    const selector = this.bind(data);
    const planets = selector.enter().append('g')
      .attr('class', 'planet')
      .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`)
      .merge(selector);

    const size = Math.max(Config.minPlanetSize, params.scale * Config.planetSize);
    this.drawBackgrounds(planets, params, size);
    this.drawModels(planets, params, size);
    this.drawTitles(planets);
    this.drawNameLabels(planets, params, size);
    this.drawShipCounts(planets, params, size);
  }

  private drawBackgrounds(planets: any, params: any, size: any) {
    const backgrounds = planets.selectAll('.background').data((d: any) => [d]);

    backgrounds.enter().append('circle')
      .attr('class', 'background')
      .attr('r', size)
      .merge(backgrounds)
      .attr('fill', (d: any) => this.game.playerColor(d.owner));
  }

  private drawModels(planets: any, params: any, size: any) {
    const models = planets.selectAll('.model').data((d: any) => [d]);

    models.enter().append('circle')
      .attr('class', 'model')
      .attr('r', size)
      .attr('fill', (d: Planet) => `url(#${this.game.planetType(d.name)})`);
  }

  private drawTitles(planets: any) {
    const titles = planets.selectAll('.title').data((d: any) => [d]);

    titles.enter().append('title')
      .attr('class', 'title')
      .merge(titles)
      .text((d: any) => this.game.playerName(d.owner));
  }

  private drawNameLabels(planets: any, params: any, size: any) {
    const labels = planets.selectAll('.name').data((d: any) => [d]);

    labels.enter().append('text')
      .attr('class', 'name')
      .attr('y', (d: any) => size + 1.5 * params.scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", params.scale + "px")
      .style("text-anchor", "middle")
      .text((d: any) => d.name)
      .merge(labels)
      .attr('fill', (d: any) => d3.color(this.game.playerColor(d.owner)).brighter());
  }

  private drawShipCounts(planets: any, params: any, size: any) {
    const labels = planets.selectAll('.ship_count').data((d: any) => [d]);

    labels.enter().append('text')
      .attr('class', 'ship_count')
      .attr('y', (d: Planet) => size + 3 * params.scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", params.scale + "px")
      .style("text-anchor", "middle")
      .merge(labels)
      .attr('fill', (d: any) => d3.color(this.game.playerColor(d.owner)).brighter())
      .text((d: Planet) => "\u2694 " + d.shipCount);
  }
}
