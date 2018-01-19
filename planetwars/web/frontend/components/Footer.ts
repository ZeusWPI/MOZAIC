import * as React from 'react';
import { h, h1 } from 'react-hyperscript-helpers';
import { Navbar, NavbarBrand, NavbarMenu, NavbarStart,
         NavbarItem } from 'bloomer';
import { Link } from 'react-router-dom';

export default class Footer extends React.Component<{}, {}> {
  render() {
    return h(Navbar, [
      h(NavbarBrand, [
        h(NavbarItem, [h1(`.is-size-3`, 'BottleBats')])
      ]),
      h(NavbarMenu, [
        h(NavbarStart, [
          h(NavbarItem, [h(Link, {to: '/'}, ['Home'])]),
          h(NavbarItem, [h(Link, {to: '/downloads'}, ['Downloads'])]),
          h(NavbarItem, [h(Link, {to: '/rankings'}, ['Rankings'])])
        ])
      ])
    ])
  }
}
