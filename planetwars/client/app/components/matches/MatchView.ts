import { Component } from 'react';
import Visualizer from '../visualizer/Visualizer';
import { Match } from './Matches';
import { div, h } from 'react-hyperscript-helpers';
import { parseLogFile } from '../../utils/MatchParser';


export interface MatchViewProps {
    match: Match,
}

export class MatchView extends Component<MatchViewProps> {
    
  public render() {
    if (this.props.match.logPath) {
      const log = parseLogFile(this.props.match.logPath);
      console.log(this.props.match);
      // return h(Visualizer, {
      //   playerData: {
      //     players: log.meta.players,
      //   },
      //   gameLog: log.log,
      // });
      return div('ok');
    }
  }
}
  

export default MatchView;