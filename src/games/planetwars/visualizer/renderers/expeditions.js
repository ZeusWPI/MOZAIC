const d3 = require('d3');
const Config = require('../config');
const Utils = require('../util');

const space_math = Utils.SpaceMath;

class ExpeditionRenderer {
  constructor(container) {
    this.container = container;
  }

  bind(data) {
    return this.container.selectAll('.expedition').data(data, e => e.id);
  }

  draw(data, params) {
    let selector = this.bind(data);
    selector.exit().remove();
    let expeditions = selector.enter().append('g')
        .attr('class', 'expedition')
        .attr('transform', d => {
          let pos = this.expeditionPos(d);
          return `translate(${pos.x}, ${pos.y})`;
        }).merge(selector);
    
    // TODO: fetch speed or something
    expeditions.transition()
      .duration(1000/params.speed)
      .ease(d3.easeLinear)
      .attr('transform', d => {
        let pos = this.expeditionPos(d);
        return `translate(${pos.x}, ${pos.y})`;
      });

    this.drawShips(expeditions, params);
  }

  drawShips(expeditions, params) {
    let ships = expeditions.selectAll('.ship').data(d => [d]);

    ships.enter().append('rect')
      .attr('class', 'ship')
      .attr('width', 1 * params.scale)
      .attr('height', 1 * params.scale)
      .style('stroke-width', 0.05 * params.scale)
      .attr('fill', exp => "url(#ship)")
      .merge(ships)
      .style('stroke', exp => Config.player_color(exp.owner))
      .attr('transform', exp => `rotate(${this.expeditionRotation(exp)})`)
      .append('title').text(exp => Config.player_name(exp.owner));
  }

  expeditionPos(expedition) {
    var total_distance = Math.ceil(
      space_math.euclideanDistance(
        expedition.origin,
        expedition.destination)
    );
    var mod = expedition.turns_remaining / total_distance;

    var new_x = expedition.origin.x - expedition.destination.x;
    new_x *= mod;
    new_x += expedition.destination.x;

    var new_y = expedition.origin.y - expedition.destination.y;
    new_y *= mod;
    new_y += expedition.destination.y;

    return {
      'x': new_x,
      'y': new_y
    };
  }

  expeditionRotation(expedition) {
    let angle = (180 / Math.PI) * Math.atan2(
      expedition.destination.y - expedition.origin.y,
      expedition.destination.x - expedition.origin.x
    );
    return (angle + 45) % 360;
  }
}

module.exports = ExpeditionRenderer;
