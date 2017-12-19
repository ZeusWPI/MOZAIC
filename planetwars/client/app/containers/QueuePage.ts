import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

import Queue from "../components/Queue"

interface QueuePageProps {

}

interface QueuePageState {

}


export default class QueuePage extends React.Component<QueuePageProps, QueuePageState> {
  render() {
    return (
      h(Queue)
    );
  }
}
