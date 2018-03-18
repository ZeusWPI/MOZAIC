import { Component } from 'react';
import { Visualizer } from '../visualizer';
import { IMatchMetaData } from '../../utils/GameModels';
import { div, h } from 'react-hyperscript-helpers';
import { MatchParser } from '../../utils/MatchParser';


export interface MatchViewProps {
    match: IMatchMetaData,
}

export class MatchView extends Component<MatchViewProps> {
    
  public render() {
    if (this.props.match.logPath) {
      const log = MatchParser.parseFileSync(this.props.match.logPath);
      console.log(this.props.match);
      return h(Visualizer, {
        playerData: {
          players: log.meta.players,
        },
        gameLog: log.log,
      });
    }
  }
}
  

export default MatchView;