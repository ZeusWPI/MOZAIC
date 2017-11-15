const d3 = require('d3');

const sections = 25;
const fancy = true;

function equals(p1, p2){
  var dx = p1[0] - p2[0];
  var dy = p1[1] - p2[1];
  var delta = 0.0000001;
  return (Math.abs(dx) < delta) && (Math.abs(dy) < delta);
}

function dist(p1, p2){
  return Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
}

function getIndex(list, point){
  for (var i = 0; i < list.length; i++) {
    if(equals(list[i], point)){
      return i;
    }
  }
  return -1;
}

function isRight(p1, p2, p3){
  return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]) <= 0;
}

class Polygon {
  constructor(owner, name, point, points){
    this.owner = owner;
    this.name = name;
    this.point = point;
    this.polygon = points;

    this.neighbours = {};

    this.polygon.forEach(p => {
      this.neighbours[p] = [];
    });

    this.neighbourPairs = {};
  }

  initNeighbours(data){
    data.polygons.forEach(poly => this.neighbourPairs[poly.name] = []);
    this.polygon.forEach(point => {
      data.polygons.forEach(poly => {
        var index = getIndex(poly.polygon, point);
        if(poly !== this && index > -1){
          this.neighbours[point].push(poly);
          this.neighbourPairs[poly.name].push(point);
        }
      });
    });
  }

  isPossible(point, hardEnd, owner, target, data){
    var i = getIndex(this.polygon, point);
    if(i === -1){
      return false;
    }

    if(owner !== this.owner){
      return false;
    }
    return this.polygon[(i+1) % this.polygon.length];
  }

  getPoint(point, i){
    var max = sections;
    if(i === 0){
      return point;
    }

    var w1 = i;
    var w2 = max - i;
    return [(this.point[0]*w2 + point[0]*w1)/max, (this.point[1]*w2 + point[1]*w1)/max];
  }

  maybeStart(layer, point, hardEnd, owner, target, data){
    var i = getIndex(this.polygon, point);
    if(i === -1){
      return false;
    }

    if(owner !== this.owner){
      return false;
    }

    data.used[this.name] = true;

    i = (i + 1) % this.polygon.length;

    var p = this.polygon[i];

    target.push(this.getPoint(p, layer));

    while(!equals(p, hardEnd)){
      var nextPol = undefined;
      var nextPolPoint = undefined;
      for (var pol of this.neighbours[p]) {
        var nextPoint = pol.isPossible(p, hardEnd, owner, target, data);
        if(nextPoint){
          if(nextPol === undefined || isRight(p, nextPolPoint, nextPoint)){
            nextPol = pol;
            nextPolPoint = nextPoint;
          }
        }
      }

      if(nextPol !== undefined){

        if(this.neighbours[p].some(pol => pol.owner !== this.owner)){
          var x = 0;
          var y = 0;

          this.neighbourPairs[nextPol.name].forEach(mp => { x+= mp[0]; y += mp[1]; });
          var pmiddle = [x/this.neighbourPairs[nextPol.name].length, y / this.neighbourPairs[nextPol.name].length];

          var w2 = layer;
          var w1 = sections - layer;
          target.push([(pmiddle[0]*w2 + p[0]*w1)/sections, (pmiddle[1]*w2 + p[1]*w1)/sections]);
        }

        nextPol.maybeStart(layer, p, hardEnd, owner, target, data);
        return true;
      }

      i = (i + 1) % this.polygon.length;

      p = this.polygon[i];
      target.push(this.getPoint(p, layer));
    }

    return true;
  }

  getGoodIndex(){
    var owner = this.owner;
    for (var i = 0; i < this.polygon.length; i++) {
      var point = this.polygon[i];
      var good = true;
      for(var oPolygon of this.neighbours[point]){
        if(oPolygon.owner === owner){
          good = false;
        }
      }
      if(good){
        return i;
      }
    }
    return undefined;
  }
}

function getPath(points) {
  if(fancy){
    var betterpoints = [];
    for (var j = points.length-1, i = 0; i < points.length;j = i, i++) {
      betterpoints.push([(points[j][0] + points[i][0])/2, (points[j][1] + points[i][1])/2]);
      betterpoints.push(points[i]);
    }
    points = betterpoints;
  }
  var point_strings = [];
  points.forEach(p => point_strings.push(p[0]+","+p[1]));
  if(fancy){
    var out = "M"+point_strings[0];
    for (var i = 2; i < point_strings.length; i+= 2) {
      out += "Q"+point_strings[i-1]+" "+point_strings[i];
    }
    out+= "Q"+point_strings[point_strings.length-1]+" "+point_strings[0];
    return out;
  }else{
    return "M"+point_strings.join("L")+"Z";
  }
}

function getAngle(middle, point){
  var dx = middle[0] - point[0];
  var dy = middle[1] - point[1];
  var angle = Math.atan2(dy, dx);
  var degrees = 180*angle/Math.PI;
  return (360+Math.round(degrees))%360;
}

function initVoronoi(turns, colorFunction, box){
  var voronoi = d3.voronoi().extent(box);
  var planets = turns[0].planets;
  var posMap = {};                              // maps middle coordinate on the planet
  planets.forEach(p => posMap[[p.x, p.y]] = p);

  var points = planets.map(p => [p.x, p.y]);
  var polys = voronoi(points).polygons();

  //                                              >>>>>>>>>>>>>>>>>DEDUPLICATION
  var pointsMade = [];

  for(var pl of polys){
    for (let i = 0; i < pl.length; i++) {
      var alreadyHasPoint = false;
      for(var p of pointsMade){
        if(equals(pl[i], p)){
          pl[i] = p;
          alreadyHasPoint = true;
        }
      }
      if(!alreadyHasPoint){
        pointsMade.push(pl[i]);
      }
    }
    pl.sort((a, o) => {
      return getAngle(pl.data, a) - getAngle(pl.data, o);
    });
  }
  //                                              <<<<<<<<<<<<<<<<<DEDUPLICATION

  //                                              >>>>>>>>>>>>MAKING DATA STRUCT
  var data = {};
  data.used = {};
  data.polygons = [];
  data.polygonsNameMap = {};

  for(var polyPoints of polys){
    var planet = posMap[polyPoints.data];
    data.used[planet.name] = false;
    let pol = new Polygon(planet.owner, planet.name, polyPoints.data, polyPoints);
    data.polygons.push(pol);
    data.polygonsNameMap[pol.name] = pol;
  }

  data.polygons.sort((a,o) => {
    return getAngle([0,0], o.point) - getAngle([0,0], a.point);
  });

  //                                              <<<<<<<<<<<<MAKING DATA STRUCT

  data.polygons.forEach(p => p.initNeighbours(data));

  //                                              >>>>>>>>>>>>>>>>>>MAKING TURNS
  var turnPolygonPoints = [];

  for(var turn of turns){
    var changed = false;
    turn.planets.forEach(p => {
      data.used[p.name] = false;
      if(data.polygonsNameMap[p.name].owner !== p.owner){
        changed = true;
        data.polygonsNameMap[p.name].owner = p.owner;
      }
    });
    if(changed || turnPolygonPoints.length < 1){
      var polygonPoints = [];

      for (let i = 0; i < data.polygons.length; i++) {
        let poly = data.polygons[i];
        if(!data.used[poly.name]){
          var si = poly.getGoodIndex();

          if(si === undefined){
            continue;
          }
          var sie = (si - 1 + poly.polygon.length) % poly.polygon.length;
          for(let layer = 0; layer < sections; layer ++){
            var target = [poly.getPoint(poly.polygon[si], layer)];

            poly.maybeStart(layer, poly.polygon[si], poly.polygon[sie], poly.owner, target, data, []);
            polygonPoints.push({target: target, color: colorFunction(poly.owner)});
          }
        }
      }

      turnPolygonPoints.push(polygonPoints);
    }else{
      var last = turnPolygonPoints[turnPolygonPoints.length-1];
      turnPolygonPoints.push(last);
    }
  }

  //                                              <<<<<<<<<<<<<<<<<<MAKING TURNS

  return function(turn, svg) {
    svg.selectAll("*").remove();

    var poliess = turnPolygonPoints[turn];

    var startDraw = [] ;
    for(var polygonWrap of poliess){
      svg.append("path")
      .attr("d", getPath(polygonWrap.target)).attr("class", "polygon")
      .style("fill",polygonWrap.color).style("opacity", 0.7/sections);

      startDraw.push({p: polygonWrap.target[0], color: polygonWrap.color});
    }
  };
}

module.exports = {
  initVoronoi
};
