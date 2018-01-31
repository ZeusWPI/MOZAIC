import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { h, div, p } from 'react-hyperscript-helpers';
import NavBar from './Navbar';
import Footer from './Footer';

export default class Info extends React.Component<{}, {}> {
  render() {
    return [
      h(NavBar),
      div([p('Info')]),
      h(Footer),
    ]
  }
}
