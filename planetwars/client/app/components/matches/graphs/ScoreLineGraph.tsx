import * as React from 'react';
import { Component } from 'react';
import * as d3 from 'd3';

import { Graph, Section, color } from './Shared';

export class ScoreLineGraphSection extends Section<{}> {
  public render() {
    const log = this.props.log;
    const turns = log.gameStates.map((gs, turn) => ({
      turn,
      players: gs.players.map((p) => ({
        player: p.index,
        amountOfShips: p.shipsOwned,
        amountOfPlanets: p.planetsOwned,
      })),
    }));
    const width = 800;
    const height = 400;
    return <ScoreLineGraph width={width} height={height} data={turns} />;
  }
}

export interface Turn {
  turn: number;
  players: PlayerSnapshot[];
}

export interface PlayerSnapshot {
  player: number;
  amountOfShips: number;
  amountOfPlanets: number;
}

export class ScoreLineGraph extends Graph<Turn[]> {
  protected createGraph(): void {
    const { width, height, data } = this.props;
    const node = this.node;
    const svg = d3.select(node);
    const players = (data[0]) ? data[0].players.map((p) => p.player) : [];

    // Clear old graph
    svg.selectAll('*').remove();

    const g = svg.append("g");

    const x = d3.scalePoint<number>()
      .domain(d3.range(data.length))
      .rangeRound([0, width]);

    const maxShips = d3.max(data, (t) => d3.max(t.players, (p) => p.amountOfShips));
    const maxY = maxShips ? (maxShips + 1) : 1;
    const y = d3.scaleBand<number>()
      .domain(d3.range(maxY || 1))
      .range([height, 0]);

    console.log(x(0), x(data.length - 1));

    players.forEach((pId) => {
      const line = d3.line<Turn>()
        .x((d) => x(d.turn) as number)
        .y((d) => y(d.players[pId].amountOfShips) || 0);

      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color(pId.toString()))
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);
    });

    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .select(".domain")
      .remove();

    g.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text("Amount of ships");

    console.log('Graph!');
  }
}

function faulty(msg: string, val?: any, def?: number): number {
  console.log(val, msg);
  return def || 0;
}
