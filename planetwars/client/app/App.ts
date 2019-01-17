import * as React from 'react';
import * as h from 'react-hyperscript';
import { connect } from 'react-redux';

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
      return h(`div.app`, [
        h(FatalErrorView, { error: this.state.fatalError }),
      ]);
    }
    return (
      h(`div.app`, [h(Navbar), this.props.children])
    );
  }
}

export default connect(undefined, undefined)(App);
