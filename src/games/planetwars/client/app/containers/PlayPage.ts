import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

import Play from "../components/Play"

export class PlayPage extends React.Component<RouteComponentProps<any>, void> {
  render() {
    return (
      h(Play)
    );
  }
}

export default (PlayPage as any as React.StatelessComponent<RouteComponentProps<any>>);
