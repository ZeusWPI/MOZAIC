import * as React from 'react';
import { h, div } from 'react-hyperscript-helpers';
import NavBar from './components/Navbar';


export default class App extends React.Component {
  render() {
    return (
      div([h(NavBar), this.props.children])
    );
  }
}
