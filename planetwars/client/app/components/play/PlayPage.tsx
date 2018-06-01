import * as React from 'react';
import { connect } from 'react-redux';

import * as M from '../../database/models';
import * as A from '../../actions';
import { GState } from '../../reducers';

import { WeakConfig, StrongConfig } from './types';
import { Config } from './Config';
import { Lobby } from './lobby/Lobby';
import { LocalBotSelector } from './LocalBotSelector';
import { LobbyState, PwConfig, Address, PlayerData } from '../../reducers/lobby';
import { Slot } from './lobby/SlotManager';
import * as _ from 'lodash';
import { generateToken } from '../../utils/GameRunner';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

function mapStateToProps(state: GState): PlayPageStateProps {
  const { maps, bots, lobby } = state;
  const map = maps[lobby.config.mapId];
  let slots: Slot[] = [];
  if (map) {
    slots = _.range(1, map.slots + 1).map((number) => ({
      name: `Player ${number}`,
      token: '',
      connected: false,
    }));
  };

  Object.keys(lobby.players).forEach((token) => {
    const index = lobby.players[token].playerNumber - 1;
    slots[index].token = token;
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
    savePlayer(player: PlayerData) {
      dispatch(A.savePlayer(player));
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
  savePlayer: (player: PlayerData) => void;
}

export type PlayPageProps = PlayPageStateProps & PlayPageDispatchProps;

const alertTODO = () => { alert("TODO");}
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

  private addLocalBot = (botId: M.BotId) => {
    const bot = this.props.bots[botId];

    // find first available slot
    let idx = 0;
    while (this.props.slots[idx].token) {
      idx += 1;
    }

    this.props.savePlayer({
      token: generateToken(),
      playerNumber: idx + 1,
    });
  }
}

export default connect<PlayPageStateProps, PlayPageDispatchProps>(
  mapStateToProps, mapDispatchToProps,
)(PlayPage);
