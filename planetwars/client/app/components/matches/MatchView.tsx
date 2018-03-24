import * as React from 'react';
import Visualizer from '../visualizer/Visualizer';
import { Match, FinishedMatch, ErroredMatch } from './types';
import { div, h } from 'react-hyperscript-helpers';
import { parseLogFileSync } from '../../utils/MatchParser';

export interface MatchViewProps {
  match: Match;
}

export class MatchView extends React.Component<MatchViewProps> {

  public render() {
    const { match } = this.props;
    switch (match.status) {
      case 'finished': {
        const log = parseLogFileSync(this.props.match.logPath)
        return (
          <Visualizer
            playerData={{ players: match.players.map((p) => p.name) }}
            gameLog={log}
          />);
      }
      case 'error': {
        return (
          <div>
            {match.error}
          </div>);
      }
      case 'playing': {
        return (
          <div>
            in progress
        </div>);
      }
    }
  }
}

export default MatchView;
