import * as React from 'react';
import { Component } from 'react';
import { render } from 'react-dom';

import * as Log from 'planetwars-match-log';

import { Visualizer } from '../src/index';

import './main.global.scss';

function main() {
  render(<Main />, document.getElementById('root'));
}

export class Main extends Component<{}, { log: Log.MatchLog }> {
  state = { log: undefined }

  public render() {
    const onLoad = this.onLoad.bind(this);
    const { log } = this.state;

    return (
      <div className="main">
        <FileUploadButton id="log-upload" {...{ onLoad }} />
        <div className="visualizer-container">
          <VisualizerWrapper {...{ log }} />
        </div>
      </div>
    );
  }

  private onLoad(content: string) {
    const log = Log.parseLog(content, Log.MatchType.hosted);
    this.setState({ log });
  }
}

export class VisualizerWrapper extends Component<{ log?: Log.MatchLog }> {
  public render() {
    const matchLog = this.props.log;
    const playerName = (playerNum: number) => `Player ${playerNum}`;
    const content = (matchLog)
      ? <Visualizer {...{ playerName, matchLog }} />
      : <NoLog />;
    return <div className="visualizer-wrapper">{content}</div>;
  }
}


export class NoLog extends Component {
  public render() {
    return (
      <div>
        No log selected.
      </div>
    )
  }
}

export interface FileUploadButtonProps {
  id: string;
  onLoad: (content: string) => void;
}

export class FileUploadButton extends Component<FileUploadButtonProps> {
  public render() {
    return (
      <div className="file-upload-fab">
        <label htmlFor={this.props.id}>
          Upload log
        </label>
        <input type='file'
          id={this.props.id}
          onChange={this.onChange.bind(this)} />
      </div>
    );
  }

  private onChange(evt: Event) {
    const file = (evt.target as HTMLInputElement).files[0];
    var reader = new FileReader();
    reader.onload = (event) => {
      this.props.onLoad((event.target as any).result);
    };
    reader.readAsText(file);
  }
}

main();