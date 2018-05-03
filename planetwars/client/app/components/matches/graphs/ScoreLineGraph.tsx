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
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };

    // Clear old graph
    svg.selectAll('*').remove();

    const g = svg
      .append("g")
    // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleOrdinal<number, number>()
      .range([0, width])
      .domain([0, data.length] as any);

    const maxY = d3.max(data, (t) => d3.max(t.players, (p) => p.amountOfShips));
    const y = d3.scaleOrdinal<number, number>()
      .range([0, height])
      .domain([0, maxY || 0]);

    const line1 = d3.line<Turn>()
      .x((d) => d.turn)
      .y((d) => d.players[0].amountOfShips);

    const line2 = d3.line<Turn>()
      .x((d) => d.turn)
      .y((d) => d.players[1].amountOfShips);

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

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color('1'))
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line1);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color('2'))
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line2);

    console.log('Graph!');
  }
}
