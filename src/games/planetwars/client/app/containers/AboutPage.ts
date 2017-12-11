import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

export class AboutPage extends React.Component<RouteComponentProps<any>, void> {
  render() {
    return (
      h("div", ["Here be about page"])
    );
  }
}

export default (AboutPage as any as React.StatelessComponent<RouteComponentProps<any>>);
