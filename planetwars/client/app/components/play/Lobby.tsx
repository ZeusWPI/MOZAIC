import * as React from 'react';
import * as PwClient from 'mozaic-client';

import * as M from '../../database/models';
import Section from './Section';
import { WeakConfig } from './Config';
import { ServerControls } from './ServerControls';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export interface LobbyProps {
  config?: WeakConfig;
}

export class Lobby extends React.Component {

  private server?: PwClient.MatchRunner;

  constructor(props: LobbyProps) {
    super(props);
  }

  public render() {
    return (
      <Section header={"Lobby"}>
        <ServerControls
          startServer={this.startServer}
          launchGame={this.launchGame}
        />
      </Section>
    );
  }

  private startServer = () => { };
  private launchGame = () => { };
}
