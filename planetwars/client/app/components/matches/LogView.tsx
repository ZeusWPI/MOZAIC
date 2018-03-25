import * as React from 'react';
import { MatchLog } from '../../lib/match/log/';

// tslint:disable-next-line:no-var-requires
const styles = require("./LogView.scss");

interface LogViewProps {
  matchLog: MatchLog;
}

export class LogView extends React.Component<LogViewProps> {
  public render() {
    return null;
  }
}

export default LogView;
