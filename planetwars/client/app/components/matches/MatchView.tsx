import * as React from 'react';
import Visualizer from '../visualizer/Visualizer';
import { Match, FinishedMatch, ErroredMatch } from './types';
import { parseLog, MatchLog } from '../../lib/match/log';
import { LogView } from './LogView';

const styles = require('./Matches.scss');

export interface ContainerProps {
  match?: Match;
}

interface MatchViewState {
  showLog: boolean;
}

export class MatchViewContainer extends React.Component<ContainerProps> {
  public render() {
    const match = this.props.match;
    if (!match) {
      return null;
    }
    switch (match.status) {
      case 'finished': {
        const log = parseLog(match.players, match.logPath);
        return (
          <div className={styles.matchViewContainer}>
            <MatchView matchLog={log}/>
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

interface Props {
  matchLog: MatchLog;
}

enum ViewState {
  VISUALIZER,
  LOG,
}

interface State {
  viewState: ViewState;
}

export class MatchView extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = {
      viewState: ViewState.VISUALIZER,
    };
  }

  public render() {
    const { matchLog } = this.props;
    const { viewState } = this.state;

    const showVisualizer = () => {
      this.setState({ viewState: ViewState.VISUALIZER});
    };

    const showVis = () => this.showVisualizer();
    const showLog = () => this.showLog();

    // return <MatchDisplay viewState={viewState} matchLog={matchLog}/>;
    return (
      <div className={styles.matchView}>
        <div className={styles.matchTitleBar}>
          <div onClick={showVis}> Visualizer </div>
          <div onClick={showLog}> Log </div>
        </div>
        <div className={styles.displayBox}>
          <MatchDisplay viewState={viewState} matchLog={matchLog}/>
        </div>
      </div>
    );
  }

  private showVisualizer() {
    this.setState({ viewState: ViewState.VISUALIZER});
  }

  private showLog() {
    this.setState({viewState: ViewState.LOG});
  }
}

interface MatchDisplayProps {
  viewState: ViewState;
  matchLog: MatchLog;
}

const MatchDisplay: React.SFC<MatchDisplayProps> = (props) => {
  switch (props.viewState) {
    case ViewState.VISUALIZER:
      return <Visualizer matchLog={props.matchLog}/>;
    case ViewState.LOG:
      return <LogView matchLog={props.matchLog} />;
  }
};

export default MatchViewContainer;
