import * as React from 'react';
import { connect } from 'react-redux';

import { GState } from '../../reducers';
import Config from './Config';
import Lobby from './Lobby';
import LocalBotSelector from './LocalBotSelector';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

function mapStateToProps(state: GState) {
  return {};
}

function mapDispatchToProps(dispatch: any) {
  return {};
}

export interface PlayPageState { isServerRunning: boolean; }

export class PlayPage extends React.Component<{}, {}> {
  public state: PlayPageState = { isServerRunning: false };
  public render() {
    return (
      <div className={styles.playPageContainer}>
        <div className={styles.playPage}>

          {/* Left side*/}
          <div className={styles.lobbyContainer}>
            <Lobby />
          </div>

          {/* Right side*/}
          <div className={styles.rightColumn}>
            <div className={styles.configContainer}>
              <Config />
            </div>
            <div className={styles.localBotSelectorContainer}>
              <LocalBotSelector />
            </div>
          </div>
        </div>
      </div >
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PlayPage);
