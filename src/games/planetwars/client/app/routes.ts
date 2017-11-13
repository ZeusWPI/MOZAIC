import * as React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import { h } from 'react-hyperscript-helpers';

export default () => (
  h(App, [h(HomePage)])
  // h(App, [
  //   h(Switch, [
  //     h(Route, {
  //       path: '/',
  //       component: h(HomePage)
  //     })
  //   ])
  // ])
  // <App>
  //   <Switch>
  //     <Route path="/" component={HomePage} />
  //   </Switch>
  // </App>
);
