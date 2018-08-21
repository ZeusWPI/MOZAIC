import * as React from 'react';

export interface HelloWorldProps extends React.Props<HelloWorld> {
  color: string;
}

export class HelloWorld extends React.Component<HelloWorldProps, any> {
  render() {
    return (
      <div style={{ color: this.props.color }}>
        Hello worlders!
      </div>
    );
  }
}