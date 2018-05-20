import * as React from 'react';

import Section from './Section';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export interface ServerControlProps {
  startServer(): void;
  launchGame(): void;
}

export class ServerControls extends React.Component<ServerControlProps> {
  public render() {
    return (
      <div className={styles.serverControls}>
        <div className={styles.controlButton} onClick={this.props.startServer}>
          <span>Start server</span>
        </div>
        <div className={styles.controlButton} onClick={this.props.launchGame}>
          <span>Launch game</span>
        </div>
      </div>
    );
  }
}
