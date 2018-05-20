import * as React from 'react';

import Section from './Section';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export interface ServerControlProps {
  launchDisabled: boolean;
  startServer(): void;
  launchGame(): void;
}

export class ServerControls extends React.Component<ServerControlProps> {
  public render() {
    const { launchDisabled, startServer, launchGame } = this.props;
    return (
      <div className={styles.serverControls}>
        <button
          className={styles.controlButton + ' button is-outlined is-primary is-large'}
          onClick={startServer}
        >
          Start server
        </button>

        <button
          className={styles.controlButton + ' button is-outlined is-primary is-large'}
          onClick={launchGame}
          disabled={launchDisabled}
        >
          Launch game
        </button>
      </div>
    );
  }
}
