// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');
import * as React from 'react';
import * as PwClient from 'mozaic-client';

import { Config } from '../../../utils/Config';
import { generateToken } from '../../../utils/GameRunner';
import * as M from '../../../database/models';

import * as Lib from '../types';
import Section from '../Section';
import { SlotList } from './SlotList';
import { ServerControls } from './ServerControls';
import { SlotManager, Slot, BoundInternalSlot } from './SlotManager';

// tslint:disable-next-line:no-var-requires
const styles = require('./Lobby.scss');

export type LobbyProps = LobbyDispatchProps & {
  maps: M.MapList;
  config?: Lib.WeakConfig;
  localBots: M.Bot[];
  removeLocalBot(index: number): void;
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

export class Lobby extends React.Component<LobbyProps, LobbyState> {

  private static slotManager: SlotManager = new SlotManager();

  public state: LobbyState = { type: 'configuring', slots: [] };

  private server?: PwClient.MatchRunner;
  private localClients: { [key: string /*Token*/]: PwClient.Client } = {};

  // This is where the magic state juggling happens
  public static getDerivedStateFromProps(nextProps: LobbyProps, prevState: LobbyState): LobbyState {
    const { config, localBots, maps } = nextProps;
    Lobby.slotManager.maps = maps;

    if (prevState.type === 'configuring') {
      const newSlots = Lobby.slotManager.update(localBots, config);
      const slots = [...newSlots];
      return { type: 'configuring', config, slots };
    }

    if (prevState.type === 'running') {
      const vConfig = Lib.validateConfig(nextProps.config);
      if (vConfig.type === 'error') {
        const { msg, address, map, maxTurns } = vConfig;
        // alert(`Config is not valid. ${msg || address || map || maxTurns}`);
        return { ...prevState };
      }
      const newSlots = Lobby.slotManager.updateRunning(localBots, vConfig);
      const slots = [...newSlots];
      return { type: 'running', slots, config: vConfig };
    }

    alert('Programmer did an oopsie');
    return prevState;
  }

  public componentWillUnmount() {
    console.log('play page did unmount');
    this.killServer();
  }

  public componentDidCatch(error: Error) {
    console.log('component did catch', error);
    this.killServer();
  }

  public render() {
    const { slots, config } = this.state;
    const { port, host } = Lib.getWeakAddress(config);
    return (
      <Section header={"Lobby"}>
        <div className={styles.lobby}>
          <SlotList
            slots={slots}
            port={port}
            host={host}
            connectLocalBot={this.connectLocalBot}
            unbindLocalBot={this.unbindLocalBot}
            removeLocalBot={this.removeLocalBot}
            removeExternalBot={this.removeExternalBot}
          />
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

  private connectLocalBot = (slot: BoundInternalSlot, playerNum: number) => {
    if (!this.validifyRunning(this.state)) { return; }
    if (!this.server) { return; }

    const { config: { address } } = this.state;
    const { bot, token: stringToken } = slot;
    const { name, command: fullCommand } = bot;

    const [command, ...args] = stringArgv(bot.command);
    const number = playerNum;
    const botConfig = { name, command, args };
    const logger = new PwClient.Logger('sdf');
    const token = new Buffer(stringToken);

    this.server.addPlayer(token).then((clientId) => {
      const params = { token, address, number, botConfig, logger };
      const client = new PwClient.Client(params);
      client.onError.subscribe((err) => {
        console.log('client error (todo)');
        const _slots = Lobby.slotManager.disconnectLocal(playerNum);
        this.setState({ slots: _slots });
      });
      client.onExit.subscribe(() => {
        console.log('client ext (todo)');
        const _slots = Lobby.slotManager.disconnectLocal(playerNum);
        this.setState({ slots: _slots });
      });
      client.run();
      this.localClients[stringToken] = client;
      const slots = Lobby.slotManager.connectLocal(playerNum, clientId);
      this.setState({ slots });
      console.log('connected local bot');
    });

  }

  private removeLocalBot = (token: M.Token, playerNum: number, clientId: number, localBotIndex: number) => {
    if (!this.validifyRunning(this.state)) { return; }
    if (this.server) {
      delete this.localClients[token];
      this.props.removeLocalBot(localBotIndex);
      this.server.removePlayer(clientId);

      const slots = Lobby.slotManager.removeBot(playerNum);
      this.setState({ slots });
      this.server.removePlayer(clientId);
      console.log('kicked connected bot');
      return;
    }
  }

  private removeExternalBot = (token: M.Token, playerNum: number, clientId: number) => {
    if (!this.validifyRunning(this.state)) { return; }
    if (this.server) {
      this.server.removePlayer(clientId);
      const slots = Lobby.slotManager.removeBot(playerNum);
    }
  }

  private unbindLocalBot = (token: M.Token, playerNum: number, localBotIndex: number) => {
    this.props.removeLocalBot(localBotIndex);
    const slots = Lobby.slotManager.removeBot(playerNum);
    this.setState({ slots });
  }

  private validifyRunning(s: LobbyState): s is RuningState {
    if (!this.server || this.state.type !== 'running') {
      alert('Something went wrong (state is wrong or server is missing).');
      return false;
    }
    return true;
  }

  private validifyConfiguring(s: LobbyState): s is ConfiguringState {
    if (this.server || this.state.type !== 'configuring') {
      alert('Something went wrong (state is wrong or server is already running).');
      return false;
    }
    return true;
  }

  private startServer = () => {
    if (!this.validifyConfiguring(this.state)) { return; }

    const config = Lib.validateConfig(this.state.config);
    if (config.type === 'error') {
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
        this.setState({ type: 'running', config, slots });
      })
      .catch((err) => {
        this.stopServer();
        alert('Failed to start server :( (see console))');
        console.log('Failed to start server.', err);
      });
  }

  private stopServer = () => {
    this.killServer();
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

  private killServer() {
    if (this.server) {
      this.server.shutdown();
      this.server = undefined;
      console.log('server killed');
    }
  }

  private resetState() {
    throw new Error('Unimplemented');
  }
}
