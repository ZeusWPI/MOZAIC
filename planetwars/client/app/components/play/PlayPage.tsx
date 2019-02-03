/**
 * Houses a player lobby, map settings, and bot assignment (to players).
 * The gameserver is started from here, after which a game can be launched.
 * 
 */
/** */
import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import * as M from '../../database/models';
import * as A from '../../actions';

import { ServerParams, PlayerParams, BotParams } from '../../actions/lobby';
import { LobbyState, PwConfig, Address, PlayerData } from '../../reducers/lobby';
import { GState } from '../../reducers';

import { WeakConfig, Slot } from './types';
import { Config } from './Config';
import { Lobby } from './lobby/Lobby';
import { LocalBotSelector } from './LocalBotSelector';

import * as css from './PlayPage.scss';

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
  return {
    importMap(mapMeta: M.MapMeta) {
      dispatch(A.importMap(mapMeta));
    },
    setConfig(config: PwConfig) {
      dispatch(A.setConfig(config));
    },
    setAddress(address: Address) {
      dispatch(A.setAddress(address));
    },
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
    },
  };

}

// ----------------------------------------------------------------------------

export interface PlayPageState {
  config?: WeakConfig;
  localBots: M.Bot[];
}
const alertTODO = () => { alert("TODO"); };
/**
 * The container component for the page.
 * Handles all the dispatches needed to start and stop a server and match,
 * assign bots to players and start running the bots.
 */
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
  /**
   * Dispatch the startServer action.
   * Caught in [[lobbyFlowSaga]].
   */
  private startServer = () => {
    const matchId = uuidv4();
    const { lobby: { address } } = this.props;
    this.props.startServer({ matchId, address });
  }
  /**
   * Dispatch the stopServer action.
   * Caught in [[lobbyFlowSaga]].
   * Races against [[startMatch]].
   */
  private stopServer = () => {
    this.props.stopServer();
  }
  /**
   * Dispatch the runLocalBot action.
   * Caught in [[watchRunLocalBot]] saga.
   */
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
  /**
   * Dispatch the startMatch action.
   * Caught in [[lobbyFlowSaga]].
   * Races against [[stopServer]].
   */
  private startMatch = () => {
    this.props.startMatch(this.props.lobby.config);
  }
  /**
   * Dispatch the createPlayer action with a certain bot as payload.
   * Caught in [[watchCreatePlayer]] saga.
   */
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
