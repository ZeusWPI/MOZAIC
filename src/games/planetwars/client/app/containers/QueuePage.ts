import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

export class QueuePage extends React.Component<RouteComponentProps<any>, void> {
  render() {
    return (
      h("div", ["Here be queue page"])
    );
  }
}

export default (QueuePage as any as React.StatelessComponent<RouteComponentProps<any>>);
