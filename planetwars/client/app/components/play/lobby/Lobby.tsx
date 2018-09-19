// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');
import * as React from 'react';
import * as PwClient from 'mozaic-client';

import { Config } from '../../../utils/Config';
import { generateToken } from '../../../utils/GameRunner';
import * as M from '../../../database/models';
import * as crypto from 'crypto';

import * as Lib from '../types';
import Section from '../Section';
import { SlotList } from './SlotList';
import { ServerControls } from './ServerControls';
import { LobbyState } from '../../../reducers/lobby';

// tslint:disable-next-line:no-var-requires
const styles = require('./Lobby.scss');

export type LobbyProps = {
  maps: M.MapList;
  state: LobbyState;
  slots: Lib.Slot[];
  serverRunning: boolean;

  startServer: () => void;
  stopServer: () => void;
  runLocalBot: (slot: Lib.Slot) => void;
  launchGame: () => void;
};

const alertTODO = () => { alert('TODO'); };

export class Lobby extends React.Component<LobbyProps> {
  constructor(props: LobbyProps) {
    super(props);
  }

  public render() {
    const { state, slots } = this.props;
    return (
      <Section header={"Lobby"}>
        <div className={styles.lobby}>
          <SlotList
            slots={slots}
            address={state.address}
            connectLocalBot={this.props.runLocalBot}
            removeBot={alertTODO}
          />
          <ServerControls
            startServer={this.props.startServer}
            stopServer={this.props.stopServer}
            launchGame={this.props.launchGame}
            serverRunning={this.props.serverRunning}
          />
        </div>
      </Section>
    );
  }
}
