import * as React from 'react';
import { h, div } from 'react-hyperscript-helpers';
import { connect } from 'react-redux';
import log from 'electron-log';

import { IGState } from '../reducers';
import Navbar from '../containers/NavbarContainer';
import { FatalErrorView } from '../components/FatalError';

interface Props {
  globalErrors: any[];
}

interface State {
  fatalError?: Error;
}

export class App extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {};
  }

  public componentDidCatch(error: Error, info: any) {
    this.setState({ fatalError: error });
  }

  public render() {
    if (this.state.fatalError) {
      return div(`.app`, [
        h(FatalErrorView, { error: this.state.fatalError }),
      ]);
    }

    this.props.globalErrors.forEach((val) => {
      log.error(`[GLOBAL] ${val} ${val.stack}`);
      alert(`Unexpected Error ${val}`);
    });

    return (
      div(`.app`, [h(Navbar), this.props.children])
    );
  }
}

const mapStateToProps = (state: IGState) => {
  return { globalErrors: state.globalErrors };
};

export default connect(mapStateToProps, undefined)(App);
