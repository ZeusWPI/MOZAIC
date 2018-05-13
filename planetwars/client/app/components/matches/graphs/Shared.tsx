import * as React from 'react';
import { Component } from 'react';
import * as d3 from 'd3';
import { MatchLog } from './MatchLog';

// tslint:disable-next-line:no-var-requires
const styles = require('./GraphView.scss');

const _colors = [
  '#DE8D47', // (orange) Main Primary color
  '#2C8286', // (teal) Main Complement color
  '#9ECE43', // (green) Free style
  '#DE4B47', // (red) Free style
  '#553C99', // (purple) Main Secondary color (2)
  '#B4397C', // (pink) Adjacent
  '#DEC547', // (yellow) Main Secondary color (1)
];

export const color = d3.scaleOrdinal(_colors);

export interface SectionProps {
  log: MatchLog;
}

export abstract class Section<State> extends Component<SectionProps, State> { }

export interface GraphProps<T> {
  data: T;
  width: number;
  height: number;
}

export abstract class Graph<T> extends Component<GraphProps<T>> {
  protected node: SVGSVGElement;

  constructor(props: GraphProps<T>) {
    super(props);
    this.createGraph = this.createGraph.bind(this);
  }

  public componentDidMount() {
    this.createGraph();
  }

  public componentDidUpdate() {
    this.updateGraph();
  }

  public render() {
    return (
      <div className={styles.svgWrapper} >
        <svg
          className={styles.graph}
          ref={(node: SVGSVGElement) => this.node = node
          }
          width={this.props.width}
          height={this.props.height}
        />
      </div>
    );
  }

  protected abstract createGraph(): void;

  protected abstract updateGraph(): void;
}

interface DemoData {
  player: number;
  value: number;
}

export class DemoPie extends Graph<DemoData[]> {
  protected createGraph(): void {
    const { width, height, data } = this.props;
    const node = this.node;
    const svg = d3.select(node);

    const radius = Math.min(width, height) / 2;
    const g = svg.append('g').attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    const pie = d3.pie<DemoData>().sort(null).value((d) => d.value);

    const path = d3.arc<d3.PieArcDatum<DemoData>>()
      .outerRadius(radius - 10)
      .innerRadius(radius / 2);

    const label = d3.arc<d3.PieArcDatum<DemoData>>()
      .outerRadius(radius - 40)
      .innerRadius(radius - 40);

    const arc = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', styles.pieArc);

    arc.append("path")
      .attr("d", path)
      .attr("fill", (d) => color(d.data.player.toString()));

    arc.append("text")
      .attr("transform", (d) => "translate(" + label.centroid(d) + ")")
      .attr("dy", "0.35em")
      .text((d) => d.data.value);
  }

  protected updateGraph(): void {
    this.createGraph();
  }
}

export interface PlayerLegendData {
  id: number;
}

export class PlayerLegend extends Graph<{}> {
  protected createGraph(): void { }

  protected updateGraph(): void {
    this.createGraph();
  }
}
