import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { h, h1 } from 'react-hyperscript-helpers';

export default class Home extends React.Component<any, any> {
  render() {
    return h1("Hello World!");
  }
}
