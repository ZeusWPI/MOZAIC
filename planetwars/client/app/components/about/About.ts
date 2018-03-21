import * as React from 'react';
import { button, div, h, p } from 'react-hyperscript-helpers';

interface IProps {
}

interface IState { }

export default class About extends React.Component<IProps, IState> {
  public render() {
    return div([
      p('this is the about page'),
    ]);
  }
}
