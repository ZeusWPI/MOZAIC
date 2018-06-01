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

// tslint:disable-next-line:no-var-requires
const styles = require('./Lobby.scss');

export type LobbyProps = LobbyDispatchProps & {
  maps: M.MapList;
  config: Lib.StrongConfig;
  slots: Slot[];
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

const alertTODO = () => { alert('TODO'); };

export class Lobby extends React.Component<LobbyProps> {
  // private slotManager: SlotManager;
  // private server?: PwClient.MatchRunner;

  constructor(props: LobbyProps) {
    super(props);
    this.state = { type: 'configuring', slots: [] };
  }

  public render() {
    const { config, slots } = this.props;
    const { port, host } = Lib.getWeakAddress(config);
    return (
      <Section header={"Lobby"}>
        <div className={styles.lobby}>
          <SlotList
            slots={slots}
            port={port}
            host={host}
            willBeKicked={this.willBeKicked}
            connectLocalBot={alertTODO}
            removeBot={alertTODO}
            isServerRunning={false}
          />
          <ServerControls
            startServer={alertTODO}
            stopServer={alertTODO}
            launchGame={alertTODO}
            serverRunning={false}
          />
        </div>
      </Section>
    );
  }

  public addLocalBot(bot: M.Bot) {
    alert('TODO');
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
  }

  private updateSlots(props: LobbyProps) {
    const { config, maps } = props;
    if (!config || !config.mapId) { return; }

    const map = maps[config.mapId];
  }
}
