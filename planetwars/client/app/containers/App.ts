import * as Promise from 'bluebird';
import * as React from 'react';
import { h } from 'react-hyperscript-helpers';
import { connect } from 'react-redux';


import { ObjectManager } from '../utils/ObjectManager';
import { loadBot } from '../actions/actions';



interface IProps { initApp: () => Promise<void> }
import { IBotConfig } from '../utils/ConfigModels';
import { IGState } from '../reducers';

const styles = require("./App.scss");

interface IProps {
  globalErrors: any[];
}

export class App extends React.Component<IProps, {}> {

  public render() {
    this.props.globalErrors.forEach((val) => alert(JSON.stringify(val)));
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
        .map((bot: IBotConfig) => dispatch(loadBot(bot)))
        .all()
        .then(() => Promise.resolve());
    },
  }
}
const mapStateToProps = (state: IGState) => {
  return { globalErrors: state.globalErrors };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
