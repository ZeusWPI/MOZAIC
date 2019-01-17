import log from 'electron-log';
log.info('[STARTUP] Renderer process started');

// https://github.com/electron-userland/electron-webpack/issues/59#issuecomment-347070990
import 'react-hot-loader/patch';

import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import * as React from 'react';
import * as Promise from 'bluebird';
import * as h from 'react-hyperscript';

import Root from './Root';
import { FatalErrorView } from './components/FatalError';
import { initialState } from './reducers';
import { bindToStore } from './database/Database';
import { initializeDirs, populateMaps, populateBots } from './utils/Setup';

import './styles/app.global.scss';
import './styles/lib.global.scss';

log.info('[STARTUP] Renderer modules loaded');

// tslint:disable-next-line:no-var-requires
const { configureStore, history } = require('./store/configureStore');
export const store = configureStore(initialState);

log.info('[STARTUP] Store configured');

// Config the global Bluebird Promise
// We should still 'import * as Promise from bluebird' everywhere to have it at
// runtime tho.
Promise.config({
  longStackTraces: true,
  warnings: true,
  // cancellation: true,
  // monitoring: true,
});

log.info('[STARTUP] Promise configured');

log.info('[STARTUP] Init app render');
initializeDirs()
  .then(() => log.info('[STARTUP] Initialized dirs'))
  .then(() => bindToStore(store))
  .then(() => log.info('[STARTUP] Bound to store'))
  .then(() => Promise.try(() => {
    renderApp();
    log.info('[STARTUP] App rendered');
    Promise
      .try(populateMaps)
      .catch((err) => {
        log.error('[POPULATE] Loading some default maps failed.', err, err.stack);
        alert(`[POPULATE] Loading some default maps failed with ${err}`);
      });

    Promise
      .try(populateBots)
      .catch((err) => {
        log.error('[POPULATE] Loading some default bots failed.', err, err.stack);
        alert(`[POPULATE] Loading some default bots failed with ${err.error}`);
      });
  }))
  .catch((error) => {
    log.error('[FATAL]', error, error.stack);
    renderCustom(h(FatalErrorView, { error }));
  })
  .catch((err) => {
    log.error('[FATAL]', err, err.stack);
    alert(`Unexpected error: ${err}`);
  });

function renderApp() {
  const app = (
    <AppContainer>
      <Root store={store} history={history} />
    </AppContainer>
  );
  renderCustom(app);
}

function renderCustom(element: any) {
  render(element, document.getElementById('app'));

  if ((module as any).hot) {
    (module as any).hot.accept('./Root', () => {
      render(
        element,
        document.getElementById('app'),
      );
    });
  }
}
