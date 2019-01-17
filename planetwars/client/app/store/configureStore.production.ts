import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createBrowserHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';

import { createRootReducer } from '../reducers';
import { GState } from './../reducers/root';

import createSagaMiddleware from 'redux-saga';

const history = createBrowserHistory();
const router = routerMiddleware(history);
const sagaMiddleware = createSagaMiddleware();
const enhancer = applyMiddleware(thunk, sagaMiddleware, router);

export = {
  history,
  configureStore(initialState: GState) {
    return {...createStore(
      createRootReducer(history),
      initialState,
      enhancer,
    ),       runSaga: sagaMiddleware.run,}

    };
  },
};
