import * as ReactDOM from 'react-dom';
import { h } from 'react-hyperscript-helpers';

import Home from './Home';
import Root from './Root';

const { configureStore, history } = require('./store/configureStore');
const store = configureStore();

console.log(store, history);

ReactDOM.render(
  h(Root, {
    store: store,
    history: history
  }),
  document.getElementById('app')
);