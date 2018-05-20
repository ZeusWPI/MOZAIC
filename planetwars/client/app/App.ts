import * as React from 'react';
import { h, div } from 'react-hyperscript-helpers';
import { connect } from 'react-redux';
import log from 'electron-log';

import { GState } from './reducers';
import { Navbar, FatalErrorView } from './components';

interface State { fatalError?: Error; }

export class App extends React.Component<{}, State> {
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
    return (
      div(`.app`, [h(Navbar), this.props.children])
    );
  }
}

export default connect(undefined, undefined)(App);
