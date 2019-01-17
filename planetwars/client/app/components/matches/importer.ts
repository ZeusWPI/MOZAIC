// TODO: do we still need this?
// If so, find a proper location for it.
import * as React from 'react';
import * as h from 'react-hyperscript';

type LogLoader = (files: FileList) => void;

// TODO: Support loading multiple files
export class MatchImporter extends React.Component<{ loadLogs: LogLoader }> {
  private fileInput!: FileList;

  public render() {
    return h(`form`,
      { onSubmit: (evt: any) => this.handleSubmit(evt) },
      [
        h('label', ['Import Match(es)']),
        h('input', {
          type: 'file',
          multiple: true,
          onChange: (evt: any) => this.handleChange(evt),
        }),
        h('button', { type: 'submit' }, ['Import']),
      ],
    );
  }

  private handleChange(evt: any): void {
    this.fileInput = evt.target.files;
  }

  private handleSubmit(event: any) {
    this.props.loadLogs(this.fileInput);
  }
}
