import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createBrowserHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';

import { createRootReducer } from '../reducers';
import { GState } from './../reducers/root';

const history = createBrowserHistory();
const router = routerMiddleware(history);
const enhancer = applyMiddleware(thunk, router);

export = {
  history,
  configureStore(initialState: GState) {
    return createStore(
      createRootReducer(history),
      initialState,
      enhancer,
    );
  },
};
