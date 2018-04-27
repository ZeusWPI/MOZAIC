import * as React from 'react';
import { Component } from 'react';
import * as   d3 from 'd3';

import * as External from '../../../lib/match/log';
import { MatchLog } from './MatchLog';

// tslint:disable-next-line:no-var-requires
const styles = require('./GraphView.scss');

const _colors = [
  '#DE8D47', // Main Primary color
  '#2C8286', // Main Complement color
  '#9ECE43', // Free style (green)
  '#DE4B47', // Free style (red)
  '#553C99', // Main Secondary color (2)
  '#B4397C', // Adjacent
  '#DEC547', // Main Secondary color (1)
];

const color = d3.scaleOrdinal(_colors);

interface GraphViewProps {
  matchLog: External.MatchLog;
}

interface GraphViewState {
  log: MatchLog;
}

export class GraphView extends Component<GraphViewProps, GraphViewState> {
  public state: GraphViewState = {} as GraphViewState;

  public static getDerivedStateFromProps(
    nextProps: GraphViewProps,
    prevState: GraphViewState): GraphViewState {
    return { log: new MatchLog(nextProps.matchLog) };
  }

  public render() {
    const log = this.state.log;
    const sections: JSX.Element[] = [
      <DemoSection />,
      // <SimplePieCharts log={log} />,
      // <DemoSection />,
      // <DemoSection />,
    ];

    return (
      <div className={styles.allGraphsContainer}>
        <ul className={styles.sections}>
          {sections.map((Section, i) => (
            <li className={styles.section} key={i}>{Section}</li>
          ))}
        </ul>
      </div>
    );
  }
}

export class SimplePieCharts extends Component<{ log: MatchLog }> {
  public render() {
    const { log } = this.props;
    return <p> Timp put code here {log.winners.toString()}</p>;
  }
}

export class DemoSection extends Component {
  public render() {
    // Generate random data for each player
    const demoData = (playerAmount: number) => {
      return Array.from({ length: playerAmount }).map((v, i) => ({
        player: i,
        value: Math.ceil(Math.random() * 100),
      }));
    };
    const width = 250;
    const height = 250;
    return [
      <DemoPie key={1} width={width} height={height} data={demoData(4)} />,
      <DemoPie key={2} width={width} height={height} data={demoData(2)} />,
      <DemoPie key={3} width={width} height={height} data={demoData(3)} />,
      <DemoPie key={4} width={width} height={height} data={demoData(7)} />,
      // <DemoPie key={5} width={width} height={height} data={demoData(7)} />,
      // <DemoPie key={6} width={width} height={height} data={demoData(7)} />,
      // <DemoPie key={7} width={width} height={height} data={demoData(7)} />,
    ];
  }
}

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
    this.createGraph();
  }

  public render() {
    return (
      <div className={styles.svgWrapper}>
        <svg
          className={styles.graph}
          ref={(node: SVGSVGElement) => this.node = node}
          width={this.props.width}
          height={this.props.height}
        />
      </div>
    );
  }

  protected abstract createGraph(): void;
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
}
