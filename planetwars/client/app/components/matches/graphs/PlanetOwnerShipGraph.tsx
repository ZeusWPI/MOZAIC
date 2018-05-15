import * as React from 'react';
import { Component } from 'react';
import * as d3 from 'd3';

import { Graph, Section, color, GraphProps, neutralColor } from './Shared';
import { PlanetList, Planet, GameState, StaticPlanet, Player } from './MatchLog';

// tslint:disable-next-line:no-var-requires
const styles = require('./GraphView.scss');

export class PlanetOwnerShipGraphSection extends Section<{}> {
  public render() {
    const log = this.props.log;
    const numberOfStates = log.gameStates.length;
    const planetMap = new Map<string, OwnerShipData>();
    const planetExpeditionCount = new Map<string, number>();
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
          const curCount = planetExpeditionCount.get(planet.name);
          if (curCount !== undefined) {
            planetExpeditionCount.set(planet.name, curCount + 1);
          } else {
            planetExpeditionCount.set(planet.name, 1);
          }
        }
      });
    });

    const planetPlayerData: PlanetPlayerData[] = [];
    const planetNames = Array.from(planetMap.keys());
    planetNames.forEach((name) => {
      const playerCount = (planetMap.get(name) as OwnerShipData).playerCount;
      Array.from(playerCount.keys()).sort().forEach((player) => {
        let playerName: string;
        let playerId: number | null;
        if (player !== undefined) {
          playerName = player.name;
          playerId = player.id;
        } else {
          playerName = "undefined";
          playerId = null;
        }
        planetPlayerData.push({ planetName: name,
          playerName,
          playerId,
          expeditionCount: (playerCount.get(player) as number),
        });
      });
    });

    const width = 800;
    const height = 400;

    const data: PlanetOwnerShipData = { numberOfStates, planetPlayerData, planetNames, planetExpeditionCount };

    return < PlanetOwnerShipGraph width={width} height={height} data={data} />;
  }
}

export interface PlanetOwnerShipData {
  numberOfStates: number;
  planetPlayerData: PlanetPlayerData[];
  planetNames: string[];
  planetExpeditionCount: Map<string, number>;
}

export interface PlanetPlayerData {
  planetName: string;
  playerName: string;
  playerId: number | null;
  expeditionCount: number;
}

export interface OwnerShipData {
  playerCount: Map<Player | undefined, number>;
}

export class PlanetOwnerShipGraph extends Graph<PlanetOwnerShipData> {
  protected createGraph(): void { 
    const { width, height, data } = this.props;
    const xScale = d3.scaleBand()
                    .domain(data.planetNames)
                    .rangeRound([0, width])
                    .paddingInner(0.05);

    const heightScale = d3.scaleLinear()
                    .domain([0, data.numberOfStates])
                    .range([0, height]);

    const node = this.node;
    const svg = d3.select(node);
    svg.selectAll("*").remove();
    const g = svg.append("g");

    const planetBarCurrentHeight: Map<string, number> = new Map<string, number>();
    for (let name of data.planetNames) {
      planetBarCurrentHeight.set(name, 0);
    }

    data.planetPlayerData.forEach((element) => {
      const curHeight = heightScale(element.expeditionCount / (data.planetExpeditionCount.get(element.planetName) as number));
      g.append("rect")
        .attr("x", xScale(element.planetName) as number)
        .attr("y", planetBarCurrentHeight.get(element.planetName) as number)
        .attr("width", xScale.bandwidth)
        .attr("height", curHeight)
        .attr("fill", element.playerId !== null ? color(element.playerId.toString()) : neutralColor);

      const planetHeight = planetBarCurrentHeight.get(element.planetName) as number;
      planetBarCurrentHeight.set(element.planetName, planetHeight + curHeight);
    });
  }


  protected updateGraph(): void {
    this.createGraph();
  }
}