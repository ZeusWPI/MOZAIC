import * as React from 'react';
import Visualizer from '../visualizer/Visualizer';
import { Match, FinishedMatch, ErroredMatch } from './types';
import { div, h } from 'react-hyperscript-helpers';
import { parseLog } from '../../lib/match/log';

const styles = require('./Matches.scss');


export interface MatchViewProps {
  match?: Match;
}

export interface MatchViewState {
  error?: {
    error: any;
    info: any;
  };
}

export class MatchView extends React.Component<MatchViewProps, MatchViewState> {

  public constructor(props: MatchViewProps) {
    super(props);
    this.state = {};
  }

  // Catch the visualizer throwing errors so your whole app isn't broken
  public componentDidCatch(error: any, info: any) {
    this.setState({ error: { error, info } });
  }

  public render() {
    if (this.state.error) {
      return (
        <div>
          <p>{this.state.error.error.toString()}</p>
          <p>{JSON.stringify(this.state.error.info)}</p>
        </div>
      );
    }
    const { match } = this.props;
    if (!match) {
      return null;
    }
    switch (match.status) {
      case 'finished': {
        const log = parseLog(match.players, match.logPath);
        return <Visualizer matchLog={log}/>;
      }
      case 'error': {
        return (
          <div className={styles.matchViewContainer}>
            <div className={styles.matchError}>
              {match.error}
            </div>
          </div>
        );
      }
      case 'playing': {
        return (
          <div className={styles.matchViewContainer}>
            <div className={styles.matchInProgress}>
              match in progress
            </div>
          </div>
        );
      }
    }
  }
}

export default MatchView;
