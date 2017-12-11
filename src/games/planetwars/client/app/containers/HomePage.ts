import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

export class HomePage extends React.Component<RouteComponentProps<any>, void> {
  render() {
    return (
      h("div", ["Here be home page"])
    );
  }
}

export default (HomePage as any as React.StatelessComponent<RouteComponentProps<any>>);
