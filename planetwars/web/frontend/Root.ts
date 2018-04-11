import * as React from 'react';
import * as Redux from 'react-redux';
import { History } from 'history';

import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import { h } from 'react-hyperscript-helpers';

import Routes from './Routes';

interface IRootType {
  store: Redux.Store<any>;
  history: History
};

export default function Root({ store, history }: IRootType) {
  return (
    h(Provider, { store: store}, [
      h(ConnectedRouter, {history: history}, [
        h(Routes)
      ])
    ])
  );
}
