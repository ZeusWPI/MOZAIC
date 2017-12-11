import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

import Bots from "../components/Bots"

export class BotsPage extends React.Component<RouteComponentProps<any>, void> {
  render() {
    return (
      h(Bots)
    );
  }
}

export default (BotsPage as any as React.StatelessComponent<RouteComponentProps<any>>);
