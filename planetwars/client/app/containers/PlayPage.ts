import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

import Play from "../components/Play"

interface PlayPageProps {

}

interface PlayPageState {

}

export default class PlayPage extends React.Component<PlayPageProps, PlayPageState> {
  render() {
    return (
      h(Play)
    );
  }
}
