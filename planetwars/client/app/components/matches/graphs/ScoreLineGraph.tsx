import * as React from 'react';
import { Component } from 'react';
import * as d3 from 'd3';

import { Graph, Section, color } from './Shared';
import { ticks } from 'd3';

// tslint:disable-next-line:no-var-requires
const styles = require('./GraphView.scss');

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
    const { data } = this.props;
    const node = this.node;
    const svg = d3.select(node);
    const players = (data[0]) ? data[0].players.map((p) => p.player) : [];
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = this.props.width - margin.left - margin.right;
    const height = this.props.height - margin.top - margin.top;

    // Clear old graph
    svg.selectAll('*').remove();

    console.log(data);


    const g = svg
      .append("g")
      .attr('class', styles.scoreLineGraph)
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scalePoint<number>()
      .domain(d3.range(data.length))
      .rangeRound([0, width]);

    const maxShips = d3.max(data, (t) => d3.max(t.players, (p) => p.amountOfShips));
    const maxY = maxShips ? (maxShips + 1) : 1;
    const y = d3.scaleBand<number>()
      .domain(d3.range(maxY || 1))
      .range([height, 0]);

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
      .attr('transform', `translate(0, ${height})`)
      .attr('class', styles.xAxis)
      .call(d3
        .axisBottom(x)
        .tickValues(d3.ticks(0, data.length, 10))
        .tickSizeOuter(0)
        .tickSizeInner(0),
    );

    g.append("g")
      .attr('class', styles.yAxis)
      .call(d3
        .axisLeft(y)
        .tickValues(d3.ticks(0, maxY, 5))
        .tickSizeOuter(0)
        .tickSizeInner(0),
    )
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("dy", "20px")
      .text("Amount of ships");
  }
}

function faulty(msg: string, val?: any, def?: number): number {
  console.log(val, msg);
  return def || 0;
}
