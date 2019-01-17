import * as React from 'react';
import { connect } from 'react-redux';

import * as M from '../../database/models';
import * as A from '../../actions';
import { ServerParams, PlayerParams, BotParams } from '../../actions/lobby';
import { GState } from '../../reducers';

import { WeakConfig, StrongConfig, Slot } from './types';
import { Config } from './Config';
import { Lobby, LobbyDispatchProps } from './lobby/Lobby';
import { LocalBotSelector } from './LocalBotSelector';
import { PwTypes } from 'mozaic-client';
import { LobbyState, PwConfig, Address, PlayerData } from '../../reducers/lobby';
import * as _ from 'lodash';
import { generateToken } from '../../utils/GameRunner';
import { v4 as uuidv4 } from 'uuid';

import * as css from './PlayPage.scss';

function mapStateToProps(state: GState): PlayPageStateProps {
  const { maps, bots, lobby } = state;
  const map = maps[lobby.config.mapId];
  let slots: Slot[] = [];
  if (map) {
    slots = _.times(map.slots, () => ({}));
  }

  Object.keys(lobby.players).forEach((playerId) => {
    const player = lobby.players[playerId];
    const slot = slots[player.number];
    slot.player = player;

    if (player.clientId) {
      slot.client = lobby.clients[player.clientId];
    }

    if (player.botId) {
      slot.bot = bots[player.botId];
    }
  });

  return { maps, bots, lobby, slots };
}

function mapDispatchToProps(dispatch: any): PlayPageDispatchProps {
  const lobbyDispatchProps: LobbyDispatchProps = {
    saveMatch(match: M.Match) {
      dispatch(A.saveMatch(match));
    },
    onMatchComplete(matchId: M.MatchId) {
      dispatch(A.completeMatch(matchId));
    },
    onMatchErrored(matchId: M.MatchId, err: Error) {
      dispatch(A.handleMatchError(matchId, err));
    },
    addLogEntry(matchId: M.MatchId, entry: PwTypes.LogEntry) {
      dispatch(A.addLogEntry({ matchId, entry }));
    },
    onPlayerReconnectedDuringMatch(id: number) {
      console.log('player reconnected', id);
    },
    onPlayerDisconnectDuringMatch(id: number) {
      console.log('player disconnected', id);
    },
    sendNotification(title: string, body: string, type: M.NotificationType) {
      dispatch(A.addNotification({ title, body, type }));
    },
  };
  return {
    importMap(mapMeta: M.MapMeta) {
      dispatch(A.importMap(mapMeta))
    },
    setConfig(config: PwConfig) {
      dispatch(A.setConfig(config));
    },
    setAddress(address: Address) {
      dispatch(A.setAddress(address));
    },
    addLogEntry(matchId: M.MatchId, entry: PwTypes.LogEntry) {
      dispatch(A.addLogEntry({ matchId, entry }));
    createPlayer(player: PlayerData) {
      dispatch(A.createPlayer(player));
    },
    startServer(params: ServerParams) {
      dispatch(A.startServer(params));
    },
    stopServer() {
      dispatch(A.stopServer());
    },
    runLocalBot(params: BotParams) {
      dispatch(A.runLocalBot(params));
    },
    startMatch(config: PwConfig) {
      dispatch(A.startMatch(config));
    }
  };

}

// ----------------------------------------------------------------------------

export interface PlayPageStateProps {
  maps: M.MapList;
  bots: M.BotList;
  lobby: LobbyState;
  slots: Slot[];
}

export interface PlayPageDispatchProps {
  importMap: (mapMeta: M.MapMeta) => void;
  setConfig: (config: PwConfig) => void;
  setAddress: (address: Address) => void;
  createPlayer: (player: PlayerParams) => void;
  startServer: (params: ServerParams) => void;
  stopServer: () => void;
  runLocalBot: (params: BotParams) => void;
  startMatch: (config: PwConfig) => void;
}

export type PlayPageProps = PlayPageStateProps & PlayPageDispatchProps;

export interface PlayPageState {
  config?: WeakConfig;
  localBots: M.Bot[];
}
const alertTODO = () => { alert("TODO"); };
export class PlayPage extends React.Component<PlayPageProps> {

export class PlayPage extends React.Component<PlayPageProps, PlayPageState> {
  public state: PlayPageState = { localBots: [] };

  private lobby: Lobby;

  public render() {

    const { config, localBots } = this.state;
    const { maps, bots, lobby } = this.props;
    return (
      <div className={css.playPageContainer}>
        <div className={css.playPage}>

          {/* Left side*/}
          <div className={css.leftColumn}>
            <div className={css.lobbyContainer}>
              {/* TODO add 'disableAddress' callback */}
              <Lobby
                slots={this.props.slots}
                maps={maps}
                state={lobby}
                startServer={this.startServer}
                stopServer={this.stopServer}
                launchGame={this.startMatch}
                runLocalBot={this.runLocalBot}
                serverRunning={!!lobby.matchId}
              />
            </div>
          </div>

          {/* Right side*/}
          <div className={css.rightColumn}>
            <div className={css.configContainer}>
              <Config
                config={lobby.config}
                address={lobby.address}
                maps={maps}
                setConfig={this.props.setConfig}
                setAddress={this.props.setAddress}
                importMap={this.props.importMap}
                serverRunning={!!lobby.matchId}
              />
            </div>
            <div className={css.localBotSelectorContainer}>
              <LocalBotSelector bots={bots} onClick={this.addLocalBot} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  private startServer = () => {
    const matchId = uuidv4();
    const {lobby: { address } } = this.props;
    this.props.startServer({ matchId, address });
  }

  private stopServer = () => {
    this.props.stopServer();
  }

  private runLocalBot = (slot: Slot) => {
    if (!slot.client || !slot.bot) {
      throw new Error('we suck at programming');
    }
    this.props.runLocalBot({
      address: this.props.lobby.address,
      token: slot.client.token,
      bot: slot.bot,
    });
  }

  private startMatch = () => {
    this.props.startMatch(this.props.lobby.config);
  }

  private addLocalBot = (botId: M.BotId) => {
    const bot = this.props.bots[botId];

    // find first available slot
    let idx = 0;
    while (this.props.slots[idx].player) {
      idx += 1;
    }

    this.props.createPlayer({
      id: uuidv4(),
      name: bot.name,
      number: idx,
      botId: bot.uuid,
    });
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PlayPage);
