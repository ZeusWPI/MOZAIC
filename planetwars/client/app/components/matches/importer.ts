// TODO: do we still need this?
// If so, find a proper location for it.
import * as React from 'react';
import { div, h, li, span, ul, p, button, input, form, label } from 'react-hyperscript-helpers';
const styles = require('./Matches.scss');

type LogLoader = (string) => void;

// TODO: Support loading multiple files
export class MatchImporter extends React.Component<{ loadLogs: LogLoader }> {
    private fileInput: FileList;
  
    public render() {
      return form(`.${styles.matchImporter}`,
        { onSubmit: (evt: any) => this.handleSubmit(evt) },
        [
          label(['Import Match(es)']),
          input({
            type: 'file',
            multiple: true,
            onChange: (evt: any) => this.handleChange(evt),
          }),
          button({ type: 'submit' }, ['Import']),
        ]
      );
    }
  
    private handleChange(evt: any): void {
      this.fileInput = evt.target.files;
    }
  
    private handleSubmit(event: any) {
      this.props.loadLogs(this.fileInput);
    }
  }