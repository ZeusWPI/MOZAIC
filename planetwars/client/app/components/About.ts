import * as React from 'react';
import { h, div, p, button } from 'react-hyperscript-helpers'

interface IProps {
  counter: number;
  onIncrement: () => void;
}

interface IState {};

export default class About extends React.Component<any, IState>{
  render() {
    return div([
      p([this.props.counter]),
      button({onClick: () =>this.props.onIncrement() }, ['+1'])
    ])
  }
}
