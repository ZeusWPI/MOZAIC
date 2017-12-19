import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

import Bots from "../components/Bots"

interface BotsPageProps {
  match: any
}

interface BotsPageState {

}

export default class BotsPage extends React.Component<BotsPageProps, BotsPageState> {
  constructor(props: BotsPageProps) {
    super(props);
  }
  render() {
    return (
      h(Bots, { bot: this.props.match.params.bot })
    );
  }
}
