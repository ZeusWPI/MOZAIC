import * as Promise from 'bluebird';
import * as React from 'react';
import { h } from 'react-hyperscript-helpers';
import { connect } from 'react-redux';

import { loadBot } from '../actions/actions';
import { IBotConfig } from '../utils/ConfigModels';
import { ObjectLoader } from '../utils/ObjectLoader';

const styles = require("./App.scss");

interface IProps { initApp: () => Promise<void>; }

export class App extends React.Component<IProps, {}> {

  public componentDidMount() {
    this.props
      .initApp()
      .catch((err) => alert(err));
  }

  public render() {
    return (
      h("div", `.${styles.app}`, [this.props.children])
    );
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    initApp: () => {
      return ObjectLoader
        .initDirs()
        .then(ObjectLoader.loadBots)
        .map((bot: IBotConfig) => dispatch(loadBot(bot)))
        .all()
        .then(() => Promise.resolve());
    },
  }
}

export default connect(null, mapDispatchToProps)(App);
