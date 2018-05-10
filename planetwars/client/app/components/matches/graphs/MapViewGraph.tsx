import * as React from 'react';
import { Component } from 'react';
import * as d3 from 'd3';

import { Graph, Section, color, GraphProps } from './Shared';
import { PlanetList, Planet, GameState, StaticPlanet } from './MatchLog';
import { data } from 'react-hyperscript-helpers';
import { path } from 'd3';

const styles = require('./GraphView.scss');

export class MapViewGraphSection extends Section<{}> {
  public render() {
    const log = this.props.log;
    const width = 800;
    const height = 400;
    return <MapViewGraph width={width} height={height} data={log.gameStates[0].planets} />;
  }
}

export class MapViewGraph extends Graph<PlanetList> {
  protected createGraph(): void {
    const { width, height, data } = this.props;
    const planets: Planet[] = [];
    var minX: number = Number.MAX_SAFE_INTEGER;
    var maxX: number = Number.MIN_SAFE_INTEGER;
    var minY: number = Number.MAX_SAFE_INTEGER;
    var maxY: number = Number.MIN_SAFE_INTEGER;
    const xCoords: number[] = [];
    const yCoords: number[] = [];
    Object.keys(data).forEach((name) => {
      planets.push(data[name]);
      const x = data[name].x;
      const y = data[name].y;
      if (x < minX) { minX = x; }
      if (x > maxX) { maxX = x; }
      if (y < minY) { minY = y; }
      if (y > maxY) { maxY = y; }
    });

    const radius = 10;

    const xScale = d3.scaleLinear()
                    .domain([minX, maxX])
                    .range([radius, width - radius]);
    const yScale = d3.scaleLinear()
                    .domain([minY, maxY])
                    .range([radius, height - radius]);

    const node = this.node;
    const svg = d3.select(node);
    svg.selectAll("*").remove();
    const g = svg.append("g");
    g.selectAll("circle")
        .data(planets)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", radius)
        .attr("fill", d => color(d.name.toString()));
  }
}