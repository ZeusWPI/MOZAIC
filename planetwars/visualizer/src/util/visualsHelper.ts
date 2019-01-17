import * as d3 from 'd3';

import Config from './config';
import * as space_math from './spacemath';

class Helper {
  public static attachToAllChildren(d3selector: any) {
    return d3selector.data((d: any, i: number) => {
      return Array(d3selector._groups[i].length).fill(d);
    });
  }

  public static translation(point: space_math.Point) {
    return 'translate(' + point.x + ',' + point.y + ')';
  }

  public static rotate(angle: number) {
    return 'rotate(' + angle + ')';
  }

  public static resize(planet: any, amount: number) {
    const tx = -planet.x * (amount - 1);
    const ty = -planet.y * (amount - 1);
    return Helper.translation({
      x: tx,
      y: ty,
    }) + ' scale(' + amount + ')';
  }

  public static visualOwnerName(name: string) {
    if (name === null) { return 'None'; } else { return name; }
  }
}

// Helper objects start here

export class Planets {
  public static addPlanetVisuals(d3selector: any, colorMap: any, scale: number) {
    Planets.drawPlanet(d3selector, colorMap);
    Planets.drawName(d3selector, colorMap, scale);
    Planets.drawShipCount(d3selector, colorMap, scale);
  }

  public static drawPlanet(d3selector: any, colorMap: any) {
    const wrapper = d3selector.append('g')
      .attr('class', 'planet');

    wrapper.append('circle')
      .attr('r', (d: any) => d.size)
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y)
      .attr('class', 'planet_background')
      .attr('fill', (d: any) => colorMap[d.owner]);

    wrapper.append('circle')
      .attr('r', (d: any) => d.size)
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y)
      .attr('class', 'planet_model')
      .attr('fill', (d: any) => 'url(#' + d.type + ')');

    wrapper.append('title')
      .text((d: any) => Helper.visualOwnerName(d.owner));
  }

  public static update(d3selector: any, colorMap: any, speed: number) {
    // Text color
    Helper.attachToAllChildren(d3selector.selectAll('text')).attr('fill', (d: any) => colorMap[d.owner]);
    Helper.attachToAllChildren(d3selector.selectAll('title')).text((d: any) => Helper.visualOwnerName(d.owner));
    Planets.registerTakeOverAnimation(d3selector, speed);

    // Update attribs
    d3selector.select('.orbit').style('stroke', (d: any) => colorMap[d.owner]);
    d3selector.select('.planet_background').attr('fill', (d: any) => colorMap[d.owner]);
    d3selector.select('.planet_model').attr('fill', (d: any) => 'url(#' + d.type + ')');
    d3selector.select('.ship_count').text((d: any) => "\u2694 " + d.ship_count).append('title')
      .text((d: any) => Helper.visualOwnerName(d.owner));
  }

  public static drawName(d3selector: any, colorMap: any, scale: number) {
    d3selector.append('text')
      .attr('x', (d: any) => d.x)
      .attr('y', (d: any) => d.y + d.size + 2 * scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * scale + "px")
      .attr('fill', (d: any) => colorMap[d.owner])
      .text((d: any) => d.name)
      .append('title')
      .text((d: any) => Helper.visualOwnerName(d.owner));
  }

  public static drawShipCount(d3selector: any, colorMap: any, scale: number) {
    d3selector.append('text')
      .attr('x', (d: any) => d.x)
      .attr('y', (d: any) => d.y + d.size + 3.5 * scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * scale + "px")
      .attr('fill', (d: any) => colorMap[d.owner])
      .attr('class', 'ship_count')
      .text((d: any) => "\u2694 " + d.ship_count)
      .append('title')
      .text((d: any) => Helper.visualOwnerName(d.owner));
  }

  public static registerTakeOverAnimation(planets: any, speed: number) {
    planets.select('.planet')
      .filter((d: any) => d.changed_owner)
      .transition(speed / 2)
      .attr('transform', (d: any) => Helper.resize(d, 1.3))
      .transition(speed / 2)
      .attr('transform', (d: number) => Helper.resize(d, 1));
  }

  public static removeOld(d3selector: any) {
    d3selector.exit().remove();
  }
}

// TODO: since fleet is just a visual thing it is defined here
// when this changes do not forget to move this
export class Fleet {
  public size: number;
  public distance: number;
  public angle: number;
  public speed: number;
  public planet: any;

  constructor(planet: any, scale: number) {
    this.size = 1 * scale;
    this.distance = planet.size + Config.orbitSize * scale;
    this.angle = space_math.randomIntBetween(1, 360);
    this.speed = space_math.randomIntBetween(100, 1000);
    this.planet = planet;
  }
}

export class Fleets {
  public static addFleetVisuals(d3selector: any, colorMap: any) {
    Fleets.drawOrbit(d3selector, colorMap);
    Fleets.drawFleet(d3selector, colorMap);
  }

  public static drawOrbit(d3selector: any, colorMap: any) {
    d3selector.append('circle')
      .attr('class', 'orbit')
      .attr('transform', (d: any) => Helper.translation(d.planet))
      .attr('r', (d: any) => d.distance)
      .style('fill', "none")
      .style('stroke', (d: any) => {
        return colorMap[d.planet.owner];
      })
      .style('stroke-opacity', 0.5)
      .style('stroke-width', 0.05);
  }

  public static drawFleet(d3selector: any, colorMap: any) {
    const wrapper = d3selector.append('g')
      .attr('transform', (d: any) => Helper.translation(d.planet));

    wrapper.append('circle')
      .attr('transform', (d: any) => Helper.translation(d.planet))
      .attr('class', 'fleet')
      .attr('r', (d: any) => d.size * 0.7)
      .attr('cx', (d: any) => d.distance)
      .attr('cy', 0)
      .attr('fill', (d: any) => "url(#fleet)")
      .append('title').text((d: any) => Helper.visualOwnerName(d.planet.owner));
  }

  public static animateFleets(svg: any, elapsed: any) {
    svg.selectAll('.fleet')
      .attr('transform', (d: any, i: any) => {
        return 'rotate(' + (d.angle - elapsed * (d.speed / 10000)) % 360 + ')';
      });
  }
}

export class Expeditions {
  public origin: any;
  public destination: any;

  public static addExpeditionVisuals(d3selector: any, colorMap: any, scale: number) {
    Expeditions.drawExpedition(d3selector, colorMap, scale);
    Expeditions.drawShipCount(d3selector, colorMap, scale);
  }

  public static getLocation(exp: any) {
    const point = Expeditions.position(exp);
    return Helper.translation(point);
  }

  public static getRotation(exp: any) {
    const angle = Expeditions.angle(exp);
    return Helper.rotate(angle);
  }

  public static drawExpedition(d3selector: any, colorMap: any, scale: number) {
    d3selector.attr('transform', (exp: any) => Expeditions.getLocation(exp));

    d3selector.append('rect')
      .attr('width', 1 * scale)
      .attr('height', 1 * scale)
      .style('stroke', (exp: any) => colorMap[exp.owner])
      .style('stroke-width', 0.05 * scale)
      .attr('fill', (exp: any) => "url(#ship)")
      .attr('transform', (exp: any) => Expeditions.getRotation(exp))
      .append('title').text((exp: any) => Helper.visualOwnerName(exp.owner));
  }

  public static drawShipCount(d3selector: any, colorMap: any, scale: number) {
    d3selector.append('text')
      .attr('y', 2 * scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * scale + "px")
      .attr('fill', (exp: any) => colorMap[exp.owner])
      .text((exp: any) => "\u2694 " + exp.ship_count)
      .append('title').text((exp: any) => Helper.visualOwnerName(exp.owner));
  }

  public static update(d3selector: any, speed: number) {
    d3selector.transition()
      .duration(speed)
      .ease(d3.easeLinear)
      .attr('transform', (exp: any) => Expeditions.getLocation(exp));

  }
  public static removeOld(d3selector: any) {
    d3selector.exit().remove();
  }

  public static position(expedition: any) {
    const totalDistance = Math.ceil(space_math.euclideanDistance(expedition.origin, expedition.destination));
    const mod = expedition.turns_remaining / totalDistance;

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

  // public static homannPosition(angle: number) {
  //   var total_distance = space_math.euclideanDistance(this.origin, this.destination);
  //   if (!angle) angle = this.homannAngle(this.turns_remaining, total_distance);

  //   var r1 = (this.origin.size) / 2 + 3;
  //   var r2 = (this.destination.size) / 2 + 3;

  //   var a = (total_distance + r1 + r2) / 2;
  //   var c = a - r1 / 2 - r2 / 2;
  //   var b = Math.sqrt(Math.pow(a, 2) - Math.pow(c, 2));

  //   var dx = this.origin.x - this.destination.x;
  //   var dy = this.origin.y - this.destination.y;
  //   var w = Math.atan2(dy, dx);

  //   var center_x = c * Math.cos(w) + this.destination.x;
  //   var center_y = c * Math.sin(w) + this.destination.y;

  //   var longest = a;
  //   var shortest = b;

  //   longest *= Math.cos(angle);
  //   shortest *= Math.sin(angle);

  //   return {
  //     'x': center_x + longest * Math.cos(w) - shortest * Math.sin(w),
  //     'y': center_y + longest * Math.sin(w) + shortest * Math.cos(w)
  //   };
  // }

  public static angle(expedition: any) {
    const y = expedition.destination.y - expedition.origin.y;
    const x = expedition.destination.x - expedition.origin.x;
    return (Math.atan2(x, y) * (180 / Math.PI) + 45) % 360;
  }

  // public static homannAngle(turn: number, distance: number) {
  //   if (!distance) { distance = space_math.euclideanDistance(this.origin, this.destination); }
  //   const mod = turn / distance;
  //   return mod * (Math.PI * 2) - Math.PI;
  // }

  public expHomanRotation(exp: any) {
    const totalDistance = space_math.euclideanDistance(exp.origin, exp.destination);

    const r1 = (exp.origin.size) / 2 + 3;
    const r2 = (exp.destination.size) / 2 + 3;

    const a = (totalDistance + r1 + r2) / 2;
    const c = a - r1 / 2 - r2 / 2;
    const b = Math.sqrt(Math.pow(a, 2) - Math.pow(c, 2));

    let dx = exp.origin.x - exp.destination.x;
    let dy = exp.origin.y - exp.destination.y;
    const scaler = a / b;

    // ellipse rotation angle
    const w = Math.atan2(dy / scaler, dx);
    // angle form center
    const angle = exp.homannAngle(exp.turns_remaining);

    // unrotated ellipse point
    dx = a * Math.cos(angle);
    dy = b * Math.sin(angle);

    // unrotated slope
    const t1 = (dx * Math.pow(b, 2)) / (dy * Math.pow(a, 2));

    const sx = t1 * Math.cos(w) - Math.sin(w);
    const sy = Math.cos(w) + t1 * Math.sin(w);

    const degrees = space_math.toDegrees(Math.atan2(sy, sx));
    return 'rotate(' + (degrees + 180) % 360 + ')';
  }

}

export class Scores {
  private static maxBarSize: number;

  public static addScores(d3selector: any, colorMap: any, scores: any) {
    const startY = 50;
    const size = 30;
    Scores.maxBarSize = 100;

    d3selector.attr("font-family", "sans-serif")
      .attr("font-size", 0.8 + "vw")
      .attr('fill', (d: any) => colorMap[d.player]);
    d3selector.append('circle')
      .attr('r', (d: any) => 5)
      .attr('cx', (d: any) => "5%")
      .attr('cy', (d: any, i: number) => startY + size * i);
    d3selector.append('text')
      .attr('class', 'player_name')
      .attr('x', (d: any) => "15%")
      .attr('y', (d: any, i: number) => startY + 5 + size * i)
      .text((d: any) => d.player);
    d3selector.append('text')
      .attr('class', 'planet_count')
      .attr('x', (d: any) => "50%")
      .attr('y', (d: any, i: any) => startY + 5 + size * i)
      .text((d: any) => d.planets);
    d3selector.append('circle')
      .attr('r', (d: any) => "3%")
      .attr('cx', (d: any) => "60%")
      .attr('cy', (d: any, i: number) => startY - 1 + size * i)
      .attr('fill', 'url(#earth)')
      .attr('stroke', (d: any) => colorMap[d.player]);
    let endY = 0;
    d3selector.append('text').attr('class', 'strength')
      .attr('x', (d: any) => "80%")
      .attr('y', (d: any, i: any) => {
        endY = startY + 5 + size * i;
        return endY;
      })
      .text((d: any, i: any) => d.strengths[i] + " \u2694");
    endY += 20;

    d3selector.append('rect').attr('class', 'ratioblock')
      .attr('x', (d: any, i: any) => {
        let strengthBefore = 0;
        if (i !== 0) {
          for (let j = 0; j < i; j++) {
            strengthBefore += d.strengths[j];
          }
        }
        return Scores.maxBarSize * (strengthBefore / d.total_strength) + '%';
      })
      .attr('y', (d: any, i: any) => endY + 20)
      .attr('width', (d: any, i: any) => (Scores.maxBarSize * (d.strengths[i] / d.total_strength)) + '%')
      .attr('height', 20)
      .append('title').text((d: any) => Helper.visualOwnerName(d.player));

  }

  public static update(d3selector: any) {
    d3selector.select('.planet_count').text((d: any) => d.planets);
    d3selector.select('.strength').text((d: any, i: any) => d.strengths[i] + " \u2694");
    d3selector.select('.ratioblock').attr('x', (d: any, i: any) => {
      let strengthBefore = 0;
      if (i !== 0) {
        for (let j = 0; j < i; j++) {
          strengthBefore += d.strengths[j];
        }
      }
      return Scores.maxBarSize * (strengthBefore / d.total_strength) + '%';
    })
      .attr('width', (d: any, i: any) => (Scores.maxBarSize * (d.strengths[i] / d.total_strength)) + '%');
  }
}

// TODO: this modefies the model, this should perhaps generate a new model that is vis only
export class Preprocessor {
  public static preprocess(turns: any[]) {
    const styleMap = Preprocessor.generatePlanetStyles(turns[0], turns[0].planets);

    turns.forEach((turn, i) => {
      turn.planets.forEach((planet: any) => {
        Preprocessor.applyStyle(planet, styleMap);
        if (i > 0) {
          turns[i - 1].planets.forEach((p2: any) => {
            Preprocessor.addTakeoverFlag(p2, planet);
          });
        }
        Preprocessor.addJigglyFlag(planet);
      });
    });
  }

  private static generatePlanetStyles(turn: any, planets: any) {
    return turn.planets.reduce((map: any, planet: any) => {
      const types = Config.planetTypes;
      const type = types[Math.floor(Math.random() * types.length)];
      const closest = space_math.findClosest(planet, planets) / 2 - Config.orbitSize * 2;
      const size = space_math.clamp(closest, 0.5, Config.maxPlanetSize);
      planet.type = type;
      planet.size = size;
      map[planet.name] = planet;
      return map;
    }, {});
  }
  private static applyStyle(planet: any, map: any) {
    const template = map[planet.name];
    planet.type = template.type;
    planet.size = template.size;
  }

  private static addTakeoverFlag(lastTurnPlanet: any, planet: any) {
    if (planet.name === lastTurnPlanet.name && planet.owner !== lastTurnPlanet.owner) {
      planet.changed_owner = true;
    }
  }

  private static addJigglyFlag(planet: any) {
    // if (['jigglypoef', 'iepoef', 'iepoev', 'jigglypuff', 'jigglypoev'].includes(planet.owner)) {
    //   planet.type = 'jigglyplanet';
    // }
  }
}