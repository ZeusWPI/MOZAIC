import * as React from 'react';
import { Component } from 'react';
import * as d3 from 'd3';

import * as External from '../../../lib/match/log';
import { MatchLog } from './MatchLog';
import { DemoPie, Section } from './Shared';
import { ScoreLineGraphSection } from './ScoreLineGraph';
import { PlayerShipsGraphSection } from './PlayerShipsGraph';
import { MapViewGraphSection } from './MapViewGraph';
import { PlanetOwnerShipGraphSection } from './PlanetOwnerShipGraph';

// tslint:disable-next-line:no-var-requires
const styles = require('./GraphView.scss');

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
      <DemoSection log={log} />,
      <ScoreLineGraphSection log={log} />,
      <MapViewGraphSection log={log}/>,
      <PlanetOwnerShipGraphSection log={log}/>,
    ];

    return (
      <div className={styles.allGraphsContainer}>
        <ul className={styles.sections}>
          {sections.map((section, i) => (
            <li className={styles.section} key={i}>{section}</li>
          ))}
        </ul>
      </div>
    );
  }
}

export class DemoSection extends Section<{}> {
  public render() {
    // Generate random data for each player
    const demoData = (playerAmount: number) => {
      return Array.from({ length: playerAmount }).map((v, i) => ({
        player: i,
        value: Math.ceil((Math.random() + 0.10) * 100),
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