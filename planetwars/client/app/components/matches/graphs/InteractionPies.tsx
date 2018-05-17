import * as React from 'react';
import * as d3 from "d3";

import { Graph, color, neutralColor, Section } from "./Shared";
import { Player, StaticPlanet } from './MatchLog';

// tslint:disable-next-line:no-var-requires
const styles = require('./GraphView.scss');

export class InteractionPieSection extends Section<{}> {
  public render() {
    const { players, gameStates, expeditions } = this.props.log;
    const width = 250;
    const height = 250;

    // We save interactions with ownerless planets in the last index
    const interactions: Interaction[][] =
      Array(players.length).fill(0).map(() =>
        Array(players.length + 1).fill(0).map((_, i) =>
          ({ player: i, value: 0 })));
    interactions.forEach((pI) => pI[players.length].player = null);

    expeditions.forEach((exp) => {
      const { destination, shipCount, owner, turn, duration } = exp;
      const arrival = turn + duration;
      if (arrival >= gameStates.length) { return; }
      const gs = gameStates[arrival - 1];
      const target = gs.planets[destination.name].owner;
      const index = (target) ? target.id : players.length;
      interactions[owner.id][index].value += shipCount;
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
  private arc: d3.Selection<d3.BaseType, d3.PieArcDatum<Interaction>, d3.BaseType, {}>;
  private pie = d3.pie<Interaction>().sort(null).value((d) => d.value);
  private g: d3.Selection<d3.BaseType, {}, null, undefined>;
  private path: d3.Arc<any, d3.PieArcDatum<Interaction>>;
  private radius: number;
  private outerRadius: number;
  private innerRadius: number;

  protected createGraph(): void {
    const { width, height, data } = this.props;
    const node = this.node;
    const svg = d3.select(node);
    svg.selectAll('*').remove();

    this.g = svg.append('g')
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
      .attr('class', styles.interactionPie);

    this.radius = Math.min(width, height) / 2;
    this.outerRadius = this.radius - 10;
    this.innerRadius = this.radius / 2;

    this.path = d3.arc<d3.PieArcDatum<Interaction>>()
      .outerRadius(this.outerRadius)
      .innerRadius(this.innerRadius);

    const owner = this.g.append('circle')
      .attr('r', this.innerRadius)
      .attr('fill', color(data.player.id.toString()))
      .on('mouseover', () => this.handleMouseOver())
      .on('mouseout', () => this.handleMouseOut());

    const ownerLabel = this.g
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .text(data.player.name)
      .on('mouseover', () => this.handleMouseOver())
      .on('mouseout', () => this.handleMouseOut());

    this.arc = this.g.selectAll('.arc')
      .data(this.pie(this.getInteractions(false)));

    this.drawPie(this.arc);
  }

  protected updateGraph(): void {
    this.createGraph();
  }

  private drawPie(selector: d3.Selection<d3.BaseType, d3.PieArcDatum<Interaction>, d3.BaseType, {}>) {
    const label = d3.arc<d3.PieArcDatum<Interaction>>()
      .outerRadius(this.radius - 40)
      .innerRadius(this.radius - 40);

    const arc = selector
      .enter().append('g')
      .attr('class', styles.pieArc);

    arc.append("path")
      .attr("d", this.path)
      .attr("fill", (d) => {
        return (d.data.player !== null)
          ? color(d.data.player.toString())
          : neutralColor;
      });

    arc.append("text")
      .attr("transform", (d) => "translate(" + label.centroid(d) + ")")
      .attr("dy", "0.35em")
      .text((d) => (d.data.value) ? d.data.value : (console.log(d) as any));
  }

  private handleMouseOver() {
    this.arc = this.g.selectAll('.arc')
      .data(this.pie(this.getInteractions(true)));

    this.drawPie(this.arc);
  }

  private handleMouseOut() {
    this.arc = this.g.selectAll('.arc')
      .data(this.pie(this.getInteractions(false)));

    this.drawPie(this.arc);
  }

  private getInteractions(withSupport: boolean = false): Interaction[] {
    // Filter out support ships
    const { data: { interactions, player } } = this.props;
    return (withSupport)
      ? interactions
      : interactions.filter((int) => (int.player == null) || (int.player !== player.id));
  }


}
