import * as React from 'react';
import { Component } from 'react';
import * as d3 from 'd3';

import { Graph, Section, color, GraphProps } from './Shared';
import { PlanetList, Planet, GameState, StaticPlanet, Player } from './MatchLog';

// tslint:disable-next-line:no-var-requires
const styles = require('./GraphView.scss');

export class PlanetOwnerShipGraphSection extends Section<{}> {
  public render() {
    const log = this.props.log;
    const numberOfStates = log.gameStates.length;
    const planetMap = new Map<string, OwnerShipData>();
    log.gameStates.forEach((state) => {
      Object.keys(state.planets).forEach((name) => {
        const planet = state.planets[name];
        const planetOwnerShipData = planetMap.get(planet.name);
        if (planetOwnerShipData !== undefined) {
          const playerData = planetOwnerShipData.playerCount.get(planet.owner);
          if (playerData !== undefined) {
            planetOwnerShipData.playerCount.set(planet.owner, playerData + 1);
          } else {
            planetOwnerShipData.playerCount.set(planet.owner, 1);
          }
          planetMap.set(planet.name, planetOwnerShipData);
        } else {
          const newPlanetOwnerShipData: OwnerShipData = { 
            playerCount: new Map<Player | undefined, number>(),
          };
          newPlanetOwnerShipData.playerCount.set(planet.owner, 1);
          planetMap.set(planet.name, newPlanetOwnerShipData);
        }
      });
    });

    const width = 800;
    const height = 400;

    const data: PlanetOwnerShipData = { numberOfStates, planetMap };

    return < PlanetOwnerShipGraph width={width} height={height} data={data} />;
  }
}

export interface PlanetOwnerShipData {
  numberOfStates: number;
  planetMap: Map<string, OwnerShipData>;
}

export interface OwnerShipData {
  playerCount: Map<Player | undefined, number>;
}

export class PlanetOwnerShipGraph extends Graph<PlanetOwnerShipData> {
  protected createGraph(): void { 
    const { width, height, data } = this.props;
    const planetCount: number = data.planetMap.size;
    
    const xScale = d3.scaleBand()
                    .domain(Array.from(data.planetMap.keys()))
                    .rangeRound([0, width])
                    .paddingInner(0.05);

    const node = this.node;
    const svg = d3.select(node);
    svg.selectAll("*").remove();
    const g = svg.append("g");

    g.selectAll("rect")
      .data(Array.from(data.planetMap.keys()))
      .enter()
      .append("rect")
      .attr("x", (d, i) => xScale(d) as number)
      .attr("y", (d) => 0)
      .attr("width", xScale.bandwidth)
      .attr("height", height)
      .attr("fill", "hotpink");
  }

  protected updateGraph(): void {
    this.createGraph();
  }
}