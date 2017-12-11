import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

export class HistoryPage extends React.Component<RouteComponentProps<any>, void> {
  render() {
    return (
      h("div", ["Here be history page"])
    );
  }
}

export default (HistoryPage as any as React.StatelessComponent<RouteComponentProps<any>>);
