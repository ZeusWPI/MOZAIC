import * as React from 'react';
import { connect } from 'react-redux';

import * as M from '../../database/models';
import { GState } from '../../reducers';

import { WeakConfig } from './types';
import { Config } from './Config';
import { Lobby, LobbyDispatchProps } from './lobby/Lobby';
import { LocalBotSelector } from './LocalBotSelector';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

function mapStateToProps(state: GState): PlayPageStateProps {
  const { maps, bots } = state;
  return { maps, bots };
}

function mapDispatchToProps(dispatch: any): PlayPageDispatchProps {
  const lobbyDispatchProps = {
    saveMatch() { console.log('save match'); },
    signalMatchComplete() { console.log('match complete'); },
    signalMatchErrored(err: Error) { console.log('match errored', err); },
    signalPlayerReconnectedDuringMatch(id: number) { console.log('player reconnected', id); },
    signalPlayerDisconnectDuringMatch(id: number) { console.log('player disconnected', id); },
  };
  return { lobbyDispatchProps };
}

// ----------------------------------------------------------------------------

export interface PlayPageStateProps {
  maps: M.MapList;
  bots: M.BotList;
}

export interface PlayPageDispatchProps {
  lobbyDispatchProps: LobbyDispatchProps;
}

export type PlayPageProps = PlayPageStateProps & PlayPageDispatchProps;

export interface PlayPageState {
  config?: WeakConfig;
  localBots: M.Bot[];
}

export class PlayPage extends React.Component<PlayPageProps, PlayPageState> {
  public state: PlayPageState = { localBots: [] };

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
                localBots={localBots}
                removeLocalBot={this.removeLocalBot}
                {...this.props.lobbyDispatchProps}
              />
            </div>
          </div>

          {/* Right side*/}
          <div className={styles.rightColumn}>
            <div className={styles.configContainer}>
              <Config maps={maps} setConfig={this.setConfig} />
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
    const localBots = [...this.state.localBots, this.props.bots[id]];
    this.setState({ localBots });
  }

  private removeLocalBot = (index: number) => {
    const localBots = this.state.localBots;
    localBots.splice(index, 1);
    this.setState({ localBots: [...localBots] });
  }

}

export default connect<PlayPageStateProps, PlayPageDispatchProps>(
  mapStateToProps, mapDispatchToProps,
)(PlayPage);
