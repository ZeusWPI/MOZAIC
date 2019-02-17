import * as log from 'electron-log';

// https://github.com/electron-userland/electron-webpack/issues/59#issuecomment-347070990
import 'react-hot-loader/patch';

import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import * as React from 'react';
import * as h from 'react-hyperscript';

import Root from './Root';
import { FatalErrorView } from './components/FatalError';
import { initialState } from './reducers';
import { rootSaga } from './sagas';
import { bindToStore } from './database/Database';
import { initializeDirs, populateMaps, populateBots } from './utils/Setup';

import * as process from './process';

import './styles/app.global.scss';
import './styles/lib.global.scss';

export let store: any;

async function render_process() {
  // First thing we do is setup logging
  process.shared.setupLogging('render');

  // Log this only after log is setup to respect log policy
  log.verbose('[STARTUP] Renderer process started');

  // tslint:disable-next-line:no-var-requires
  const { configureStore, history } = require('./store/configureStore');
  store = configureStore(initialState);
  log.debug('[STARTUP] Store configured');

  store.runSaga(rootSaga);
  log.debug('[STARTUP] Root saga started');

  try {
    await initializeDirs();
    await bindToStore(store);

    populateMaps().catch((err) => {
      log.error('[POPULATE] Loading some default maps failed.', err, err.stack);
      alert(`[POPULATE] Loading some default maps failed with ${err}`);
    });

    populateBots().catch((err) => {
      log.error('[POPULATE] Loading some default bots failed.', err, err.stack);
      alert(`[POPULATE] Loading some default bots failed with ${err.error}`);
    });

    try {
      renderApp(history);
    } catch (error) {
      log.error('[FATAL] Fatal error rendering app', error, error.stack);
      renderCustom(h(FatalErrorView, { error }));
    }
  } catch (err) {
    log.error('[FATAL] Unknown fatal error', err, err.stack);
    alert(`Unexpected error: ${err}`);
  }
}

function renderApp(history: any) {
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

render_process();
