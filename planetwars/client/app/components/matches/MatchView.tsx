import * as React from 'react';
import Visualizer from '../visualizer/Visualizer';
import { Match, FinishedMatch, ErroredMatch } from './types';
import { div, h } from 'react-hyperscript-helpers';
import { parseLogFileSync } from '../../utils/MatchParser';

export interface MatchViewProps {
  match: Match;
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
