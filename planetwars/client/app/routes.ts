import * as React from 'react';
import { Switch, Route } from 'react-router';
import { Link } from "react-router-dom"
import App from './containers/App';
import HomePage from './containers/HomePage';
import PlayPage from './containers/PlayPage';
import BotsPage from './containers/BotsPage';
import QueuePage from './containers/QueuePage';
import HistoryPage from './containers/HistoryPage';
import AboutPage from './containers/AboutPage';
import { h, ul, li } from 'react-hyperscript-helpers';

let styles = require('./routes.scss');

export default () => (
    h(App, `.${styles.root}`, [
      ul(`.${styles.navbar}`, [
        li(`.${styles.navbarelement}`, [h(Link, `.${styles.navbarlink}`, { to:"/home" }, ["Home"])]),
        li(`.${styles.navbarelement}`, [h(Link, `.${styles.navbarlink}`, { to:"/bots" }, ["Bots"])]),
        li(`.${styles.navbarelement}`, [h(Link, `.${styles.navbarlink}`, { to:"/play" }, ["Play"])]),
        li(`.${styles.navbarelement}`, [h(Link, `.${styles.navbarlink}`, { to:"/queue" }, ["Queue"])]),
        li(`.${styles.navbarelement}`, [h(Link, `.${styles.navbarlink}`, { to:"/history" }, ["Game History"])]),
        li(`.${styles.navbarelement}`, [h(Link, `.${styles.navbarlink}`, { to:"/about" }, ["About"])])
      ]),
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
        })
      ])
    ])
  );
