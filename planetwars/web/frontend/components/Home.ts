import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { h, h1, h2, div, section } from 'react-hyperscript-helpers';
import { Hero, HeroBody, HeroFooter, HeroHeader, Container } from 'bloomer';

import Navbar from './Navbar';
import Footer from './Footer';

export default class Home extends React.Component<{}, {}> {
  render() {
    return h(Hero, { isColor: 'primary', isFullHeight: true }, [
      h(HeroHeader, [h(Navbar)]),
      h(HeroBody, [
        h(Container, { hasTextAlign: 'centered' }, [
          h1('.title', ['BottleBats 2.018']),
          h2('.subtitle', ['Coming this spring']),
        ])
      ]),
      h(HeroFooter, [h(Footer)]),
    ])
  }
}
