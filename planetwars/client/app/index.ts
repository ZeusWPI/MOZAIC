import { render } from 'react-dom';
import * as Promise from 'bluebird';
import { AppContainer } from 'react-hot-loader';
import { h } from 'react-hyperscript-helpers';

import Root from './containers/Root';
import { initialState } from './reducers/index';
import { bindToStore } from './utils/Database';
import './app.global.scss';
import './fontawesome.global.scss';

const { configureStore, history } = require('./store/configureStore');
export const store = configureStore(initialState);
bindToStore(store);

// Config the global Bluebird Promise
// We should still 'import * as Promise from bluebird' everywhere to have it at 
// runtime tho.
Promise.config({
  longStackTraces: true,
  warnings: true
  // cancellation: true,
  // monitoring: true,
});

render(
  h(AppContainer, [
    h(Root, {
      store: store,
      history: history
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
