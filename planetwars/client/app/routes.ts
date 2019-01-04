import * as React from 'react';
import { Switch, Route } from 'react-router';
import * as h from 'react-hyperscript';

import App from './App';
import {
  BotsPage,
  HomePage,
  HostPage,
  InfoPage,
  JoinPage,
  MatchesPage,
  Navbar,
  PlayPage,
} from './components';

export default class Routes extends React.Component<any, any> {
  public render() {
    return (
      h(App, [
        h(Switch, [
          h(Route, {
            path: '/home',
            component: HomePage,
          }),
          h(Route, {
            path: '/play',
            component: PlayPage,
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
          h(Route, {
            path: '/join',
            component: JoinPage,
          }),
        ]),
      ])
    );
  }
}
