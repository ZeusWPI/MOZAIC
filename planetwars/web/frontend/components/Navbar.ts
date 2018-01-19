import * as React from 'react';
import { h, h1, div, Children } from 'react-hyperscript-helpers';
import { Navbar, NavbarBrand, NavbarMenu, NavbarStart,
         NavbarItem, Container} from 'bloomer';
import { Link, NavLink, NavLinkProps } from 'react-router-dom';
import { NavbarEnd } from 'bloomer/lib/components/Navbar/NavbarEnd';

export default class NavBar extends React.Component<{}, {}> {
  render() {
    return h(Navbar, '.is-primary', [
      h(Container, [
        h(Link, `.navbar-brand`, {to: '/'}, [
          h1(`.is-size-3`, 'BottleBats')
        ]),
        h(NavbarMenu, [
          h(NavbarStart, [
            CNavLink({to: '/downloads'}, ['Downloads']),
            CNavLink({to: '/rankings'}, ['Rankings']),
          ]),
          h(NavbarEnd, [
            CNavLink({to: '/sign-up'}, ["Sign up"])
          ])
        ])
      ])
    ])
  }
}

const CNavLink = (props: NavLinkProps, children: Children) => {
  props.activeClassName = 'is-active';
  return h(NavLink, `.navbar-item`, props, children)
}