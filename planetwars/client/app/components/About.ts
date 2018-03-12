import * as React from 'react';
import { button, div, h, p } from 'react-hyperscript-helpers';

interface IProps {
  counter: number;
  onIncrement: () => void;
}

interface IState { }

export default class About extends React.Component<IProps, IState> {
  public render() {
    return div([
      p([this.props.counter]),
      button({ onClick: () => this.props.onIncrement() }, ['+1']),
    ]);
  }
}
