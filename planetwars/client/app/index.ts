import log from 'electron-log';
log.info('[STARTUP] Renderer process started');
import { render } from 'react-dom';
import * as Promise from 'bluebird';
import { AppContainer } from 'react-hot-loader';
import { h } from 'react-hyperscript-helpers';

import Root from './containers/Root';
import { FatalErrorView } from './components/FatalError';
import { initialState } from './reducers/index';
import { bindToStore } from './database/Database';
import { initializeDirs, populateMaps, populateBots } from './utils/Setup';
import './app.global.scss';
import './fontawesome.global.scss';

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

type BreakType = 'fatal' | 'map' | 'bots';
class Breaker extends Error {
  constructor(public type: string, public error: Error) {
    super();
    console.log(error);
  }
}

log.info('[STARTUP] Init app render');

initializeDirs()
  .then(() => log.info('[STARTUP] Initialized dirs'))
  .then(() => bindToStore(store))
  .then(() => log.info('[STARTUP] Bound to store'))
  .then(renderApp).catch((err) => Promise.reject(new Breaker('fatal', err)))
  .then(() => log.info('[STARTUP] Finished rendering app'))
  .then(populateMaps).catch((err) => Promise.reject(new Breaker('map', err)))
  .then(populateBots).catch((err) => Promise.reject(new Breaker('bots', err)))
  .catch((br: Breaker) => {
    switch (br.type) {
      case 'fatal': {
        log.error(`[FATAL] ${br.error} ${br.stack}`);
        renderCustom(h(FatalErrorView, { error: br.error }));
        break;
      }
      case 'map': {
        log.error(br.error, br.stack);
        alert(`[POPULATE] Loading some default maps failed with ${br.error}`);
        break;
      }
      case 'bots': {
        log.error(br.error, br.stack);
        alert(`[POPULATE] Loading some default bots failed with ${br.error}`);
        break;
      }
      default: {
        log.error(br, br.stack);
        alert(`Unexpected error: ${br}`);
        break;
      }
    }
  });

function renderApp() {
  render(
    h(AppContainer, [
      h(Root, { store, history }),
    ]),
    document.getElementById('root'),
  );

  if ((module as any).hot) {
    (module as any).hot.accept('./containers/Root', () => {
      // tslint:disable-next-line:variable-name
      const NextRoot = require('./containers/Root').default;
      render(
        h(AppContainer, [
          h(Root, { store, history }),
        ]),
        document.getElementById('root'),
      );
    });
  }
}

function renderCustom(element: any) {
  render(
    element,
    document.getElementById('root'),
  );

  if ((module as any).hot) {
    (module as any).hot.accept('./containers/Root', () => {
      render(
        element,
        document.getElementById('root'),
      );
    });
  }
}
