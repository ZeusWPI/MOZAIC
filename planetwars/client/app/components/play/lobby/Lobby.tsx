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
  // removeLocalBot(index: number): void;
};

export interface LobbyDispatchProps {
  saveMatch: (match: M.Match) => void;
  onMatchComplete(): void;
  onMatchErrored(err: Error): void;
  onPlayerReconnectedDuringMatch(id: number): void;
  onPlayerDisconnectDuringMatch(id: number): void;
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
  private slotManager: SlotManager;
  private server?: PwClient.MatchRunner;

  private localClients: { [key: string /*Token*/]: PwClient.Client } = {};

  constructor(props: LobbyProps) {
    super(props);
    this.state = { type: 'configuring', slots: [] };
    this.slotManager = new SlotManager();
    this.willBeKicked = this.willBeKicked.bind(this);
  }

  public componentWillReceiveProps(nextProps: LobbyProps) {
    this.updateSlots(nextProps);
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
            willBeKicked={this.willBeKicked}
            connectLocalBot={this.connectLocalBot}
            unbindLocalBot={this.unbindLocalBot}
            removeLocalBot={this.removeLocalBot}
            removeExternalBot={this.removeExternalBot}
            isServerRunning={this.state.type === 'running'}
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

  public addLocalBot(bot: M.Bot) {
    this.slotManager.bindLocalBot(bot);
    this.setState({ slots: [...this.slotManager.slots] });
  }

  private willBeKicked(index: number): boolean {
    const { maps, config } = this.props;
    if (config && config.mapId) {
      return index >= maps[config.mapId].slots;
    } else {
      return false;
    }
  }

  private updateSlots(props: LobbyProps) {
    const { config, maps } = props;
    if (!config || !config.mapId) { return; }

    console.log('update');

    const map = maps[config.mapId];
    this.slotManager.update(map);
    this.setState({ slots: [...this.slotManager.slots] });
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
        const _slots = this.slotManager.disconnectLocal(playerNum);
        this.setState({ slots: _slots });
      });
      client.onExit.subscribe(() => {
        console.log('client ext (todo)');
        const _slots = this.slotManager.disconnectLocal(playerNum);
        this.setState({ slots: _slots });
      });
      client.run();
      this.localClients[stringToken] = client;
      const slots = this.slotManager.connectLocal(playerNum, clientId);
      this.setState({ slots });
      console.log('connected local bot');
    });

  }

  private removeLocalBot = (token: M.Token, playerNum: number, clientId: number) => {
    if (!this.validifyRunning(this.state)) { return; }
    if (this.server) {
      delete this.localClients[token];
      this.server.removePlayer(clientId);
      this.slotManager.disconnectClient(clientId);

      const slots = this.slotManager.removeBot(playerNum);
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
      this.slotManager.disconnectClient(clientId);
      const slots = this.slotManager.removeBot(playerNum);
      // TOD: HLEP
    }
  }

  private unbindLocalBot = (token: M.Token, playerNum: number) => {
    const slots = this.slotManager.removeBot(playerNum);
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

    console.log(this.state.config);
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
        this.server.onPlayerConnected.subscribe((clientId) => {
          this.slotManager.connectClient(clientId);
        });
        this.server.onPlayerDisconnected.subscribe((clientId) => {
          this.slotManager.connectClient(clientId);
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
    this.server.onComplete.subscribe(() => this.props.onMatchComplete());
    this.server.onError.subscribe((err) => this.props.onMatchErrored(err));

    // Bind connection listeners
    this.server.onPlayerDisconnected.subscribe(
      (id: number) => this.props.onPlayerDisconnectDuringMatch(id));
    this.server.onPlayerConnected.subscribe(
      (id: number) => this.props.onPlayerReconnectedDuringMatch(id));

    // Start game
    this.server.startGame(gameConf)
      // This gets procced when the game has actually started
      .then(() => {
        const { host, port, maxTurns, mapId } = this.props.config!;
        if (!this.validifyRunning(this.state)) { return; }
        const match: M.PlayingHostedMatch = {
          uuid: this.state.matchId,
          type: M.MatchType.hosted,
          status: M.MatchStatus.playing,
          maxTurns,
          map: mapId!,
          network: { host, port },
          timestamp: new Date(),
          logPath: this.state.logFile,
          players: this.state.slots.map((slot) => {
            if (slot.status === 'boundInternal' || slot.status === 'connectedInternal') {
              const botSlot: M.InternalBotSlot = {
                type: M.BotSlotType.internal,
                token: slot.token,
                botId: slot.bot.uuid,
                name: slot.name,
                connected: slot.status === 'connectedInternal',
              };
              return botSlot;
            } else {
              const botSlot: M.ExternalBotSlot = {
                type: M.BotSlotType.external,
                token: slot.token,
                name: slot.name,
                connected: slot.status === 'external',
              };
              return botSlot;
            }
          }),
        };
        this.props.saveMatch(match);
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
    // reset state
    this.server = undefined;
    this.slotManager = new SlotManager();
    this.updateSlots(this.props);

    // reset to configuring
    const config = this.props.config;
    this.setState({ type: 'configuring', config: this.props.config });
  }
}
