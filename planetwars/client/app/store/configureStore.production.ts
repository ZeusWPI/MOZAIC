import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createBrowserHistory } from 'history';
import { routerMiddleware } from 'react-router-redux';
import { rootReducer } from '../reducers';
import createSagaMiddleware from 'redux-saga';

const history = createBrowserHistory();
const router = routerMiddleware(history);
const sagaMiddleware = createSagaMiddleware();
const enhancer = applyMiddleware(thunk, sagaMiddleware, router);

export = {
  history,
  sagaMiddleware,
  configureStore(initialState: object | void) {
    return {
      ...createStore(rootReducer, initialState, enhancer),
      runSaga: sagaMiddleware.run,
    };
  },
};
