import * as React from 'react';
import { connect } from 'react-redux';

import * as M from '../../database/models';
import * as A from '../../actions';
import { GState } from '../../reducers';

import { WeakConfig } from './types';
import { Config } from './Config';
import { Lobby, LobbyDispatchProps } from './lobby/Lobby';
import { LocalBotSelector } from './LocalBotSelector';
import { PwTypes } from 'mozaic-client';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

function mapStateToProps(state: GState): PlayPageStateProps {
  const { maps, bots } = state;
  return { maps, bots };
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
  };
  const importMap = (mapMeta: M.MapMeta) => { dispatch(A.importMap(mapMeta)); };
  return { lobbyDispatchProps, importMap };
}

// ----------------------------------------------------------------------------

export interface PlayPageStateProps {
  maps: M.MapList;
  bots: M.BotList;
}

export interface PlayPageDispatchProps {
  lobbyDispatchProps: LobbyDispatchProps;
  importMap: (mapMeta: M.MapMeta) => void;
}

export type PlayPageProps = PlayPageStateProps & PlayPageDispatchProps;

export interface PlayPageState {
  config?: WeakConfig;
  localBots: M.Bot[];
}

export class PlayPage extends React.Component<PlayPageProps, PlayPageState> {
  public state: PlayPageState = { localBots: [] };

  private lobby: Lobby;

  public render() {
    const { maps, bots } = this.props;
    const { config, localBots } = this.state;
    return (
      <div className={styles.playPageContainer}>
        <div className={styles.playPage}>

          {/* Left side*/}
          <div className={styles.leftColumn}>
            <div className={styles.lobbyContainer}>
              {/* TODO add 'disableAddress' callback */}
              <Lobby
                config={config}
                maps={maps}
                ref={(inst) => this.lobby = inst!}
                {...this.props.lobbyDispatchProps}
              />
            </div>
          </div>

          {/* Right side*/}
          <div className={styles.rightColumn}>
            <div className={styles.configContainer}>
              <Config maps={maps} setConfig={this.setConfig} importMap={this.props.importMap} />
            </div>
            <div className={styles.localBotSelectorContainer}>
              <LocalBotSelector bots={bots} onClick={this.addLocalBot} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  private setConfig = (config: WeakConfig) => this.setState({ config });

  private addLocalBot = (id: M.BotId) => {
    const bot = this.props.bots[id];
    this.lobby.addLocalBot(bot);
  }

}

export default connect<PlayPageStateProps, PlayPageDispatchProps>(
  mapStateToProps, mapDispatchToProps,
)(PlayPage);
