import * as React from 'react';
import * as PwClient from 'mozaic-client';
import { Chance } from 'chance';

import { Config } from '../../utils/Config';
import { generateToken } from '../../utils/GameRunner';
import * as M from '../../database/models';

import * as Lib from './types';
// import { WeakConfig, StrongConfig, validateConfig, exportConfig, ValidationError, hasErrored } from './types';
import Section from './Section';
import { ServerControls } from './ServerControls';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export type LobbyProps = LobbyDispatchProps & {
  maps: M.MapList;
  config?: Lib.WeakConfig;
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
  config?: Lib.WeakConfig;
}
export interface RuningState {
  type: 'running';
  slots: Slot[];
  config: Lib.StrongConfig;
}

export interface Slot {
  status: 'unbound' | 'boundInternal' | 'connectedInternal' | 'external';
  token: M.Token;
  name: string;
}

export class Lobby extends React.Component<LobbyProps, LobbyState> {

  public state: LobbyState = { type: 'configuring', slots: Lobby.genSlots(2) };

  private server?: PwClient.MatchRunner;

  // This is where the magic state juggling happens
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
      status: 'unbound' as 'unbound',
      token: generateToken(),
      // name: chance.name(),
      name: new Chance().name({ prefix: true, nationality: 'it' }),
    }));
  }

  public render() {
    const { slots } = this.state;
    return (
      <Section header={"Lobby"}>
        <div className={styles.lobby}>
          <SlotList slots={slots} />
          <ServerControls
            startServer={this.startServer}
            stopServer={this.stopServer}
            launchGame={this.launchGame}
            serverRunning={!!this.server}
          />
        </div>
      </Section>
    );
  }

  private startServer = () => {
    if (this.server || this.state.type !== 'configuring') {
      alert('Something went wrong.');
      return;
    }

    const config = Lib.validateConfig(this.state.config);
    if (Lib.hasErrored(config)) {
      alert(`Config is not valid. ${config.address || config.map || config.maxTurns}`);
      return;
    }

    // TODO this is dirty, cause we have to create a matchId already
    const matchId = Config.generateMatchId();
    const ctrlToken = generateToken();
    const logFile = Config.matchLogPath(matchId);
    const params = { ctrl_token: ctrlToken, address: config.address, logFile };
    console.log('launching server with', params);

    PwClient.MatchRunner.create(Config.matchRunner, params)
      .then((server) => {
        console.log('test proc');
        const slots = this.state.slots;
        this.server = server;
        slots.forEach((slot, i) => {
          server.addPlayer(new Buffer(slot.token));
        });
        this.setState({ type: 'running', config, slots });
      })
      .catch((err) => {
        this.stopServer();
        alert('Failed to start server :( (see console))');
        console.log('Failed to start server.', err);
      });
  }

  private stopServer = () => {
    if (this.server) {
      this.server.shutdown();
      console.log('server killed');
    }
    if (this.state.type !== 'configuring') {
      const { slots, config } = this.state;
      this.setState({ type: 'configuring', slots, config: Lib.downGrade(config) });
    }
  }

  private launchGame = () => {
    if (!this.server || (this.state.type !== 'running')) {
      alert('Something went wrong');
      return;
    }

    const gameConf = Lib.exportConfig(this.state.config, this.props.maps);

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

// ----------------------------------------------------------------------------
// Slot List
// ----------------------------------------------------------------------------

export interface SlotListProps {
  slots: Slot[];

}
export class SlotList extends React.Component<SlotListProps> {
  public render() {
    const { slots } = this.props;
    const slotItems = slots.map((slot, index) => (
      <li key={index} className={styles.slotElementWrapper}>
        <SlotElement slot={slot} index={index} />
      </li>),
    );
    return (<ul className={styles.lobbySlots}>{slotItems}</ul>);
  }
}

export interface SlotElementProps { slot: Slot; index: number; }
export class SlotElement extends React.Component<SlotElementProps> {

  public render() {
    const { slot: { token, status, name }, index } = this.props;

    const clss = (color: string) => `button is-outlined ${color}`;
    const kick = (
      <button key='kick' className={clss('is-danger')}>Kick player</button>
    );
    const copy = (
      <button key='copy' className={clss('is-light')}>Copy</button>
    );
    const conn = (
      <button key='conn' className={clss('is-success')}>Connect</button>
    );

    const tools = {
      unbound: [copy],
      boundInternal: [kick, conn],
      connectedInternal: [kick],
      external: [kick],
    };

    return (
      <div className={`${styles.slotElement} ${this.statusToClass(status)}`}>
        <h1>Player {index + 1}</h1>
        <p>{token}</p>
        <p>Status: {status}</p>
        <p>Name: {name}</p>
        <div>
          {tools[status]}
        </div>
      </div >);
  }

  private statusToClass(status: string): string {
    switch (status) {
      case 'unbound': return styles.unbound;
      case 'boundInternal': return styles.filled;
      case 'connectedInternal': return styles.connected;
      case 'external': return styles.connected;
      default: return styles.typo;
    }
  }
}
