import Config from './config';
const remote = require('electron').remote;
const path = require('path');

const prefix = (process.env.NODE_ENV === 'development') ?
  path.resolve('app') :
  path.resolve(remote.app.getAppPath(), 'app');

const resourcePath = path.resolve(prefix, 'components', 'visualizer', 'lib', 'assets', 'images');

class ResourceLoader {
  svg: any;

  constructor(svg: any) {
    this.svg = svg;
  }

  setupPatterns() {
    // Define patterns
    this.svg.append("defs");
    Config.planetTypes.forEach((p) => {
      this.setupPattern(p + ".svg", 100, 100, p);
    });
    this.setupPattern("rocket.svg", 100, 100, "ship");
    this.setupPattern("station.svg", 100, 100, "fleet");
    this.setupPattern("jigglypoef.svg", 100, 100, "jigglyplanet");
  }

  setupPattern(name: any, width: any, height: any, id: any) {
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
      .attr("xlink:href", path.resolve(resourcePath, name));
  }
}

module.exports = ResourceLoader;
