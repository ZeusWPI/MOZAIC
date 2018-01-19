import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { h, h1, h2, div, section } from 'react-hyperscript-helpers';

export default class Home extends React.Component<{}, {}> {
  render() {
    return div([
      section('.hero .is-primary', [
        div('.hero-body', [
          div('.containter', [
            h1('.title', ["Hello World!"]),
            h2('.subtitle', ["BattleBots 2018 is coming!"])
          ])
        ])
      ])
    ])
  }
}
