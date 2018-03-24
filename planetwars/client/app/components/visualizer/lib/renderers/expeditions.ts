import * as d3 from 'd3';
import Config from '../util/config';
import { Expedition } from '../../../../lib/match/types';
const space_math = require('../util/spacemath');

class ExpeditionRenderer {
  public container: any;
  constructor(container: any) {
    this.container = container;
  }

  bind(data: any) {
    return this.container.selectAll('.expedition').data(data, (e: any) => e.id);
  }

  draw(data: any, params: any) {
    let selector = this.bind(data);
    selector.exit().remove();
    let expeditions = selector.enter().append('g')
      .attr('class', 'expedition')
      .attr('transform', (d: Expedition) => {
        let pos = this.expeditionPos(d);
        return `translate(${pos.x}, ${pos.y})`;
      }).merge(selector);

    expeditions.transition()
      .duration(1000 / params.speed)
      .ease(d3.easeLinear)
      .attr('transform', (d: Expedition) => {
        const pos = this.expeditionPos(d);
        return `translate(${pos.x}, ${pos.y})`;
      });

    this.drawShips(expeditions, params);
    this.drawShipCounts(expeditions, params);
    this.drawTitles(expeditions);
  }

  drawShips(expeditions: any, params: any) {
    let ships = expeditions.selectAll('.ship').data((d: any) => [d]);
    ships.enter().append('text')
      .attr('x', 0.5 * params.scale)
      .attr('font-family', 'Trebuchet MS')
      .attr('font-size', 1.1 * params.scale + 'px')
      .style("text-anchor", "middle")
      .text((exp: any) => "A")
      .attr('transform', (exp: any) => `rotate(${this.expeditionRotation(exp)})`)
      .attr('fill', (exp: any) => Config.playerColor(exp.owner));
  }

  drawShipCounts(expeditions: any, params: any) {
    let counts = expeditions.selectAll('.shipCount').data((d: any) => [d]);

    counts.enter().append('text')
      .attr('y', 1.8 * params.scale)
      .attr('x', -1 * params.scale)
      .attr('font-family', 'sans-serif')
      .attr('font-size', 0.8 * params.scale + 'px')
      .text((exp: any) => "\u2694" + exp.ship_count)
      .attr('fill', (exp: any) => Config.playerColor(exp.owner));
  }

  drawTitles(expeditions: any) {
    let titles = expeditions.selectAll('.title').data((d: any) => [d]);

    titles.enter().append('title')
      .attr('class', 'title')
      .merge(titles)
      .text((d: any) => Config.playerName(d.owner));
  }

  expeditionPos(expedition: Expedition) {
    const totalDistance = Math.ceil(
      space_math.euclideanDistance(
        expedition.origin,
        expedition.destination)
    );
    const mod = expedition.turnsRemaining / totalDistance;

    let newX = expedition.origin.x - expedition.destination.x;
    newX *= mod;
    newX += expedition.destination.x;

    let newY = expedition.origin.y - expedition.destination.y;
    newY *= mod;
    newY += expedition.destination.y;

    return {
      x: newX,
      y: newY,
    };
  }

  expeditionRotation(expedition: any) {
    let angle = (180 / Math.PI) * Math.atan2(
      expedition.destination.y - expedition.origin.y,
      expedition.destination.x - expedition.origin.x
    );
    return (angle + 90) % 360;
  }
}

module.exports = ExpeditionRenderer;
