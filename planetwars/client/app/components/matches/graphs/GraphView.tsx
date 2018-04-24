import * as React from 'react';
import { Component } from 'react';

import * as External from '../../../lib/match/log';
import { MatchLog } from './MatchLog';

// tslint:disable-next-line:no-var-requires
const styles = require('./GraphView.scss');

interface GraphViewProps {
  matchLog: External.MatchLog;
}

interface GraphViewState {
  log: MatchLog;
}

export class GraphView extends Component<GraphViewProps, GraphViewState> {
  public static getDerivedStateFromProps(
    nextProps: GraphViewProps,
    prevState: GraphViewState): GraphViewState {
    return { log: new MatchLog(nextProps.matchLog) };
  }

  public render() {
    const log = this.state.log;
    const sections: JSX.Element[] = [
      <DemoSection />,
      <SimplePieCharts log={log} />,
      <DemoSection />,
      <DemoSection />,
    ];

    return (
      <div className={styles.allGraphsContainer}>
        <ul>
          {sections.map((Section, i) => (
            <li key={i}>{Section}</li>
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
    return (
      <div className={styles.demoSection}>
        <p>Hai Timp</p>
      </div>
    );
  }
}
