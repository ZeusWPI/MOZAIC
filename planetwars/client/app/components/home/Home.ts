import * as React from 'react';
import * as h from 'react-hyperscript';

export default class Home extends React.Component<{}, {}> {
  public render() {
    return h('div', ["Here be Home page"]);
  }
}
