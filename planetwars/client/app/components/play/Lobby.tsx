import * as React from 'react';
import * as PwClient from 'mozaic-client';

import { Config } from '../../utils/Config';
import { generateToken } from '../../utils/GameRunner';
import * as M from '../../database/models';

import { WeakConfig, StrongConfig, validateConfig, exportConfig, ValidationError, hasErrored } from './types';
import Section from './Section';
import { ServerControls } from './ServerControls';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export type LobbyProps = LobbyDispatchProps & {
  maps: M.MapList;
  config?: WeakConfig;
};

export interface LobbyDispatchProps {
  saveMatch(): void;
  signalMatchComplete(): void;
  signalMatchErrored(err: Error): void;
  signalPlayerReconnectedDuringMatch(id: number): void;
  signalPlayerDisconnectDuringMatch(id: number): void;
}

export type LobbyState = ConfiguringState | RuningState;
export interface ConfiguringState {
  type: 'configuring';
  slots: Slot[];
  config?: WeakConfig;
}
export interface RuningState {
  type: 'running';
  slots: Slot[];
  config: StrongConfig;
}

export interface Slot {
  token: M.Token;
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
    const slotItems = slots.map((slot, index) => (
      <li key={index}>
        <SlotElement slot={slot} index={index} />
      </li>),
    );
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
    if (this.server || this.state.type !== 'configuring') {
      alert('Something went wrong.');
      return;
    }

    const config = validateConfig(this.state.config);
    if (hasErrored(config)) {
      alert(`Config is not valid. ${config.address || config.map || config.maxTurns}`);
      return;
    }

    // TODO this is dirty, cause we have to create a matchId already
    const matchId = Config.generateMatchId();
    const ctrlToken = generateToken();
    const logFile = Config.matchLogPath(matchId);
    const params = { ctrl_token: ctrlToken, address: config.address, logFile };
    this.server = new PwClient.MatchRunner(Config.matchRunner, params);
    // TODO: Add players
    this.setState({ type: 'running', config, slots: this.state.slots });
  }

  private launchGame = () => {
    if (!this.server || (this.state.type !== 'running')) {
      alert('Something went wrong');
      return;
    }

    const gameConf = exportConfig(this.state.config, this.props.maps);

    // Clear old listeners from the lobby
    this.server.onConnect.clear();
    this.server.onPlayerConnected.clear();
    this.server.onPlayerDisconnected.clear();

    // Bind completion listeners
    this.server.onComplete.subscribe(() => this.props.signalMatchComplete());
    this.server.onError.subscribe((err) => this.props.signalMatchErrored(err));

    // Bind connection listeners
    this.server.onPlayerDisconnected.subscribe(
      (id: number) => this.props.signalPlayerDisconnectDuringMatch(id));
    this.server.onPlayerConnected.subscribe(
      (id: number) => this.props.signalPlayerReconnectedDuringMatch(id));

    // Start game
    this.server.startGame(gameConf)
      // This gets procced when the game has actually started
      .then(() => {
        this.props.saveMatch();
        this.resetState();
      })
      .catch((err) => {
        alert('Failed to start match. See console for info.');
        console.log(err);
      });
  }

  private resetState() {
    throw new Error('Unimplemented');
  }

}

export interface SlotElementProps { slot: Slot; index: number; }
export class SlotElement extends React.Component<SlotElementProps> {
  public render() {
    const { slot: { token }, index } = this.props;
    return (
      <div>
        <p>Player {index + 1}</p>
        <p>{token}</p>
      </div>);
  }
}
