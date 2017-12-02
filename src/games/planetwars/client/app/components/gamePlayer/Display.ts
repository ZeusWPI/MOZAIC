import { EventEmitter } from 'events';
import { Readable } from 'stream';

import * as React from 'react';
import { h, div, p } from 'react-hyperscript-helpers';

const styles = require('./Display.scss');

interface Props { 
  stdout: Readable,
  stderr: Readable,
};

interface State { };

export class Display extends React.Component<Props, State> {
  render() {
    return div(`.${styles.display}`, [
      h(StreamField, { stream: this.props.stdout, type: 'stdout' }),
      h(StreamField, { stream: this.props.stderr, type: 'stderr' }),
    ]);
  }
}

type StreamType = 'stderr' | 'stdout';

interface SFProps {
  stream: Readable,
  type: string,
};
interface SFState {
  stream: Readable,
  data: string,
};

export class StreamField extends React.Component<SFProps, SFState> {

  constructor(props: SFProps) {
    super(props);
    let description = (this.props.type == 'stderr') ? 'Stderr' : 'Stdout';
    description += ":\n";
    this.state = {
      stream: props.stream,
      data: description
    }
    this.state.stream.addListener('data', (chunk) => {
      this.setState({
        data: this.state.data + chunk
      });
    });
  }

  render() {
    let type = (this.props.type == 'stderr') ? styles.stderr : styles.stdout;
    return div(`.${type}.${styles.streamField}`, [
      p(`${this.state.data}`),
    ]);
  }
}