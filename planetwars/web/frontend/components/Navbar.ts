import * as React from 'react';
import { h, h1, div, Children, img, span } from 'react-hyperscript-helpers';
import { Navbar, NavbarBrand, NavbarMenu, NavbarStart,
         NavbarItem, NavbarEnd, Container} from 'bloomer';
import { Link, NavLink, NavLinkProps } from 'react-router-dom';
import { NavbarBurger } from 'bloomer/lib/components/Navbar/NavbarBurger';

require('../static/small_logo_trans.png');

export default class NavBar extends React.Component<{}, {}> {
  render() {
    return h(Navbar, '.is-primary', [
      h(Container, [
        h(NavbarBrand, [
          h(Link, `.navbar-brand`, {to: '/'}, [
            img('#navbar-logo', {
              src:'./static/small_logo_trans.png',
              alt: 'BottleBats 2018 AI Competition',
            }),
          ]),
          h(NavbarBurger)
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