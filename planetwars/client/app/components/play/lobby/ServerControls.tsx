import * as React from 'react';

import * as css from './Lobby.scss';

export interface ServerControlProps {
  serverRunning: boolean;
  startServer(): void;
  stopServer(): void;
  launchGame(): void;
}

export class ServerControls extends React.Component<ServerControlProps> {
  public render() {
    const { serverRunning, startServer, launchGame, stopServer } = this.props;
    return (
      <div className={css.serverControls}>
        <button
          className={css.controlButton + ' button is-outlined is-primary is-large'}
          onClick={(serverRunning) ? stopServer : startServer}
        >
          {(serverRunning) ? 'Stop server' : 'Start server'}
        </button>

        <button
          className={css.controlButton + ' button is-outlined is-primary is-large'}
          onClick={launchGame}
          disabled={!serverRunning}
        >
          Launch game
        </button>
      </div>
    );
  }
}
