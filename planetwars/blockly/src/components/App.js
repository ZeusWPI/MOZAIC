import React from 'react';
import classNames from 'classnames/bind';
import { Visualizer } from 'planetwars-visualizer';
import BlocklyEditor from 'components/BlocklyEditor';
import styleIdentifiers from './app.scss';
import mainstyles from './main.scss';

const styles = classNames.bind(styleIdentifiers);

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.setLoaded = this.setLoaded.bind(this);
    this.state = { loaded: false };
  }

  setLoaded() {
    this.setState({ loaded: true });
  }

  render() {
    return (
      <div className={styles('app')}>
        <BlocklyEditor loaded={this.state.loaded} setLoaded={this.setLoaded} />
      </div>
    );
  }
}
