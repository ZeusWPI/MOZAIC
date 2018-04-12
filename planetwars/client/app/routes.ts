import * as React from 'react';
import { Switch, Route } from 'react-router';
import { Link } from 'react-router-dom';
import { h, ul, li, nav, div, span } from 'react-hyperscript-helpers';

import App from './containers/App';
import HomePage from './containers/HomePage';
import HostPage from './containers/HostPage';
import BotsPage from './containers/BotsPage';
import MatchesPage from './containers/MatchesPage';
import InfoPage from './containers/InfoPage';
import Navbar from './containers/NavbarContainer';

export default class Routes extends React.Component<any, any> {
  public render() {
    return (
      h(App, [
        h(Navbar),
        h(Switch, `.container`, [
          h(Route, {
            path: '/home',
            component: HomePage,
          }),
          h(Route, {
            path: '/host',
            component: HostPage,
          }),
          h(Route, {
            path: '/bots/:bot',
            component: BotsPage,
          }),
          h(Route, {
            path: '/bots',
            component: BotsPage,
          }),
          h(Route, {
            path: '/matches/:matchId',
            component: MatchesPage,
          }),
          h(Route, {
            path: '/matches',
            component: MatchesPage,
          }),
          h(Route, {
            path: '/info',
            component: InfoPage,
          }),
        ]),
      ])
    );
  }
}
