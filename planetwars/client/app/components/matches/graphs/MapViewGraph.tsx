import * as React from 'react';
import { Component } from 'react';
import * as d3 from 'd3';

import { Graph, Section, color, GraphProps } from './Shared';
import { PlanetList, Planet, GameState, StaticPlanet, Expedition } from './MatchLog';

// tslint:disable-next-line:no-var-requires
const styles = require('./GraphView.scss');

export class MapViewGraphSection extends Section<{}> {
  public render() {
    const log = this.props.log;
    const width = 800;
    const height = 400;

    const planets = log.gameStates[0].planets;
    const planetList: Planet[] = [];
    const planetCountMap: Map<string, number> = new Map<string, number>();

    Object.keys(planets).forEach((name) => {
      planetList.push(planets[name]);
      planetCountMap.set(name, 0);
    });

    const [minX, maxX] = d3.extent(planetList, (p) => p.x) as [number, number];
    const [minY, maxY] = d3.extent(planetList, (p) => p.y) as [number, number];

    let expeditionList: Expedition[] = [];
    log.gameStates.forEach((state) => {
      const newList = expeditionList.concat(state.expeditions);
      expeditionList = newList;
    });

    expeditionList.forEach((e) => {
      const currentCount = planetCountMap.get(e.destination.name) as number;
      planetCountMap.set(e.destination.name, currentCount + 1);
    });

    const planetCounts: PlanetCounter[] = [];
    Array.from(planetCountMap.keys()).forEach((k) => {
      const count = planetCountMap.get(k) as number;
      planetCounts.push({name: k, count});
    });

    const data: MapViewData = {
      planetMap: planets,
      planetList,
      expeditions: expeditionList,
      receivingPlanetCountMap: planetCountMap,
      receivingPlanetCount: planetCounts,
      minX,
      maxX,
      minY,
      maxY,
    };

    return <MapViewGraph width={width} height={height} data={data} />;
  }
}

export interface PlanetCounter {
  name: string;
  count: number;
}

export interface MapViewData {
  planetMap: PlanetList;
  planetList: Planet[];
  expeditions: Expedition[];
  receivingPlanetCountMap: Map<string, number>;
  receivingPlanetCount: PlanetCounter[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class MapViewGraph extends Graph<MapViewData> {
  protected createGraph(): void {
    const { width, height, data } = this.props;

    const minRadius = 10;
    const maxRadius = 3 * minRadius;

    const xScale = d3.scaleLinear()
      .domain([data.minX, data.maxX])
      .range([maxRadius, width - maxRadius]);
    const yScale = d3.scaleLinear()
      .domain([data.minY, data.maxY])
      .range([maxRadius, height - maxRadius]);
    const radiusScale = d3.scaleLinear()
      .domain(d3.extent(data.receivingPlanetCount, (e) => e.count) as [number, number])
      .range([minRadius, maxRadius]);
    const widthScale = d3.scaleLinear()
      .domain([0, d3.max(data.expeditions, (e) => e.shipCount) as number])
      .range([0, minRadius]);
    const opacityScale = d3.scaleLinear()
      .domain([0, d3.max(data.expeditions, (e) => e.shipCount) as number])
      .range([0, 0.1]);


    const node = this.node;
    const svg = d3.select(node);
    svg.selectAll("*").remove();
    const g = svg.append("g");

    data.expeditions.forEach((expedition) => {
      g.append("line")
        .attr("x1", xScale(expedition.origin.x))
        .attr("y1", yScale(expedition.origin.y))
        .attr("x2", xScale(expedition.destination.x))
        .attr("y2", yScale(expedition.destination.y))
        .attr("stroke-width", widthScale(expedition.shipCount))
        .attr("stroke", "#888")
        .attr("opacity", opacityScale(expedition.shipCount));
    });

    g.selectAll("circle")
      .data(data.planetList)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", (d) => radiusScale(data.receivingPlanetCountMap.get(d.name) as number))
      .attr("fill", (d) => color(d.name.toString()));
  }
}
