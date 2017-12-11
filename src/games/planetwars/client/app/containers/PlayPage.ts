import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

export class PlayPage extends React.Component<RouteComponentProps<any>, void> {
  render() {
    return (
      h("div", ["Here be play page"])
    );
  }
}

export default (PlayPage as any as React.StatelessComponent<RouteComponentProps<any>>);
