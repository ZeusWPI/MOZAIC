import * as React from 'react';
import { h, div } from 'react-hyperscript-helpers';
import { connect } from 'react-redux';

import { addBot } from '../actions/actions';
import { IBotConfig } from '../utils/ConfigModels';
import { ObjectLoader } from '../utils/ObjectLoader';
import { IGState } from '../reducers';
import { IMatchMetaData } from '../utils/GameModels';

interface IProps {
  globalErrors: any[];
}

export class App extends React.Component<IProps, {}> {

  public render() {
    this.props.globalErrors.forEach((val) => alert(JSON.stringify(val)));
    return (
      div(`.app`, [this.props.children])
    );
  }
}

const mapStateToProps = (state: IGState) => {
  return { globalErrors: state.globalErrors };
};

export default connect(mapStateToProps, undefined)(App);
