import { h, nav, div, span, } from 'react-hyperscript-helpers';
import { Link } from 'react-router-dom';
import * as React from 'react';

interface INavProps {
  toggled: boolean,
  toggle: () => void,
}

export class Navbar extends React.Component<INavProps, {}> {

  render() {
    let active = this.props.toggled ? '.is-active' : '';
    return nav(`.navbar`, [
      div(`.navbar-burger${active}`,
        {
          onClick: () => this.props.toggle()
        }, [
          span(),
          span(),
          span()
        ]),
      div(`.navbar-menu${this.props.toggled ? '.is-active' : ''}`, [
        div(`.navbar-start`, [
          h(Link, `.navbar-item`, { to: "/home" }, ["Home"]),
          h(Link, `.navbar-item`, { to: "/bots" }, ["Bots"]),
          h(Link, `.navbar-item`, { to: "/play" }, ["Play"]),
          h(Link, `.navbar-item`, { to: "/queue" }, ["Queue"]),
          h(Link, `.navbar-item`, { to: "/history" }, ["Game History"]),
          h(Link, `.navbar-item`, { to: "/about" }, ["About"]),
          h(Link, `.navbar-item`, { to: "/visualizer" }, ["Visualizer"])
        ]),
      ]),
    ])
  }
}