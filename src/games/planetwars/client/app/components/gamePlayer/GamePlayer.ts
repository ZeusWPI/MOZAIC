import * as path from 'path';
import * as cp from 'child_process';
import { Readable } from 'stream';

import * as React from 'react';
import { h, div, button } from 'react-hyperscript-helpers';

import { Display } from './Display';
import { ReactChild } from 'react';
const styles = require('./GamePlayer.scss');

interface Props {
  configPath?: path.ParsedPath,
  callback: Function,
};

interface State { 
  playing: boolean,
  stderr?: Readable,
  stdout?: Readable
};

export class GamePlayer extends React.Component<Props, State> {

  constructor(props: Props){
    super(props);
    this.state = {
      playing: false,
    }
  }

  render() {
    return div(`.${styles.gamePlayer}`, [this.getChild()])
  }

  getChild(): ReactChild {
    if(this.props.configPath) {
      if(this.state.playing) {
        return h(Display, {
          stdout: <Readable> this.state.stdout,
          stderr: <Readable> this.state.stderr,
        });
      } else {
        return h(PlayButton, { onClick: () => this.play() })
      }
    } else {
      return div('load config first!');
    }
  }

  play(){
    // TODO: this logic should not be in the display code.
    // the proper way to go about this would probably be a redux middleware.
    let p = <path.ParsedPath> this.props.configPath;
    let execPath = path.resolve('bin', 'bot_driver');
    console.log(execPath);
    let child = cp.spawn(execPath, [path.format(p)]);
    child.on('close', (code) => {
      if(code) {
        alert(`child process exited with code ${code}`);
      } else {
        this.props.callback();
      }
    });
    this.setState({ 
      playing: true ,
      stderr: child.stderr,
      stdout: child.stdout
    })
  }
}

interface PBProps {
  onClick(): void
};
interface PBState {};
export class PlayButton extends React.Component<PBProps, PBState> {
  render(){
    return button(`.button.${styles.playButton}`, {
      onClick: () => this.props.onClick()
    }, 'Play!')
  }
}
