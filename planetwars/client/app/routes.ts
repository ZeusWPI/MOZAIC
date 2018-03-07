import * as React from 'react';
import { Switch, Route } from 'react-router';
import { Link } from "react-router-dom"
import { h, ul, li, nav, div, span } from 'react-hyperscript-helpers';

import App from './containers/App';
import HomePage from './containers/HomePage';
import PlayPage from './containers/PlayPage';
import BotsPage from './containers/BotsPage';
import QueuePage from './containers/QueuePage';
import HistoryPage from './containers/HistoryPage';
import AboutPage from './containers/AboutPage';
import VisualizerPage from './containers/VisualizerPage';
import Navbar from './containers/NavbarContainer';

let styles = require('./routes.scss');


export default class Routes extends React.Component<any, any> {
  render() {
    return (
      h(App, `.${styles.root}`, [
        h(Navbar),
        h("div", `.container.${styles.container}`, [
          h(Switch, [
            h(Route, {
              path: '/home',
              component: HomePage
            }),
            h(Route, {
              path: '/play',
              component: PlayPage
            }),
            h(Route, {
              path: '/bots/:bot',
              component: BotsPage
            }),
            h(Route, {
              path: '/bots',
              component: BotsPage
            }),
            h(Route, {
              path: '/history',
              component: HistoryPage
            }),
            h(Route, {
              path: '/queue',
              component: QueuePage
            }),
            h(Route, {
              path: '/about',
              component: AboutPage
            }),
            h(Route, {
              path: '/visualizer',
              component: VisualizerPage
            })
          ])
        ])
      ])
    );
  }
}
