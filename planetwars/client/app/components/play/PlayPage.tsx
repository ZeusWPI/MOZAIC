import * as React from 'react';
import { connect } from 'react-redux';

import * as M from '../../database/models';
import * as A from '../../actions';
import { GState } from '../../reducers';

import { WeakConfig, StrongConfig } from './types';
import { Config } from './Config';
import { Lobby, LobbyDispatchProps } from './lobby/Lobby';
import { LocalBotSelector } from './LocalBotSelector';
import { LobbyState, PwConfig, Address } from '../../reducers/lobby';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

function mapStateToProps(state: GState): PlayPageStateProps {
  const { maps, bots, lobby } = state;
  return { maps, bots, lobby };
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
    onPlayerReconnectedDuringMatch(id: number) {
      console.log('player reconnected', id);
    },
    onPlayerDisconnectDuringMatch(id: number) {
      console.log('player disconnected', id);
    },
    sendNotification(title: string, body: string, type: M.NotificationType) {
      dispatch(A.addNotification({title, body, type}));
    },
  };

  return {
    lobbyDispatchProps,
    importMap(mapMeta: M.MapMeta) {
      dispatch(A.importMap(mapMeta))
    },
    setConfig(config: PwConfig) {
      dispatch(A.setConfig(config));
    },
    setAddress(address: Address) {
      dispatch(A.setAddress(address));
    },
  };
}

// ----------------------------------------------------------------------------

export interface PlayPageStateProps {
  maps: M.MapList;
  bots: M.BotList;
  lobby: LobbyState;
}

export interface PlayPageDispatchProps {
  lobbyDispatchProps: LobbyDispatchProps;
  importMap: (mapMeta: M.MapMeta) => void;
  setConfig: (config: PwConfig) => void;
  setAddress: (address: Address) => void;
}

export type PlayPageProps = PlayPageStateProps & PlayPageDispatchProps;

export interface PlayPageState {
  config?: StrongConfig;
  localBots: M.Bot[];
}

export class PlayPage extends React.Component<PlayPageProps, PlayPageState> {
  public state: PlayPageState = { localBots: [] };

  private lobby: Lobby;

  public render() {
    const { maps, bots, lobby } = this.props;
    const { localBots } = this.state;
    return (
      <div className={styles.playPageContainer}>
        <div className={styles.playPage}>

          {/* Left side*/}
          <div className={styles.leftColumn}>
            <div className={styles.lobbyContainer}>
              {/* TODO add 'disableAddress' callback */}
              <Lobby
                config={undefined!}
                maps={maps}
                slots={[]}
                ref={(inst) => this.lobby = inst!}
                {...this.props.lobbyDispatchProps}
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

  private setConfig = (config: StrongConfig) => this.setState({ config });

  private addLocalBot = (id: M.BotId) => {
    const bot = this.props.bots[id];
    this.lobby.addLocalBot(bot);
  }

}

export default connect<PlayPageStateProps, PlayPageDispatchProps>(
  mapStateToProps, mapDispatchToProps,
)(PlayPage);
