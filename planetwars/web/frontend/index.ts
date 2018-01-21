import * as ReactDOM from 'react-dom';
import { h } from 'react-hyperscript-helpers';

import Root from './Root';

const { configureStore, history } = require('./store/configureStore');
const store = configureStore();
const styles = require('./main.global.scss');

require('./static/favicon.ico');

ReactDOM.render(
  h(Root, {
    store: store,
    history: history
  }),
  document.getElementById('app')
);