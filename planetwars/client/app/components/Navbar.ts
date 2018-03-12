import { h, nav, div, span, i } from 'react-hyperscript-helpers';
import { Link } from 'react-router-dom';
import * as React from 'react';

import { INotification } from '../utils/UtilModels';

interface INavProps {
  toggled: boolean;
  notifications: INotification[];
  toggle: () => void;
}

export class Navbar extends React.Component<INavProps, {}> {

  public render() {
    const active = this.props.toggled ? '.is-active' : '';
    return nav(`.navbar`, [
      div(`.navbar-burger${active}`,
        {
          onClick: () => this.props.toggle(),
        }, [
          span(),
          span(),
          span(),
        ]),
      div(`.navbar-menu${this.props.toggled ? '.is-active' : ''}`, [
        div(`.navbar-start`, [
          h(Link, `.navbar-item`, { to: "/home" }, ["Home"]),
          h(Link, `.navbar-item`, { to: "/bots" }, ["Bots"]),
          h(Link, `.navbar-item`, { to: "/play" }, ["Play"]),
          h(Link, `.navbar-item`, { to: "/queue" }, ["Queue"]),
          h(Link, `.navbar-item`, { to: "/history" }, ["Game History"]),
          h(Link, `.navbar-item`, { to: "/about" }, ["About"]),
          h(Link, `.navbar-item`, { to: "/visualizer" }, ["Visualizer"]),
        ]),
        div(`.navbar-end`, [
          div(`.navbar-item`, [
            i('.fa.fa-lg.fa-bell.notificationBell', {
              'notification-count': this.props.notifications.length,
              'aria-hidden': true,
            }),
          ]),
        ]),
      ]),
    ]);
  }
}
