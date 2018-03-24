const Config = require('./config');

class ResourceLoader {
  constructor(svg) {
    this.svg = svg;
  }

  setupPatterns() {
    // Define patterns
    this.svg.append("defs");
    Config.planet_types.forEach(p => {
      this.setupPattern(p + ".svg", 100, 100, p);
    });
    this.setupPattern("rocket.svg", 100, 100, "ship");
    this.setupPattern("station.svg", 100, 100, "fleet");
    this.setupPattern("jigglypoef.svg", 100, 100, "jigglyplanet");
  }

  setupPattern(name, width, height, id) {
    this.svg.select("defs")
      .append("pattern")
      .attr("id", id)
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("preserveAspectRation", "none")
      .attr("width", 1)
      .attr("height", 1)
      .append("image")
      .attr("width", width)
      .attr("height", height)
      .attr("preserveAspectRation", "none")
      .attr("xlink:href", "./components/visualizer/lib/assets/images/" + name);
  }
}

module.exports = ResourceLoader;