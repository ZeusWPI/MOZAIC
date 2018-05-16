import * as React from 'react';
import { Component } from 'react';
import * as d3 from 'd3';

import { Graph, Section, color, GraphProps, neutralColor } from './Shared';
import { PlanetList, Planet, GameState, StaticPlanet, Expedition, Dict } from './MatchLog';

// tslint:disable-next-line:no-var-requires
const styles = require('./GraphView.scss');

export class MapViewGraphSection extends Section<{}> {
  public render() {
    const { gameStates, planets, planetMap, expeditions } = this.props.log;

    const [minX, maxX] = d3.extent(planets, (p) => p.x) as [number, number];
    const [minY, maxY] = d3.extent(planets, (p) => p.y) as [number, number];
    const max = { x: maxX, y: maxY };
    const min = { x: minX, y: minY };

    const dX = (max.x - min.x);
    const dY = (max.y - min.y);
    const ratio = dY / dX;

    const width = 600;
    const height = ratio * width;

    const paths = Array(planets.length).fill(0)
      .map(() => Array(planets.length).fill(0));

    expeditions.forEach((exp) => {
      const { origin, destination, shipCount } = exp;
      const or = planetMap[origin.name];
      const dest = planetMap[destination.name];
      paths[or.index][dest.index] += shipCount;
      paths[dest.index][or.index] += shipCount;
    });

    const startingPlanets: StaticPlanet[] = [];
    Array.from(Object.keys(gameStates[0].planets)).forEach((name) => {
      const planet = gameStates[0].planets[name];
      if (planet.owner !== undefined) {
        const staticPlanet = planetMap[name];
        startingPlanets.push(staticPlanet);
      }
    });

    const data = { max, min, planets, paths, startingPlanets };
    return <MapViewGraph width={width} height={height} data={data} />;
  }
}

export interface MapViewData {
  planets: StaticPlanet[];
  paths: number[][];
  min: { x: number, y: number };
  max: { x: number, y: number };
  startingPlanets: StaticPlanet[];
}

export class MapViewGraph extends Graph<MapViewData> {
  private svg: d3.Selection<SVGSVGElement, {}, null, undefined>;
  private root: d3.Selection<d3.BaseType, {}, null, undefined>;

  protected createGraph(): void {
    const { data, width, height } = this.props;
    const { min, max, paths, planets } = data;

    const minRadius = 5;
    const maxRadius = 30;

    const x = d3.scaleLinear()
      .domain([min.x, max.x])
      .range([0 + maxRadius, width - maxRadius]);

    const y = d3.scaleLinear()
      .domain([min.y, max.y])
      .range([0 + maxRadius, height - maxRadius]);

    const busiestPath = d3.max(paths, (ps) => d3.max(ps, (p) => p)) || 0;
    const strokeWidth = d3.scaleLinear()
      .domain([0, busiestPath])
      .range([1, maxRadius]);

    const radius = d3.scaleLinear()
      .domain([0, busiestPath])
      .range([minRadius, maxRadius]);

    const opacity = d3.scaleLinear()
      .domain([0, busiestPath])
      .range([0.1, 1]);

    this.svg = d3.select(this.node);
    this.svg.selectAll('*').remove();
    this.root = this.svg.append('g').attr('class', 'root-yo');

    const lines = this.root.append('g').attr('class', 'lines-yo');
    paths.forEach((planetPaths, or) => {
      planetPaths.forEach((path, dest) => {
        lines.append('line')
          .attr("x1", x(planets[or].x))
          .attr("y1", y(planets[or].y))
          .attr("x2", x(planets[dest].x))
          .attr("y2", y(planets[dest].y))
          .attr("stroke-width", strokeWidth(path))
          .attr("stroke", color('1'))
          .attr("opacity", opacity(path));
      });
    });

    this.root.append('g')
      .attr('class', 'circles-yo')
      .selectAll('circle')
      .data(data.planets)
      .enter()
      .append('circle')
      .attr("cx", (p) => x(p.x))
      .attr("cy", (p) => y(p.y))
      .attr("r", (p) => radius(d3.max(paths[p.index]) || minRadius))
      .attr("fill", color('0'))
      .on("mouseover", (p) => {
        const r = radius(d3.max(paths[p.index]) || minRadius);
        let curX = x(p.x);
        let curY = y(p.y);
        let anchor: string;
        let baseline = "";
        if (curX <= width / 2) {
          curX += r;
          anchor = "start";
        } else {
          curX -= r;
          anchor = "end";
        }
        if (curY <= height / 2) {
          curY += r;
        } else {
          curY -= r;
          baseline = "hanging";
        }
        this.root.append('text')
          .attr('class', 'text-yo')
          .attr("x",  curX)
          .attr("y", curY)
          .attr("text-anchor", anchor)
          .attr("alignment-baseline", baseline)
          .text(p.name)
          .style("font-weight", "bold")
          .style("fill", "white");
      })
      .on("mouseout", () => this.root.selectAll(".text-yo").remove());

    this.root.append('g')
      .attr('class', 'starting-planets-yo')
      .selectAll('circle')
      .data(data.startingPlanets)
      .enter()
      .append('circle')
      .attr("cx", (p) => x(p.x))
      .attr("cy", (p) => y(p.y))
      .attr("r", minRadius)
      .attr("fill", color("1"))
      .on("mouseover", (p) => {
        const r = radius(d3.max(paths[p.index]) || minRadius);
        let curX = x(p.x);
        let curY = y(p.y);
        let anchor: string;
        let baseline = "";
        if (curX <= width / 2) {
          curX += r;
          anchor = "start";
        } else {
          curX -= r;
          anchor = "end";
        }
        if (curY <= height / 2) {
          curY += r;
        } else {
          curY -= r;
          baseline = "hanging";
        }
        this.root.append('text')
          .attr('class', 'text-yo')
          .attr("x",  curX)
          .attr("y", curY)
          .attr("text-anchor", anchor)
          .attr("alignment-baseline", baseline)
          .text(p.name)
          .style("font-weight", "bold")
          .style("fill", "white");
      })
      .on("mouseout", () => this.root.selectAll(".text-yo").remove());
  }

  protected updateGraph(): void {
    this.createGraph();
  }
}
