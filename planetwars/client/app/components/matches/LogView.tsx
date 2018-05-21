import * as React from 'react';
import { Component, SFC } from 'react';
import {
  MatchLog,
  GameState,
  Player,
  PwTypes,
} from '../../lib/match';

import * as classNames from 'classnames';
import { PlayerMap, PlayerTurn } from '../../lib/match/MatchLog';

// tslint:disable-next-line:no-var-requires
const styles = require("./LogView.scss");

export interface LogViewProps {
  playerName: (playerNum: number) => string;
  matchLog: MatchLog;
}

type PlayerLogs = PlayerMap<PlayerTurn>[];

function makePlayerLogs(log: MatchLog): PlayerLogs {
  const playerNums = Object.keys(log.playerLogs).map(Number);

  const turns = log.gameStates.map((state, idx) => {
    const playerTurns: PlayerMap<PlayerTurn> = {};
    playerNums.forEach((player) => {
      const turn = log.playerLogs[player].turns[idx];
      if (turn) {
        playerTurns[player] = turn;
      }
    });
    return playerTurns;
  });

  return turns;
}

export class LogView extends Component<LogViewProps> {
  public render() {
    // TODO: do this transform higher up
    const playerLogs = makePlayerLogs(this.props.matchLog);

    const entries = this.props.matchLog.gameStates.map((state, idx) => {
      const turns = playerLogs[idx];
      return (
        <li className={classNames(styles.turn)} key={idx}>
          <TurnNumView turn={idx} />
          <TurnView playerName={this.props.playerName} turns={turns} />
        </li>
      );
    });

    return (
      <div className={styles.logRootNode}>
        <ul className={styles.turns}>
          {entries}
        </ul>
      </div>);
  }
}

export default LogView;

interface TurnProps {
  playerName: (playerNum: number) => string;
  turns: PlayerMap<PlayerTurn>;
}

export const TurnView: SFC<TurnProps> = (props) => {
  const players = Object.keys(props.turns).map((_playerNum) => {
    const playerNum = Number(_playerNum);
    const playerTurn = props.turns[playerNum];
    const playerName = props.playerName(playerNum);
    return (
      <PlayerView
        key={playerNum}
        playerName={playerName}
        turn={playerTurn}
      />
    );
  });

  return (
    <ul className={styles.turnOutput}>
      {players}
    </ul>);
};

interface PlayerViewProps { playerName: string; turn: PlayerTurn; }
export const PlayerView: SFC<PlayerViewProps> = ({ playerName, turn }) => {
  const isError = turn.action && turn.action.type !== 'commands';
  return (
    <li className={classNames(styles.player, {[styles.error]: isError})}>
      <div>
        <p className={styles.playerName}>{playerName}</p>
      </div>
      <PlayerTurnView turn={turn} />
    </li>
  );
};

export const PlayerTurnView: SFC<{ turn: PlayerTurn }> = ({ turn }) => {
  const action = turn.action;

  if (!action) {
    return null;
  }

  switch (action.type) {
    case 'timeout': {
      return <Timeout/>;
    }
    case 'parse_error': {
      return <ParseErrorView command={turn.command} error={action.value} />;
    }
    case 'commands': {
      return <CommandsView commands={action.value}/>;
    }
  }
};

export const Timeout: SFC = () => {
  return (
    <div className={styles.playerOutput}>
      <span className={styles.error}> [TIMEOUT] </span>
    </div>
  );
};

export interface ParseErrorViewProps { command?: string; error: string; }
export const ParseErrorView: SFC<ParseErrorViewProps> = (props) => {
  return (
    <div className={styles.playerOutput}>
      <p>
        <span className={styles.error}> [ERROR] </span> {props.error}
      </p>
      <p>
        [OUTPUT] {props.command}
      </p>
    </div>
  );
};

export interface CommandsViewProps { commands: PwTypes.PlayerCommand[]; }
export const CommandsView: SFC<CommandsViewProps> = (props) => {
  const dispatches = props.commands.map((cmd, idx) => {
    const isWarning = { [styles.warning]: !!cmd.error };
    return (
      <li className={classNames(styles.playerOutput, isWarning)} key={idx}>
        <DispatchError error={cmd.error}/>
        <DispatchView cmd={cmd.command} />
      </li>
    );
  });
  return (
    <ul>{dispatches}</ul>
  );
};

export const DispatchError: SFC<{ error?: string }> = ({ error }) => {
  if (error) {
    return (
      <p>
        <span className={styles.warning}> [WARNING] </span> {error}
      </p>
    );
  } else {
    return null;
  }
};

export const DispatchView: SFC<{ cmd: PwTypes.Command }> = ({ cmd }) => {
  const { ship_count, origin, destination } = cmd;
  return (
    <div className={styles.dispatch}>
      <p>
        <FaIcon icon='globe' /> {origin}
      </p>
      <p>
        <FaIcon icon='globe' /> {destination}
      </p>
      <p>
        <FaIcon icon='rocket' /> {ship_count}
      </p>
    </div>
  );
};

export const FaIcon: SFC<{ icon: string }> = ({ icon }) =>
  <i className={classNames('fa', 'fa-' + icon)} aria-hidden={true} />;

export const TurnNumView: SFC<{ turn: number }> = ({ turn }) => {
  return (
    <div className={styles.turnNumber}>
      <p>
        {turn}
      </p>
    </div>
  );
};

export const GameEnd: SFC = () => {
  return (
    <div className={styles.gameEnd}>
      <p> Game end. </p>
    </div>
  );
};
