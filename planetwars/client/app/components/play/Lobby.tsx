import * as React from 'react';
import * as PwClient from 'mozaic-client';

import { Config } from '../../utils/Config';
import { generateToken } from '../../utils/GameRunner';
import * as M from '../../database/models';

import { WeakConfig, StrongConfig, validateConfig } from './types';
import Section from './Section';
import { ServerControls } from './ServerControls';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export interface LobbyProps {
  maps: M.MapList;
  config?: WeakConfig;
}

export type LobbyState = ConfiguringState;

export interface Slot {
  token: M.Token;
}

export interface ConfiguringState {
  type: 'configuring';
  slots: Slot[];
  config?: WeakConfig;
}

export interface RuningState {
  type: 'running';
  config: StrongConfig;
  newConfig?: WeakConfig;
}

export class Lobby extends React.Component<LobbyProps, LobbyState> {

  public state: LobbyState = { type: 'configuring', slots: Lobby.genSlots(2) };

  private server?: PwClient.MatchRunner;

  public static getDerivedStateFromProps(nextProps: LobbyProps, prevState: LobbyState): LobbyState {
    const { config, maps } = nextProps;
    console.log(nextProps);

    if (prevState.type === 'configuring') {
      const prevSlots = prevState.slots;
      if (config && config.selectedMap) {
        const mapSlots = maps[config.selectedMap].slots;
        const newSlotsRequired = Math.max(0, mapSlots - prevSlots.length);
        const slots = prevSlots
          .concat(Lobby.genSlots(newSlotsRequired))
          .slice(0, mapSlots);
        return { type: 'configuring', config, slots };
      }

      return { type: 'configuring', config, slots: Lobby.genSlots(2) };
    }
    return prevState;
  }

  private static genSlots(amount: number): Slot[] {
    return Array(amount).fill(1).map((_, index) => ({
      token: generateToken(),
    }));
  }

  public render() {
    const { slots } = this.state;
    const slotItems = slots.map((s, i) => {
      return (
        <li key={i}>{s.token}</li>
      );
    });
    return (
      <Section header={"Lobby"}>
        <div>
          <ul>{slotItems}</ul>
        </div>
        <ServerControls
          startServer={this.startServer}
          launchGame={this.launchGame}
          launchDisabled={!this.server}
        />
      </Section>
    );
  }


  private startServer = () => {
    // const ctrlToken = generateToken();
    // const conf = validateConfig(this.state.config);
    // const params: PwClient.MatchParams = {
    //   ctrl_token: ctrlToken,
    // };
    // this.server = new PwClient.MatchRunner(Config.matchRunner, params);
  }

  private launchGame = () => {
    if (!this.server) { alert('Something went wrong'); return; }
    this.server.start_match();
  }

}
