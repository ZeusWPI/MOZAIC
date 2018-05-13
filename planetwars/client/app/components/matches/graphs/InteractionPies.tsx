import * as React from 'react';
import * as d3 from "d3";

import { Graph, color, neutralColor, Section } from "./Shared";
import { Player, StaticPlanet } from './MatchLog';

// tslint:disable-next-line:no-var-requires
const styles = require('./GraphView.scss');

export class InteractionPieSection extends Section<{}> {
  public render() {
    const { players, arrivals, gameStates } = this.props.log;
    const width = 250;
    const height = 250;

    // We save interactions with ownerless planets in the last index
    const interactions: Interaction[][] =
      Array(players.length).fill(0).map(() =>
        Array(players.length + 1).fill(0).map((_, i) =>
          ({ player: i, value: 0 })));
    interactions.forEach((pI) => pI[players.length].player = null);

    arrivals.forEach((arr) => {
      const { destination, shipCount, owner, turn } = arr;
      if (turn >= gameStates.length) { return; }

      const target = gameStates[turn].planets[destination.name].owner;
      if (target) {
        interactions[owner.id][target.id].value += shipCount;
      } else {
        interactions[owner.id][players.length].value += shipCount;
      }
    });

    const pies = players.map((player, i) => {
      const data = { player, interactions: interactions[i] };
      return (
        <InteractionPie key={i} width={width} height={height} data={data} />
      );
    });

    return pies;
  }
}

interface Interaction { player: number | null; value: number; }

interface PieProps {
  player: Player;
  interactions: Interaction[];
}

export class InteractionPie extends Graph<PieProps> {
  protected createGraph(): void {
    const { width, height, data } = this.props;
    const node = this.node;
    const svg = d3.select(node);
    svg.selectAll('*').remove();

    const pie = d3.pie<Interaction>().sort(null).value((d) => d.value);
    const g = svg.append('g')
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
      .attr('class', styles.interactionPie);


    const radius = Math.min(width, height) / 2;
    const outerRadius = radius - 10;
    const innerRadius = radius / 2;

    const path = d3.arc<d3.PieArcDatum<Interaction>>()
      .outerRadius(outerRadius)
      .innerRadius(innerRadius);

    const owner = g.append('circle')
      .attr('r', innerRadius)
      .attr('fill', color(data.player.id.toString()));

    const ownerLabel = g
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .text(data.player.name);

    const label = d3.arc<d3.PieArcDatum<Interaction>>()
      .outerRadius(radius - 40)
      .innerRadius(radius - 40);

    const arc = g.selectAll('.arc')
      .data(pie(data.interactions))
      .enter().append('g')
      .attr('class', styles.pieArc);

    arc.append("path")
      .attr("d", path)
      .attr("fill", (d) => {
        return (d.data.player !== null)
          ? color(d.data.player.toString())
          : neutralColor;
      });

    arc.append("text")
      .attr("transform", (d) => "translate(" + label.centroid(d) + ")")
      .attr("dy", "0.35em")
      .text((d) => (d.data.value) ? d.data.value : '');
  }

  protected updateGraph(): void {
    this.createGraph();
  }
}
