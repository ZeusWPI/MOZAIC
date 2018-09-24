import React from 'react';
import classNames from 'classnames/bind';
import { Visualizer } from 'planetwars-visualizer';
import BlocklyEditor from 'components/BlocklyEditor';
import Modal from 'react-modal';
import styleIdentifiers from './app.scss';

const styles = classNames.bind(styleIdentifiers);

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.setLoaded = this.setLoaded.bind(this);
    this.startVisualizer = this.startVisualizer.bind(this);
    this.state = { loaded: false, showVisualizer: false };
  }

  setLoaded() {
    this.setState({ loaded: true });
  }

  startVisualizer(matchLog) {
    this.setState({ matchLog, showVisualizer: true });
  }

  closeVisualizer() {
    this.setState({ showVisualizer: false });
  }

  render() {
    const { showVisualizer, loaded, matchLog } = this.state;
    const playerName = playerNum => (playerNum === 1 ? 'You' : 'The enemy');
    return (
      <div className={styles('app')}>
        <BlocklyEditor
          loaded={loaded}
          setLoaded={this.setLoaded}
          startVisualizer={this.startVisualizer}
          showVisualizer={showVisualizer}
        />
        <Modal
          isOpen={showVisualizer}
          onRequestClose={ml => this.closeVisualizer(ml)}
          className={styles('content-class')}
          overlayClassName={styles('overlay-class')}
        >
          {matchLog ? (
            <Visualizer
              playerName={playerName}
              matchLog={matchLog}
              assetPrefix="./node_modules/planetwars-visualizer"
            />
          ) : (
            false
          )}
          ;
        </Modal>
      </div>
    );
  }
}
