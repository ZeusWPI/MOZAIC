import * as React from 'react';
import Visualizer from '../visualizer/Visualizer';
import { Match, FinishedMatch, ErroredMatch } from './types';
import { div, h } from 'react-hyperscript-helpers';
import { parseLog } from '../../lib/match/log';

const styles = require('./Matches.scss');


export interface MatchViewProps {
  match?: Match;
}

export class MatchView extends React.Component<MatchViewProps> {

  public render() {
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
