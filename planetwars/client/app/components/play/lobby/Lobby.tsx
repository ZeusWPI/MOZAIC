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
import { SlotManager, Slot } from './SlotManager';
import { createWriteStream } from 'fs';

// tslint:disable-next-line:no-var-requires
const styles = require('./Lobby.scss');

export type LobbyProps = LobbyDispatchProps & {
  maps: M.MapList;
  config?: Lib.WeakConfig;
  // removeLocalBot(index: number): void;
};

export interface LobbyDispatchProps {
  saveMatch: (match: M.Match) => void;
  sendNotification: (title: string, message: string, type: M.NotificationType) => void;
  onMatchComplete(matchId: M.MatchId): void;
  onMatchErrored(matchId: M.MatchId, err: Error): void;
  onPlayerReconnectedDuringMatch(id: number): void;
  onPlayerDisconnectDuringMatch(id: number): void;
}

export type LobbyState = ConfiguringState | RunningState;

export interface ConfiguringState {
  type: 'configuring';
  slots: Slot[];
}

export interface RunningState {
  type: 'running';
  slots: Slot[];
  config: Lib.StrongConfig;
  matchId: M.MatchId;
  logFile: string;
}

export class Lobby extends React.Component<LobbyProps, LobbyState> {
  private slotManager: SlotManager;
  private server?: PwClient.ServerRunner;
  private match: PwClient.PwMatch;

  constructor(props: LobbyProps) {
    super(props);
    this.state = { type: 'configuring', slots: [] };
    this.slotManager = new SlotManager(this.syncSlots);
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
    const config = this.props.config;
    const slots = this.state.slots;
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
            removeBot={this.removeBot}
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
  }

  private willBeKicked(index: number): boolean {
    const { maps, config } = this.props;
    if (config && config.mapId) {
      return index >= maps[config.mapId].slots;
    } else {
      return false;
    }
  }

  private syncSlots = (slotManager: SlotManager) => {
    this.setState({ slots: slotManager.getSlots() });
  };

  private updateSlots(props: LobbyProps) {
    const { config, maps } = props;
    if (!config || !config.mapId) { return; }

    const map = maps[config.mapId];
    this.slotManager.update(map);
  }

  private connectLocalBot = (slot: Slot, playerNum: number) => {
    if (!this.validifyRunning(this.state)) { console.log("invalid state"); return; }
    if (!this.server) { console.log("server isn't running"); return; }
    if (!slot.bot || !slot.clientId) { console.log("invalid slot"); return; }
    console.log("connecting...");

    // callbacks should be set on the current slotmanager,
    // not the one belonging to 'this'. (It changes when a match is launched).
    const slotManager = this.slotManager;

    const { config } = this.state;
    const { bot, token: stringToken, clientId } = slot;

    const { name, command: fullCommand } = bot;
    const [command, ...args] = stringArgv(bot.command);
    const botConfig = { name , command, args };

    const client = new PwClient.PwClient({
      host: config.address.host,
      port: config.address.port,
      token: Buffer.from(stringToken, 'hex'),
      botConfig: {
        command: botConfig.command,
        args: botConfig.args,
      },
      logSink: createWriteStream(this.state.logFile),
      clientId,
    });
    client.run();
    console.log('connected local bot');
  }

  private removeBot = (num: number) => this.slotManager.removeBot(num);

  private removeExternalBot = (token: M.Token, playerNum: number, clientId: number) => {
    if (!this.validifyRunning(this.state)) { return; }
    if (this.server && this.match) {
      this.match.send(PwClient.events.RemoveClient.create({clientId}));
      this.slotManager.disconnectClient(clientId);
      this.slotManager.removeBot(playerNum);
    }
  }

  private unbindLocalBot = (token: M.Token, playerNum: number) => {
    this.slotManager.removeBot(playerNum);
  }

  private validifyRunning(s: LobbyState): s is RunningState {
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

    const config = Lib.validateConfig(this.props.config);
    if (config.type === 'error') {
      alert(`Config is not valid. ${config.address || config.map || config.maxTurns}`);
      return;
    }

    // TODO this is dirty, cause we have to create a matchId already
    const matchId = Config.generateMatchId();
    const ctrlToken = generateToken();
    const serverToken = crypto.randomBytes(16).toString("hex");
    const logFile = Config.matchLogPath(matchId);
    const serverParams: PwClient.ServerParams = { ctrl_token: serverToken, address: config.address, logFile };
    console.log('launching server with', serverParams);

    // callbacks should be set on the current slotmanager,
    // not the one belonging to 'this'. (It changes when a match is launched).
    const slotManager = this.slotManager;
    const slots = this.state.slots;

    // Start the server
    this.server = new PwClient.ServerRunner(Config.matchRunner, serverParams);
    this.server.runServer();

    const newState: RunningState = {
      type: 'running',
      config,
      slots,
      matchId,
      logFile,
    };
    this.setState(newState);

    const clientParams = {
      host: config.address.host,
      port: config.address.port,
      token: Buffer.from(ctrlToken, 'hex'),
    };

    // Create the control client
    const emitter = new PwClient.SimpleEventEmitter();
    const controlClient = new PwClient.Client({
      token: serverToken,
      ...clientParams,
    }, emitter);

    emitter.on(PwClient.events.Connected).subscribe((_) => {
      console.log("Creating match");
      controlClient.send(PwClient.events.CreateMatch.create({
        matchUuid: Buffer.from(matchId, "hex"),
        controlToken: Buffer.from(ctrlToken, "hex"),
      }));
    });

    emitter.on(PwClient.events.MatchCreated).subscribe((e) => {
      console.log("Created Match", e);
      if (e.matchUuid.toString() === matchId) {
        const logStream = createWriteStream(logFile);

        try {
          this.match = new PwClient.PwMatch(clientParams, new PwClient.Logger(0, logStream));

          this.match.on(PwClient.events.GameFinished).subscribe(() => {
            this.props.sendNotification(
              "Match ended",
              `A match on map '${
                this.state.type === "configuring" ?
                "unknown" :
                this.props.maps[this.state.config.mapId]
              }' has ended`,
              "Finished",
            );
          });

          this.match.on(PwClient.events.Connected).subscribe(() => {
            console.log("Match connected")
            this.slotManager.setMatch(this.match);
          });

          this.match.connect();
        } catch (err) {
          this.stopServer();
          alert(`Could not start game server: \n ${err}`);
          console.error('Failed to start server.', err);
        }
      }
      controlClient.exit();
    });
    controlClient.connect();
  }

  private stopServer = () => {
    this.killServer();
    if (this.state.type !== 'configuring') {
      const { slots, config } = this.state;
      this.setState({ type: 'configuring', slots, config: Lib.downGrade(config) });
    }
  }

  private launchGame = () => {
    if (!this.match || !this.server || !this.validifyRunning(this.state)) {
      alert('Something went wrong');
      return;
    }

    const matchId = this.state.matchId;
    const gameConf = Lib.exportConfig(this.state.config, this.props.maps);

    // Clear old listeners from the lobby
    this.match.on(PwClient.events.ClientConnected).clear();
    this.match.on(PwClient.events.ClientDisconnected).clear();

    // Bind completion listeners
    this.server.onExit.subscribe(() => {
      this.props.onMatchComplete(matchId);
    });
    this.server.onError.subscribe((err) => {
      this.props.onMatchErrored(matchId, err);
    });

    // Bind connection listeners
    this.match.on(PwClient.events.ClientDisconnected).subscribe(
      (event) => this.props.onPlayerDisconnectDuringMatch(event.clientId));
    this.match.on(PwClient.events.ClientConnected).subscribe(
      (event) => this.props.onPlayerReconnectedDuringMatch(event.clientId));

    // Start game
    const matchConfig = {
      mapPath: gameConf.map_file,
      maxTurns: gameConf.max_turns,
    }
    this.match.send(PwClient.events.StartGame.create(matchConfig));
    try {
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
          if (slot.bot) {
            const botSlot: M.InternalBotSlot = {
              type: M.BotSlotType.internal,
              token: slot.token,
              botId: slot.bot.uuid,
              name: slot.name,
              connected: slot.connected,
              clientid: slot.clientId || 0,
            };
            return botSlot;
          } else {
            const botSlot: M.ExternalBotSlot = {
              type: M.BotSlotType.external,
              token: slot.token,
              name: slot.name,
              connected: slot.connected,
              clientid: slot.clientId || 0,
            };
            return botSlot;
          }
        }),
      };
      this.props.saveMatch(match);
      this.resetState();
    } catch(err) {
      alert('Failed to start match. See console for info.');
      console.log(err);
    }
  }

  private killServer() {
    if (this.server) {
      this.server.killServer();
      this.server = undefined;
      console.log('server killed');
    }
  }

  private resetState() {
    // reset state
    this.server = undefined;
    this.slotManager = new SlotManager(this.syncSlots);
    this.updateSlots(this.props);

    // reset to configuring
    this.setState({ type: 'configuring' });
  }
}
