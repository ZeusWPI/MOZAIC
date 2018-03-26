import * as React from 'react';
import { JsonCommand, Player, MatchLog, GameState, PlayerInputs, PlayerInput, Command } from '../../lib/match/log/';

// tslint:disable-next-line:no-var-requires
const styles = require("./LogView.scss");
var classNames = require('classnames');


interface LogViewProps {
  matchLog: MatchLog;
}

export class LogView extends React.Component<LogViewProps> {
  public render() {
    const { matchLog } = this.props;
    let turn = -1;
    const entries = matchLog.playerInputs.map((playerInput, idx) => {
      if (!playerInput) {
        return null;
      }
      turn += 1;
      return (
        <div key={idx}>
          <hr/>
          <div className={styles.turns}>
            <TurnNumView turnNum={turn} />
            <TurnView players={matchLog.players} inputs={playerInput} />
          </div>
        </div>
      );
    });

    return <div className={styles.logRootNode}>{entries}</div>;
  }
}

export default LogView;

interface TurnProps {
  players: Player[];
  inputs: PlayerInputs;
}

const TurnView: React.SFC<TurnProps> = (props) => {
  const turns = props.players.map((player, idx) => {
    const playerInput = props.inputs[player.uuid];
    if (!playerInput) {
      return null;
    }
    return (
      <div className={styles.turn} key={idx}>
        <div className={styles.header}>
          <div>{player.name}</div>
          <div className={styles.error}>{playerInput.error} &nbsp;</div>
        </div>
        <PlayerTurnView input={playerInput} />
      </div>
    );
  });

  return <div> {turns} </div>;
};


interface PlayerTurnProps {
  input: PlayerInput;
}

const PlayerTurnView: React.SFC<PlayerTurnProps> = (props) => {
  const { input } = props;

  if (input.error) {
    return <div className={styles.tab}> Raw input:&nbsp;{input.raw} </div>;
  }

  const commands = input.commands.map((com, idx) => {
    const command = com.command;
    return (
      <div className={styles.command} key={idx}>
        <StatusView error={com.error} />
        <CommandView command={com.command} />
      </div>
    );
  });

  return <div> {commands} </div>;
};

interface StatusProps {
  error?: string;
}

const StatusView: React.SFC<StatusProps> = (props) => {
  const {error} = props;
  if (error) {
    return <div className={classNames(styles.error, styles.tab)}>{error + " "}&nbsp; </div>;
  } else {
    return <div className={styles.tab}>Dispatched:&nbsp; </div>
  }
};

interface CommandProps {
  command: JsonCommand;
}

const CommandView: React.SFC<CommandProps> = (props) => {
  const {command} = props;
  return  <div>{command.ship_count} from {command.origin} to {command.destination}</div>;
};

interface TurnNumProps {
  turnNum: number;
}

const TurnNumView: React.SFC<TurnNumProps> = (props) => {
  return (
      <div className={styles.turnNum}> Turn: {props.turnNum} </div>
  );
};