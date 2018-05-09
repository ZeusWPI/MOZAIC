import * as React from 'react';
import { Component } from 'react';
import * as d3 from 'd3';

import { Graph, Section, color, GraphProps } from './Shared';
import { PlanetList, Planet, Player, PlayerSnapShot, GameState } from './MatchLog';
import { data } from 'react-hyperscript-helpers';
import { path } from 'd3';

const styles = require('./GraphView.scss');

export class PlayerShipsGraphSection extends Section<{}> {
  public render() {
    const log = this.props.log;
    const playerSnapShotList = log.gameStates;
    const height = 250;
    const width = 250;
    return (
    <div>
      <PlayerShipsGraph width={width} height={height} data={playerSnapShotList} />
     </div>);
  }
}

export class PlayerShipsGraph extends Graph<GameState[]> {

  protected createGraph(): void {
    const { width, height, data} = this.props;
    const node = this.node;
    const svg = d3.select(node);

    console.log(data);

    const radius = Math.min(width, height) / 2;
    const g = svg.append('g').attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    const pie = d3.pie<PlayerSnapShot>().sort(null).value((d) => d.planetsOwned);
    const path = d3.arc<d3.PieArcDatum<PlayerSnapShot>>()
      .outerRadius(radius - 10)
      .innerRadius(radius / 2);

    const arc = g.selectAll('.arc')
      .data(pie(data[0].players))
      .enter().append('g')
      .attr('class', styles.pieArc);

    arc.append("path")
      .attr("d", path)
      .attr("fill", (d) => color(d.data.index.toString()));
  }
}