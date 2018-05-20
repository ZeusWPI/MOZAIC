import * as React from 'react';

import Visualizer from '../visualizer/Visualizer';
import * as Comp from './types';
import { emptyLog, parseLogFile, MatchLog } from '../../lib/match';
import { LogView } from './LogView';
import * as M from '../../database/models';
import { Log } from '../../reducers/logs';

// tslint:disable-next-line:no-var-requires
const styles = require('./Matches.scss');

export interface ContainerProps {
  match?: Comp.Match;
}

export interface MatchViewState {
  error?: {
    error: any;
    info: any;
  };
}

export class MatchView extends React.Component<ContainerProps, MatchViewState> {
  private matchLog?: MatchLog;
  // how many log records were already consumed
  private logPos = 0;

  public constructor(props: ContainerProps) {
    super(props);
    this.state = {};
  }

  public componentWillReceiveProps(nextProps: ContainerProps) {
    const currentMatch = this.props.match;
    const nextMatch = nextProps.match;

    if (!nextMatch) {
      this.matchLog = undefined;
      return;
    }

    // read the log file from disk for finished matches
    if (nextMatch.status === M.MatchStatus.finished) {
      this.matchLog = parseLogFile(nextMatch.logPath, nextMatch.type);
      return;
    }

    // for other matches, get the log from the redux store
    if (!currentMatch || currentMatch.uuid !== nextMatch.uuid) {
      // create a new match log
      this.matchLog = emptyLog(nextMatch.type);
      this.logPos = 0;
    }

    const log = nextMatch.log;
    if (log) {
      // add new entries
      log.slice(this.logPos).forEach((entry) => {
        this.matchLog!.addEntry(entry!);
      });
      this.logPos = log.size;
    }
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

    if (match.status === M.MatchStatus.error) {
      return (
        <div className={styles.matchViewContainer}>
          <div className={styles.matchError}>
            {match.error}
          </div>
        </div>
      );
    }

    const matchLog = this.matchLog;

    if (!matchLog || matchLog.gameStates.length === 0) {
      return (
        <div className={styles.matchViewContainer}>
          <div className={styles.matchInProgress}>
            match in progress
          </div>
        </div>
      );
    }

    // render the match log
    return (
      <div className={styles.matchViewContainer}>
        <MatchViewer match={match} matchLog={matchLog} />
      </div>
    );
  }
}

interface Props {
  match: Comp.Match;
  matchLog: MatchLog;
}

enum ViewState {
  VISUALIZER,
  LOG,
}

interface State {
  viewState: ViewState;
}

export class MatchViewer extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.playerName = this.playerName.bind(this);
    this.state = {
      viewState: ViewState.VISUALIZER,
    };
  }

  public render() {
    const { matchLog } = this.props;
    const { viewState } = this.state;

    const showVisualizer = () => {
      this.setState({ viewState: ViewState.VISUALIZER });
    };

    const showVis = () => this.showVisualizer();
    const showLog = () => this.showLog();

    return (
      <div className={styles.matchView}>
        <div className={styles.matchTitleBar}>
          <div onClick={showVis} className={styles.matchTitleBarElement}> Visualizer </div>
          <div onClick={showLog} className={styles.matchTitleBarElement}> Log </div>
        </div>
        <div className={styles.displayBox}>
          <MatchDisplay
            viewState={viewState}
            matchLog={matchLog}
            playerName={this.playerName()}
          />
        </div>
      </div>
    );
  }

  public playerName() {
    const playerNames: { [playerNum: number]: string } = {};
    this.props.match.players.forEach((player) => {
      playerNames[player.number] = player.name;
    });

    return (playerNum: number) => {
      if (playerNames[playerNum]) {
        return playerNames[playerNum];
      } else {
        return `Player ${playerNum}`;
      }
    };
  }

  private showVisualizer() {
    this.setState({ viewState: ViewState.VISUALIZER });
  }

  private showLog() {
    this.setState({ viewState: ViewState.LOG });
  }
}

interface MatchDisplayProps {
  viewState: ViewState;
  matchLog: MatchLog;
  playerName: (playerNum: number) => string;
}

const MatchDisplay: React.SFC<MatchDisplayProps> = (props) => {
  const { viewState, matchLog, playerName } = props;
  switch (viewState) {
    case ViewState.VISUALIZER:
      return <Visualizer playerName={playerName} matchLog={matchLog} />;
    case ViewState.LOG:
      return <LogView playerName={playerName} matchLog={matchLog} />;
  }
};

export default MatchView;
