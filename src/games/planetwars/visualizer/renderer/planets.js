const d3 = require('d3');

class PlanetRenderer {
  constructor(container) {
    this.container = container;
  }

  bind(data) {
    return this.container.selectAll('.planet').data(data, p => p.name);
  }

  enter(planets) {
    let wrapper = planets.enter().append('g')
      .attr('class', 'planet');
    wrapper.append('circle')
      .attr('r', d => d.size)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('class', 'planet_model')
      .attr('fill', d => 'url(#' + d.type + ')');
  }

  draw(data) {
    let planets = this.bind(data);
    this.enter(planets);
  }
}

module.exports = PlanetRenderer;
