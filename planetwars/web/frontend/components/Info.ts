import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { h, div, p } from 'react-hyperscript-helpers';

export default class Info extends React.Component<{}, {}> {
  render() {
    return div([
      p('Info')
    ])
  }
}
