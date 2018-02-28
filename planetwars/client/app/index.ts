import * as React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './containers/Root';
import './app.global.scss';
import { h } from 'react-hyperscript-helpers';

const { configureStore, history } = require('./store/configureStore');
export const store = configureStore();

render(
  h(AppContainer, [
    h(Root, {
      store: store,
      history:history
    })
  ]),
  document.getElementById('root')
);

if ((module as any).hot) {
  (module as any).hot.accept('./containers/Root', () => {
    const NextRoot = require('./containers/Root').default;
    render(
      h(AppContainer, [
        h(Root, {
          store: store,
          history: history
        })
      ]),
      document.getElementById('root')
    );
  });
}
