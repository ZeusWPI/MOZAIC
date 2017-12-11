import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';


export class BotsPage extends React.Component<RouteComponentProps<any>, void> {
  render() {
    return (
      h("div", ["Here be bots page"])
    );
  }
}

export default (BotsPage as any as React.StatelessComponent<RouteComponentProps<any>>);
