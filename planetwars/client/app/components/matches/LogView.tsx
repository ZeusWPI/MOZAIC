import * as React from 'react';
import { Component, SFC } from 'react';
import {
  JsonCommand,
  Player,
  MatchLog,
  GameState,
  PlayerOutputs,
  PlayerOutput,
  Command,
} from '../../lib/match/log/';

import * as classNames from 'classnames';

// tslint:disable-next-line:no-var-requires
const styles = require("./LogView.scss");

interface LogViewProps {
  matchLog: MatchLog;
}

export class LogView extends Component<LogViewProps> {
  public render() {
    const { matchLog: { playerOutputs, players } } = this.props;

    const entries = playerOutputs.map((output, idx) => {

      // TODO Can we do this?
      if (!output) { return null; }

      return (
        <li className={classNames(styles.turn)} key={idx}>
          <TurnNumView turn={idx} />
          <TurnView players={players} outputs={output} />
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
  players: Player[];
  outputs: PlayerOutputs;
}

export const TurnView: SFC<TurnProps> = (props) => {
  // The last turn has no outputs for the players
  if (Object.keys(props.outputs).length === 0) {
    return <GameEnd />;
  }
  const players = props.players.map((player, idx) => {
    const playerOutput = props.outputs[player.uuid];
    return <PlayerView key={idx} player={player} output={playerOutput} />;
  });

  return (
    <ul className={styles.turnOutput}>
      {players}
    </ul>);
};

interface PlayerViewProps { player: Player; output: PlayerOutput; }
export const PlayerView: SFC<PlayerViewProps> = ({ player, output }) => {
  const isError = { [styles.error]: !!output.error };
  return (
    <li className={classNames(styles.player, isError)} key={player.uuid}>
      <div>
        <p className={styles.playerName}>{player.name}</p>
      </div>
      <PlayerOutputView output={output} />
    </li>
  );
};

export const PlayerOutputView: SFC<{ output: PlayerOutput }> = ({ output }) => {
  if (output.error) { return <ErrorView output={output} />; }

  const commands = output.commands.map((cmd, idx) => {

    const Fat = (props: any) => <span className={styles.fat}>{props.children}</span>;
    const Warning = () => (cmd.error)
      ? (
        <p>
          <span className={styles.warning}> [WARNING] </span> {cmd.error}
        </p>)
      : null;
    const isWarning = { [styles.warning]: !!cmd.error };
    return (
      <li className={classNames(styles.playerOutput, isWarning)} key={idx}>
        <Warning />
        <DispatchView cmd={cmd.command} />
      </li>
    );
  });

  return <ul> {commands} </ul>;
};

export const DispatchView: SFC<{ cmd: JsonCommand }> = ({ cmd }) => {
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

export const ErrorView: SFC<{ output: PlayerOutput }> = ({ output }) => {
  return (
    <div className={styles.playerOutput}>
      <p>
        <span className={styles.error}> [ERROR] </span> {output.error}
      </p>
      <p>
        [OUTPUT] {output.raw}
      </p>
    </div>
  );
};

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
