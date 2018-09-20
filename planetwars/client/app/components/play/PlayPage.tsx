import * as React from 'react';
import { connect } from 'react-redux';

import * as M from '../../database/models';
import * as A from '../../actions';
import { ServerParams, PlayerParams, RunLocalBot } from '../../actions/lobby';
import { GState } from '../../reducers';

import { WeakConfig, StrongConfig, Slot } from './types';
import { Config } from './Config';
import { Lobby } from './lobby/Lobby';
import { LocalBotSelector } from './LocalBotSelector';
import { LobbyState, PwConfig, Address, PlayerData } from '../../reducers/lobby';
import * as _ from 'lodash';
import { generateToken } from '../../utils/GameRunner';
import { v4 as uuidv4 } from 'uuid';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

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
      dispatch(A.importMap(mapMeta))
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
    runLocalBot(params: RunLocalBot) {
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
  runLocalBot: (params: RunLocalBot) => void;
  startMatch: (config: PwConfig) => void;
}

export type PlayPageProps = PlayPageStateProps & PlayPageDispatchProps;

const alertTODO = () => { alert("TODO"); };
export class PlayPage extends React.Component<PlayPageProps> {

  public render() {
    const { maps, bots, lobby } = this.props;
    return (
      <div className={styles.playPageContainer}>
        <div className={styles.playPage}>

          {/* Left side*/}
          <div className={styles.leftColumn}>
            <div className={styles.lobbyContainer}>
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
          <div className={styles.rightColumn}>
            <div className={styles.configContainer}>
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
            <div className={styles.localBotSelectorContainer}>
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
      clientId: slot.client.clientId,
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

export default connect<PlayPageStateProps, PlayPageDispatchProps>(
  mapStateToProps, mapDispatchToProps,
)(PlayPage);
