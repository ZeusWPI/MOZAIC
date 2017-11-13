import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

import Home from '../components/Home';


export class HomePage extends React.Component<RouteComponentProps<any>, void> {
  render() {
    return (
      h(Home)
    );
  }
}

export default (HomePage as any as React.StatelessComponent<RouteComponentProps<any>>);
