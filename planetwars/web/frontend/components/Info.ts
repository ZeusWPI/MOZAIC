import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { h, div, p, Children, span, strong, br, a } from 'react-hyperscript-helpers';
import NavBar from './Navbar';
import Footer from './Footer';
import { Section, Hero, HeroBody, Container } from 'bloomer';

export default class Info extends React.Component<{}, {}> {
  render() {
    return [
      h(NavBar),
      div('#info', [
        h(What),
        h(How),
        h(WhereWhen),
        h(Features),
      ]),
      h(Footer),
    ]
  }
}

const What: React.SFC<{}> = (props) => {
  return h(Hero, '.is-primary', [
    h(Container, [
      h(HeroBody, [
        div('.title', ['What?']),
        p('.is-size-5-widescreen', [
          'BottleBats ', span('.t2018', ['2.018']), ' is the second edition of the Zeus WPI AI competition. ',
          'A semester long race to code the best bot and beat your friend to the top. ',
          'This year, we\'ll be playing ', a({href: ''}, 'PlanetWars'), ' a simple space-themed game, originally made popular by Google\'s AI competition. ', 
          'There will be an ', strong('online platform'), ' to match your bots, ', strong('live tournaments'), ', ', strong('social tinkering sessions'), ', and ', strong('prizes'), ' to win! ',
          'We\'ll kick-off the competition with an ', strong('intro session'), ' soon, where we will explain the format in detail. ',
          'For now, you\'ll have to do with the info below.',
          br(),
          '(PS: We have Intel sponsorship for prizes \'n shit)', 
        ]),
      ])
    ]),
  ]);
}

const How: React.SFC<{}> = (props) => {
  return h(Hero, '.is-primary', [
    h(Container, [
      h(HeroBody, [
        div('.title', ['How?']),
        p('.is-size-5-widescreen', [
          'We will distribute game-clients that, like any old game, will handle all the communication with the server. ',
          'This implies you will be able to run your bot on your ', strong('own PC'), '! ',
          'You choose your environment, your language, debugger, etc..., and no hassle uploading zipped source all the time. ',
          'To enable this, you\'ll only have to provide us with the command to start your bot up. ',
          'Every turn your bot will receive the JSON-encoded game state from us trough stdin, ',
          'and every turn your bot should answer with it\'s JSON-encoded commands. ',
          'Your output is sent to the server, just like those of your adversaries, and the game advances a turn.',
          'You\'ll be able to do interesting strategic analysis with the visuals and metrics we provide afterwards, and we\'ll keep a raking of the best participating bots.'
        ]),
      ])
    ]),
  ]);
}

const WhereWhen: React.SFC<{}> = (props) => {
  return h(Hero, '.is-primary', [
    h(Container, [
      h(HeroBody, [
        div('.title', ['Where?']),
        p('.is-size-5-widescreen', [
          'On the internet! From the comfort of your own. ',
          'But we\'ll also do live tournaments and theory-crafting sessions in the Zeus kelder, or other yet to specify locations.',
          'When? No fixed dates yet. Assume end februari, begin march.'
        ]),
      ])
    ]),
  ]);
}

const Features: React.SFC<{}> = props => {
  return h('div', ['test']);
}