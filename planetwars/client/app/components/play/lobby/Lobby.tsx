/**
 * Houses the player lobby and the server/match controls.
 */
/** */

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
import { SlotManager, Slot } from './SlotManager';
import { PwTypes } from 'mozaic-client';
import { LobbyState } from '../../../reducers/lobby';

import * as css from './Lobby.scss';

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

export interface LobbyDispatchProps {
  saveMatch: (match: M.Match) => void;
  addLogEntry(matchId: M.MatchId, entry: PwTypes.LogEntry): void;
  sendNotification(title: string, message: string, type: M.NotificationType): void;
  onMatchComplete(matchId: M.MatchId): void;
  onMatchErrored(matchId: M.MatchId, err: Error): void;
  onPlayerReconnectedDuringMatch(id: number): void;
  onPlayerDisconnectDuringMatch(id: number): void;
}
const alertTODO = () => { alert('TODO'); };
/**
 * Lobby container
 */
export class Lobby extends React.Component<LobbyProps> {
  constructor(props: LobbyProps) {
    super(props);
  }

  public render() {
    // const config = this.props.config;
    // const { port, host } = Lib.getWeakAddress(config);
    const { state, slots } = this.props;

    // TODO TODO
    const willBeKicked = (num: number) => true;

    return (
      <Section header={"Lobby"}>
        <div className={css.lobby}>
          <SlotList
            slots={slots}
            address={state.address}
            willBeKicked={willBeKicked}
            isServerRunning={this.props.serverRunning}
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

  // public addLocalBot(bot: M.Bot) {
  //   this.slotManager.bindLocalBot(bot);
  // }

  // private willBeKicked(index: number): boolean {
  //   const { maps, config } = this.props;
  //   if (config && config.mapId) {
  //     return index >= maps[config.mapId].slots;
  //   } else {
  //     return false;
  //   }
  // }

  // private syncSlots = (slotManager: SlotManager) => {
  //   this.setState({ slots: slotManager.getSlots() });
  // }

  // private updateSlots(props: LobbyProps) {
  //   const { config, maps } = props;
  //   if (!config || !config.mapId) { return; }

  //   const map = maps[config.mapId];
  //   this.slotManager.update(map);
  // }

  // private removeBot = (num: number) => this.slotManager.removeBot(num);

  // private removeExternalBot = (token: M.Token, playerNum: number, clientId: number) => {
  //   if (!this.validifyRunning(this.state)) { return; }
  //   if (this.server) {
  //     this.server.removePlayer(clientId);
  //     this.slotManager.disconnectClient(clientId);
  //     this.slotManager.removeBot(playerNum);
  //   }
  // }

  // private unbindLocalBot = (token: M.Token, playerNum: number) => {
  //   this.slotManager.removeBot(playerNum);
  // }

  // private validifyRunning(s: LobbyState): s is RunningState {
  //   if (!this.server || this.state.type !== 'running') {
  //     alert('Something went wrong (state is wrong or server is missing).');
  //     return false;
  //   }
  //   return true;
  // }

  // private validifyConfiguring(s: LobbyState): s is ConfiguringState {
  //   if (this.server || this.state.type !== 'configuring') {
  //     alert('Something went wrong (state is wrong or server is already running).');
  //     return false;
  //   }
  //   return true;
  // }

  // private startServer = () => {
  //   if (!this.validifyConfiguring(this.state)) { return; }

  //   const config = Lib.validateConfig(this.props.config);
  //   if (config.type === 'error') {
  //     alert(`Config is not valid. ${config.address || config.map || config.maxTurns}`);
  //     return;
  //   }

  //   // TODO this is dirty, cause we have to create a matchId already
  //   const matchId = Config.generateMatchId();
  //   const ctrlToken = generateToken();
  //   const logFile = Config.matchLogPath(matchId);
  //   const params = { ctrl_token: ctrlToken, address: config.address, logFile };
  //   console.log('launching server with', params);

  //   // callbacks should be set on the current slotmanager,
  //   // not the one belonging to 'this'. (It changes when a match is launched).
  //   const slotManager = this.slotManager;

  //   PwClient.MatchRunner.create(Config.matchRunner, params)
  //     .then((server) => {
  //       console.log('test proc');
  //       const slots = this.state.slots;
  //       this.server = server;
  //       this.slotManager.setMatchRunner(server);
  //       this.server.onPlayerConnected.subscribe((clientId) => {
  //         slotManager.connectClient(clientId);
  //       });
  //       this.server.onPlayerDisconnected.subscribe((clientId) => {
  //         slotManager.connectClient(clientId);
  //       });
  //       this.server.logger.onEntry.subscribe((entry) => {
  //         this.props.addLogEntry(matchId, entry);
  //       });

  //       this.server.onComplete.subscribe(() => {
  //         this.props.sendNotification(
  //           "Match ended",
  //           `A match on map '${
  //           this.state.type === "configuring" ?
  //             "unknown" :
  //             this.props.maps[this.state.config.mapId]
  //           }' has ended`,
  //           "Finished",
  //         );
  //       });
  //       this.server.onError.subscribe(() => {
  //         this.props.sendNotification(
  //           "Match errored",
  //           `A match on map '${
  //           this.state.type === "configuring" ?
  //             "unknown" :
  //             this.props.maps[this.state.config.mapId]
  //           }' has errored`,
  //           "Error",
  //         );
  //       });
  //       const newState: RunningState = {
  //         type: 'running',
  //         config,
  //         slots,
  //         matchId,
  //         logFile,
  //       };
  //       this.setState(newState);
  //     })
  //     .catch((err) => {
  //       this.stopServer();
  //       alert(`Could not start game server: \n ${err}`);
  //       console.log('Failed to start server.', err);
  //     });
  // }

  // private stopServer = () => {
  //   this.killServer();
  //   if (this.state.type !== 'configuring') {
  //     const { slots, config } = this.state;
  //     this.setState({ type: 'configuring', slots, config: Lib.downGrade(config) });
  //   }
  // }

  // private launchGame = () => {
  //   if (!this.server || !this.validifyRunning(this.state)) {
  //     alert('Something went wrong');
  //     return;
  //   }

  //   const matchId = this.state.matchId;
  //   const gameConf = Lib.exportConfig(this.state.config, this.props.maps);

  //   // Clear old listeners from the lobby
  //   this.server.onConnect.clear();
  //   this.server.onPlayerConnected.clear();
  //   this.server.onPlayerDisconnected.clear();

  //   // Bind completion listeners
  //   this.server.onComplete.subscribe(() => {
  //     this.props.onMatchComplete(matchId);
  //   });
  //   this.server.onError.subscribe((err) => {
  //     this.props.onMatchErrored(matchId, err);
  //   });

  //   // Bind connection listeners
  //   this.server.onPlayerDisconnected.subscribe(
  //     (id: number) => this.props.onPlayerDisconnectDuringMatch(id));
  //   this.server.onPlayerConnected.subscribe(
  //     (id: number) => this.props.onPlayerReconnectedDuringMatch(id));

  //   // Start game
  //   this.server.startGame(gameConf)
  //     // This gets procced when the game has actually started
  //     .then(() => {
  //       const { host, port, maxTurns, mapId } = this.props.config!;
  //       if (!this.validifyRunning(this.state)) { return; }
  //       const match: M.PlayingHostedMatch = {
  //         uuid: this.state.matchId,
  //         type: M.MatchType.hosted,
  //         status: M.MatchStatus.playing,
  //         maxTurns,
  //         map: mapId!,
  //         network: { host, port },
  //         timestamp: new Date(),
  //         logPath: this.state.logFile,
  //         players: this.state.slots.map((slot) => {
  //           if (slot.bot) {
  //             const botSlot: M.InternalBotSlot = {
  //               type: M.BotSlotType.internal,
  //               token: slot.token,
  //               botId: slot.bot.uuid,
  //               name: slot.name,
  //               connected: slot.connected,
  //             };
  //             return botSlot;
  //           } else {
  //             const botSlot: M.ExternalBotSlot = {
  //               type: M.BotSlotType.external,
  //               token: slot.token,
  //               name: slot.name,
  //               connected: slot.connected,
  //             };
  //             return botSlot;
  //           }
  //         }),
  //       };
  //       this.props.saveMatch(match);
  //       this.resetState();
  //     })
  //     .catch((err) => {
  //       alert('Failed to start match. See console for info.');
  //       console.log(err);
  //     });
  // }

  // private killServer() {
  //   if (this.server) {
  //     this.server.shutdown();
  //     this.server = undefined;
  //     console.log('server killed');
  //   }
  // }

  // private resetState() {
  //   // reset state
  //   this.server = undefined;
  //   this.slotManager = new SlotManager(this.syncSlots);
  //   this.updateSlots(this.props);

  //   // reset to configuring
  //   this.setState({ type: 'configuring' });
  // }
}
