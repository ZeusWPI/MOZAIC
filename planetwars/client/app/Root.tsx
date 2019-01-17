import * as React from 'react';
import * as Redux from 'redux';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { History } from 'history';

import Routes from './routes';

interface RootProps {
  store: Redux.Store<any>;
  history: History;
}

export default class Root extends React.Component<RootProps> {
  public render() {
    const { store, history } = this.props;
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <Routes />
        </ConnectedRouter>
      </Provider>
    );
  }
}
