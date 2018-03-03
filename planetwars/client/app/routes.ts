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
import VisualizerPage from './containers/VisualizerPage';
import { h, ul, li, nav, div, span } from 'react-hyperscript-helpers';

let styles = require('./routes.scss');

interface RoutesProps {

}

interface RoutesState {
  toggled: boolean;
}

export default class Routes extends React.Component<RoutesProps, any> {
  constructor(props: RoutesProps) {
    super(props);
    this.state = {
      toggled: false
    }
  }
  
  toggleMenu () {
    this.setState({ toggled: !this.state.toggled });
  }
  render (){
    return (
      h(App, `.${styles.root}`, [
        nav(`.navbar`, [
          div(`.navbar-burger${this.state.toggled ? '.is-active' : ''}`, { onClick: this.toggleMenu.bind(this) }, [
            span(),
            span(),
            span()
          ]),
          div(`.navbar-menu${this.state.toggled ? '.is-active' : ''}`, [
            div(`.navbar-start`, [
              h(Link, `.navbar-item`, { to:"/home" }, ["Home"]),
              h(Link, `.navbar-item`, { to:"/bots" }, ["Bots"]),
              h(Link, `.navbar-item`, { to:"/play" }, ["Play"]),
              h(Link, `.navbar-item`, { to:"/queue" }, ["Queue"]),
              h(Link, `.navbar-item`, { to:"/history" }, ["Game History"]),
              h(Link, `.navbar-item`, { to:"/about" }, ["About"]),
              h(Link, `.navbar-item`, { to:"/visualizer" }, ["Visualizer"])
            ]),
          ]),
        ]),
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
