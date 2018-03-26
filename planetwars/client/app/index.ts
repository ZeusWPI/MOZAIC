import { render } from 'react-dom';
import * as Promise from 'bluebird';
import { AppContainer } from 'react-hot-loader';
import { h } from 'react-hyperscript-helpers';

import Root from './containers/Root';
import { FatalErrorView } from './components/FatalError';
import { initialState } from './reducers/index';
import { bindToStore } from './utils/Database';
import { initializeDirs, populateMaps, populateBots } from './utils/Setup';
import './app.global.scss';
import './fontawesome.global.scss';

// tslint:disable-next-line:no-var-requires
const { configureStore, history } = require('./store/configureStore');
export const store = configureStore(initialState);

// Config the global Bluebird Promise
// We should still 'import * as Promise from bluebird' everywhere to have it at
// runtime tho.
Promise.config({
  longStackTraces: true,
  warnings: true,
  // cancellation: true,
  // monitoring: true,
});

type BreakType = 'fatal' | 'map' | 'bots';
class Breaker extends Error {
  constructor(public type: string, public error: Error) {
    super();
    console.log(error);
  }
}

initializeDirs()
  .then(() => bindToStore(store))
  .then(renderApp).catch((err) => new Breaker('fatal', err))
  .then(populateMaps).catch((err) => new Breaker('map', err))
  .then(populateBots).catch((err) => new Breaker('bots', err))
  .catch((br: Breaker) => {
    switch (br.type) {
      case 'fatal': {
        renderCustom(h(FatalErrorView, { error: br.error }));
        break;
      }
      case 'map': {
        alert(`Loading some default maps failed with ${br.error}`);
        break;
      }
      case 'bots': {
        alert(`Loading some default bots failed with ${br.error}`);
        break;
      }
      default: {
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
