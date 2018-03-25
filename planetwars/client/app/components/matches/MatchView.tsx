import * as React from 'react';
import Visualizer from '../visualizer/Visualizer';
import { Match, FinishedMatch, ErroredMatch } from './types';
import { div, h } from 'react-hyperscript-helpers';
import { parseLog } from '../../lib/match/log';
import { LogView } from '../logView/logView'

const styles = require('./Matches.scss');


export interface MatchViewProps {
  match?: Match;
}

interface MatchViewState {
  showLog: boolean;
}

export class MatchView extends React.Component<MatchViewProps, MatchViewState> {
  public constructor(props: MatchViewProps) {
    super(props);
    this.state = {
      showLog: true
    };
  }
  public render() {
    const match = this.props.match;
    if (!match) {
      return null;
    }
    switch (match.status) {
      case 'finished': {
        const log = parseLog(match.players, match.logPath);
        const display = this.state.showLog ? (<LogView matchLog={log}/>) : (<Visualizer matchLog={log}/>);
        return (
          <div className={styles.matchViewContainer}>
            <div>
              <div onClick={() => {
                                this.setState({showLog: false});
                                console.log("setting visualizer");
                            }}>
                Visualizer
              </div>
              <div onClick={() => this.setState({showLog: true})}>
                log
              </div>
            </div>
            {display}
          </div>
        );
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
