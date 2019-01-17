import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { h, div, p, Children, span, strong, br, a } from 'react-hyperscript-helpers';
import NavBar from './Navbar';
import Footer from './Footer';
import { Section, Hero, HeroBody, Container, Tile, Box } from 'bloomer';

export default class Info extends React.Component<{}, {}> {
  render() {
    return [
      h(NavBar),
      div('#info', [
        p("here is some info about the code"),
      ]),
      h(Footer),
    ]
  }
}