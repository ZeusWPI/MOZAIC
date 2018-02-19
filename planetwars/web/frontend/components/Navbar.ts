import * as React from 'react';
import * as FA from 'react-fontawesome';
import { h, h1, div, Children, img, span } from 'react-hyperscript-helpers';
import { Navbar, NavbarBrand, NavbarMenu, NavbarStart,
         NavbarItem, NavbarEnd, Container, NavbarBurger } from 'bloomer';
import { Link, NavLink, NavLinkProps } from 'react-router-dom';

require('../static/small_logo_trans.png');

export default class NavBar extends React.Component<{}, {isActive: boolean }> {
  state = { isActive: false };

  onClickNav = () => {
    this.setState((state) => ({ isActive: !state.isActive }));
  }

  render() {
    return h(Navbar, '.is-primary', [
      h(Container, [
        h(NavbarBrand, [
          h(Link, `.navbar-brand`, {to: '/'}, [
            img('#navbar-logo', {
              src:'./static/small_logo_trans.png',
              alt: 'BottleBats 2018 AI Competition',
            }),
            h(BottleBats)
          ]),
          h(NavbarBurger, {isActive: this.state.isActive, onClick: this.onClickNav})
        ]),
        h(NavbarMenu, {isActive: this.state.isActive, onClick: this.onClickNav}, [
          h(NavbarEnd, [
            CNavLink({to: '/info'}, [
              h(FA, <any> { name:'info-circle', fixedWidth: true, size: '2x' }),
              'Info',
            ]),
            // CNavLink({to: '/signup'}, [
            //   h(FA, <any> { name:'envelope', fixedWidth: true, size: '2x' }),
            //   'Sign up'
            // ])
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

const BottleBats: React.SFC<{}> = (props) => {
  return h1('.title#nav-title.is-hidden-touch', [
    span('BottleBats '),
    span('.t2018', ['2.018']),
  ])
}