import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as FA from 'react-fontawesome';
import { Link } from 'react-router-dom';
import { h, h1, h2, div, section, img, p } from 'react-hyperscript-helpers';
import { Hero, HeroBody, HeroFooter, HeroHeader, Container, Button } from 'bloomer';

import Navbar from './Navbar';
import Footer from './Footer';

require('../static/small_logo_trans.png');

export default class Home extends React.Component<{}, {}> {
  render() {
    return h(Hero, { isColor: 'primary', isFullHeight: true }, [
      h(HeroHeader, [h(Navbar)]),
      h(HeroBody, [
        h(Container, '#home-hero-body', { hasTextAlign: 'centered' }, [
          h(Teaser),
          // h(Logo),
          h(CodePlayWin),
          h(Intro),
          h(GetStartedButton),
        ])
      ]),
      h(HeroFooter, [h(Footer)]),
    ])
  }
}

const Logo: React.SFC<{}> = (props) => {
  return img({
    src:'./static/small_logo_trans.png',
    alt: 'BottleBats 2018 AI Competition',
  });
}

const Intro: React.SFC<{}> = (props) => {
  return p('#intro-text', [`
    Compete with your friends and rivals to create the smartest AI. 
    Build your bot and let it battle in this epic space themed game.
    Experiment with complex strategies; tweak, tune and perfect,
    and before you know, you'll be on top of the leaderboard.
  `]);
}

const Teaser: React.SFC<{}> = (props) => {
  return div([
    h1('.title.is-size-1', ['BottleBats 2.018']),
    h2('.subtitle.is-size-3', ['Coming this spring!']),
  ]);
}

const CodePlayWin: React.SFC<{}> = (props) => {
  return div('#code-play-win', [
    h(CPWItem, { name: 'code', text: 'Code'} ),
    h(CPWItem, { name: 'rocket', text: 'Play'}),
    h(CPWItem, { name: 'trophy', text: 'Win'})
  ]);
}

interface ICPWItemProps { name: string, text: string }
const CPWItem: React.SFC<ICPWItemProps> = (props) => {
  return div('.cpw-item', [
    // TS complains about the size type while it shouldn't
    h(FA, <any> {name: props.name}),
    p([props.text]),
  ]);
}

const GetStartedButton: React.SFC<{}> = (props) => {
  return h(Link, 
    '.button.is-inverted.is-large.is-link.is-outlined.is-primary', 
    {to: '/downloads',},
    ['Get started!']
  );
}