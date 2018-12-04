import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { h, div, p, Children, span, strong, br, a } from 'react-hyperscript-helpers';

import Navbar from './Navbar';
import Footer from './Footer';
import { Section, Hero, HeroBody, Container, Tile, Box } from 'bloomer';

export default class Info extends React.Component<{}, {}> {
    render() {
        return [
          h(Navbar),
          h(Hero, '.push', { isColor: 'primary'}, [
            h(HeroBody, [
              h(Container, '#home-hero-body', { hasTextAlign: 'centered' }, [
                h(MainText),
              ])
            ])
          ]),
          h(Footer)
        ]
      }
}

const MainText: React.SFC<{}> = (props) => {
    return p('#intro-text', [`
        To play bottle bats, it's really easy, it only has a few steps.
        First you can program an AI, whatever language you prefer, as long as it can read standard input and write to standard output you can create a bot.
        Next you can download the game and set it up, just add you bot, it requires a name and a command to start up your bot.
        You can play against yourself, or against a friend, later there will be a competition to determin who is the best AI bot writer.
        To play against your friend, you can setup a server from within the client, your friend can connect to your server.
        When the game is played, and the winner decided, you can watch the game, this way you can see how stupid your bot is.
    `]);
  }