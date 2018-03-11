import * as Promise from 'bluebird';
import * as React from 'react';
import { h } from 'react-hyperscript-helpers';
import { connect } from 'react-redux';

import { db, SCHEMA } from '../utils/Database';
import { addBot } from '../actions/actions';
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
    initApp: () => initApp(dispatch),
  };
};

function initApp(dispatch: any): Promise<any> {
  console.log("test");
  db.get(SCHEMA.BOTS).each((bot: IBotConfig) => {
    console.log("bot");
  });
  return Promise.resolve();
}

// function initApp(dispatch: any) {
//   return ObjectLoader
//     .initDirs()
//     .then(() => Promise.join(loadBots(dispatch), loadGames(dispatch)))
//     .all()
//     .then(() => Promise.resolve());
// }

// function loadBots(dispatch: any): Promise<void> {
//   return ObjectLoader
//     .loadBots()
//     .map((bot: IBotConfig) => dispatch(loadBot(bot)))
//     .then();
// }

function loadGames(dispatch: any): Promise<void> {
  return Promise.resolve();
}

export default connect(null, mapDispatchToProps)(App);
