import * as React from 'react';
import * as Promise from 'bluebird';
import { connect } from 'react-redux';
import { h } from 'react-hyperscript-helpers';


import { ObjectManager } from '../utils/ObjectManager';
import { loadBot } from '../actions/actions';
import { BotConfig } from '../utils/Models';

let styles = require("./App.scss");


interface IProps { initApp: () => Promise<void> }

export class App extends React.Component<IProps, any> {

  componentDidMount() {
    this.props
      .initApp()
    // .catch(err => alert(err))
  }

  render() {
    return (
      h("div", `.${styles.app}`, [this.props.children])
    );
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    initApp: () => {
      return ObjectManager
        .initDirs()
        .then(ObjectManager.loadBots)
        .map((bot: BotConfig) => dispatch(loadBot(bot)))
        .all()
        .then(() => Promise.resolve());
    },
  }
}

export default connect(null, mapDispatchToProps)(App)

