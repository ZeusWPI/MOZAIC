import * as React from 'react';
import { JsonCommand, Player, MatchLog, GameState, PlayerOutputs, PlayerOutput, Command } from '../../lib/match/log/';

import * as classNames from 'classnames';

// tslint:disable-next-line:no-var-requires
const styles = require("./LogView.scss");

interface LogViewProps {
  matchLog: MatchLog;
}

export class LogView extends React.Component<LogViewProps> {
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

export const TurnView: React.SFC<TurnProps> = (props) => {
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
export const PlayerView: React.SFC<PlayerViewProps> = ({ player, output }) => {
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

export const PlayerOutputView: React.SFC<{ output: PlayerOutput }> = ({ output }) => {
  if (output.error) { return <ErrorView output={output} />; }

  const commands = output.commands.map((com, idx) => {
    const { ship_count, origin, destination } = com.command;
    const Fat = (props: any) => <span className={styles.fat}>{props.children}</span>;
    const Warning = () => (com.error)
      ? (
        <p>
          <span className={styles.warning}> [WARNING] </span> {com.error}
        </p>)
      : null;
    const Dispatch = () => (
      <p className={styles.dispatch}>
        [DISPATCH]{' '}
        <FaIcon icon='globe' />{' '}{origin}{' '}
        <FaIcon icon='rocket' />{''}{ship_count}{' '}
        <FaIcon icon='globe' />{' '}{destination}
      </p>
    );
    const isWarning = { [styles.warning]: !!com.error };
    return (
      <li className={classNames(styles.playerOutput, isWarning)} key={idx}>
        <Warning />
        <Dispatch />
      </li>
    );
  });

  return <ul> {commands} </ul>;
};

export const FaIcon: React.SFC<{ icon: string }> = ({ icon }) =>
  <i className={classNames('fa', 'fa-' + icon)} aria-hidden={true} />;

export const ErrorView: React.SFC<{ output: PlayerOutput }> = ({ output }) => {
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

export const TurnNumView: React.SFC<{ turn: number }> = ({ turn }) => {
  return (
    <div className={styles.turnNumber}>
      <p>
        {turn}
      </p>
    </div>
  );
};

export const GameEnd: React.SFC = () => {
  return (
    <div className={styles.gameEnd}>
      <p> Game end. </p>
    </div>
  );
};
