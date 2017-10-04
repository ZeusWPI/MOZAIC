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

  draw(data) {
    let selector = this.bind(data);
    selector.exit().remove();
    let expeditions = selector.enter().append('g')
        .attr('class', 'expedition')
        .merge(selector)
        .attr('transform', d => {
          let pos = this.expeditionPos(d);
          return `translate(${pos.x}, ${pos.y})`;
        });

    this.drawShips(expeditions);
  }

  drawShips(expeditions) {
    // TODO: scale
    let scale = 0.75;
    let ships = expeditions.selectAll('.ship').data(d => [d]);

    ships.enter().append('rect')
      .attr('class', 'ship')
      .attr('width', 1 * scale)
      .attr('height', 1 * scale)
      .style('stroke-width', 0.05 * scale)
      .attr('fill', exp => "url(#ship)")
      .merge(ships)
      .style('stroke', exp => this.ownerColor(exp))
      .attr('transform', exp => `rotate(${this.expeditionRotation(exp)})`)
      .append('title').text(exp => this.ownerName(exp.owner));
  }

  expeditionPos(expedition) {
    console.log(expedition);
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

  // TODO: dedup
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

module.exports = ExpeditionRenderer;
