import * as React from 'react';
import { h, div } from 'react-hyperscript-helpers';
import { connect } from 'react-redux';
import log from 'electron-log';

import { addBot } from '../actions/actions';
import { BotConfig } from '../utils/ConfigModels';
import { IGState } from '../reducers';

interface IProps {
  globalErrors: any[];
}

export class App extends React.Component<IProps, {}> {

  public render() {
    this.props.globalErrors.forEach((val) => {
      log.error(`[GLOBAL] ${val} ${val.stack}`);
      alert(`Unexpected Error ${val}`);
    });
    return (
      div(`.app`, [this.props.children])
    );
  }
}

const mapStateToProps = (state: IGState) => {
  return { globalErrors: state.globalErrors };
};

export default connect(mapStateToProps, undefined)(App);
