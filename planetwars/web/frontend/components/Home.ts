import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as FA from 'react-fontawesome';
import { Link } from 'react-router-dom';
import { h, h1, h2, div, section, img, p, span, hr, h3 } from 'react-hyperscript-helpers';
import { Hero, HeroBody, HeroFooter, HeroHeader, Container, Button } from 'bloomer';

import Navbar from './Navbar';
import Footer from './Footer';

require('../static/small_logo_trans.png');

export default class Home extends React.Component<{}, {}> {
  render() {
    return [
      h(Navbar),
      h(Hero, '.push', { isColor: 'primary'}, [
        h(HeroBody, [
          h(Container, '#home-hero-body', { hasTextAlign: 'centered' }, [
            h(Teaser),
            // h(Logo),
            h(CodePlayWin),
            h(Intro),
            h(GetStartedButton),
            h(UpcomingEvents),
          ])
        ])
      ]),
      h(Footer)
    ]
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
    Code an AI, download the game, and let your bot battle it out against your friend and rivals.
    Experiment with the hottest techniques from the comfort of your local environment.
    Tune, tweak, and tinker, and before you know you'll be on top of the leaderboard. Get ready player one!
  `]);
}

const Teaser: React.SFC<{}> = (props) => {
  return div('#title', [
    h1('.title.is-size-2', ['BottleBats ', span('#title2k', ['2.018']), '']),
    h2('.subtitle.is-size-4', ['Coming this spring!']),
  ]);
}

const CodePlayWin: React.SFC<{}> = (props) => {
  return div('#code-play-win', [
    h(LinkItem, {to: '/code', item: h(CPWItem, { name: 'code', text: 'Code'} )}),
    h(LinkItem, {to: '/play', item: h(CPWItem, { name: 'rocket', text: 'Play'} )}),
    h(LinkItem, {to: '/win', item: h(CPWItem, { name: 'trophy', text: 'Win'} )}),
  ]);
}

const UpcomingEvents: React.SFC<{}> = (props) => {
  return div('#events', [
    h2('.subtitle.is-size-4', ['Coming events']),
    hr(),
    h(LinkItem, {to: '/26-03', item: 
      h(Event, {title: "introduction", date: "26 March", item: h2('.event-item', ['test'])})
    }),
  ]);
}

interface EventProps { date: string, item: React.ReactElement<any>, title: string }
const Event: React.SFC<EventProps> = (props) => {
  return div('.event', [
    div('.event-header', [
      h2('.subtitle.is-size-3 .event-title', [props.title]),
      h2('.subtitle.is-size-5', [props.date]),
    ]),
    props.item,
  ]);
}

interface LinkItemProps { to: string, item: React.ReactElement<any> }
const LinkItem: React.SFC<LinkItemProps> = (props) => {
  return h(Link, 
    {to: props.to,},
    [props.item],
  );
}

interface ICPWItemProps { name: string, text: string }
const CPWItem: React.SFC<ICPWItemProps> = (props) => {
  return div('.cpw-item.grow', [
    // TS complains about the size type while it shouldn't
    h(FA, <any> {name: props.name, fixedWidth: true }),
    p([props.text]),
  ]);
}

const GetStartedButton: React.SFC<{}> = (props) => {
  return h(Link, 
    '.button.is-inverted.is-large.is-link.is-outlined.is-primary', 
    {to: '/info',},
    ['Learn more!']
  );
}