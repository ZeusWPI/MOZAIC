import * as React from 'react';
import { MatchLog } from '../../lib/match/log/';

// tslint:disable-next-line:no-var-requires
const styles = require("./LogView.scss");

interface LogViewProps {
  matchLog: MatchLog;
}

export class LogView extends React.Component<LogViewProps> {
  public render() {
    const { matchLog } = this.props;
    const entries = matchLog.playerInputs.map((playerInput, idx) => {
      const subentries = matchLog.players.map((player) => {
        const input = playerInput[player.uuid];
        if (input) {
          return (
            <div key={player.uuid}>
              {player.name}
              {input.raw}
            </div>
          );
        } else {
          return null;
        }
      });

      return (
        <div key={idx}>
          <div> {idx} </div>
          {subentries}
        </div>
      );
    });
    return (
      <div>
        {entries}
      </div>
    );
  }
}

export default LogView;
