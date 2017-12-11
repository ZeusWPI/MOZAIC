import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

interface BotsConfigProps {
  botName:string
}

interface BotsConfigState {
  name:string,
  cmd:string,
}

export default class BotsConfig extends React.Component<BotsConfigProps, BotsConfigState> {
  constructor(props:BotsConfigProps) {
    super(props)
  }
  render() {
    return (
      h("div", [this.props.botName])
    );
  }
}
