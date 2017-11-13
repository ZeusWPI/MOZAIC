import * as React from 'react';
import { h, div } from 'react-hyperscript-helpers';


export default class App extends React.Component {
  render() {
    return (
      div([this.props.children])
    );
  }
}
