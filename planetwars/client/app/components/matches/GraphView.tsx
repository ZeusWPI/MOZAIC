import * as React from 'react';
import { Component } from 'react';
import { MatchLog } from '../../lib/match/log';

interface GraphViewProps {
  matchLog: MatchLog;
}

export class GraphView extends Component<GraphViewProps> {
  public render() {
    return <p>Hai timp</p>;
  }
}
