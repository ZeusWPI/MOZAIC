import * as React from 'react';

import * as Log from 'planetwars-match-log';

import { Visualizer } from '../src/index';

export interface LogManagerState {
  log: Log.MatchLog
}

export class LogManager extends React.Component<{}, LogManagerState> {
  state = { log: undefined }
  render() {
    const button = <FileUploadButton id="log-upload" onLoad={this.onLoad.bind(this)} />;
    if (this.state.log) {
      return (
        <div>
          <Visualizer
            playerName={this.playerNames.bind(this)}
            matchLog={this.state.log} />
          {button}
        </div>
      );
    } else {
      return (
        <div>
          {button}
        </div>
      );
    }
  }

  private onLoad(content: string) {
    console.log(content);
    const log = Log.parseLog(content, Log.MatchType.hosted);
    this.setState({ log });
  }

  private playerNames(playerNum: number): string {
    return `Player ${playerNum}`;
  }
}

export interface FileUploadButtonProps {
  id: string;
  onLoad: (content: string) => void;
}

export class FileUploadButton extends React.Component<FileUploadButtonProps> {
  public render() {
    return (
      <div>
        <label htmlFor={this.props.id} className="custom-file-upload">
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