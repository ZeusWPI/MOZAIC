import * as React from 'react';
import * as Redux from 'react-redux';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import { History } from 'history';
import { h } from 'react-hyperscript-helpers';

import Routes from '../routes';

interface IRootType {
  store: Redux.Store<any>;
  history: History;
}

export default function Root({ store, history }: IRootType) {
  return (
    h(Provider, { store }, [
      h(ConnectedRouter, { history }, [
        h(Routes),
      ]),
    ])
  );
}
