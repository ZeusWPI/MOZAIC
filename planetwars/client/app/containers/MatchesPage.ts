import * as fs from 'mz/fs';
import * as p from 'path';
import * as Promise from 'bluebird';
import { connect } from 'react-redux';

import Matches, { IMatchViewerProps, Match } from '../components/matches/Matches';
import { IGState } from '../reducers/index';
import { Config } from '../utils/Config';
import { parseLogFile } from '../utils/MatchParser';
import * as A from '../actions/actions';
import { PathLike } from 'mz/fs';

const mapStateToProps = (state: IGState, ownProps: any) => {
  const matches = Object.keys(state.matches).map((matchId) => {
    let matchData = state.matches[matchId];
    let mapData = state.maps[matchData.map];
    return {
      uuid: matchId,
      players: matchData.players.map((botId) => {
        const bot = state.bots[botId];
        return {
          uuid: botId,
          name: bot.config.name,
        };
      }),
      map: {
        uuid: mapData.uuid,
        name: mapData.name,
      },
      timestamp: matchData.timestamp,
      logPath: matchData.logPath,
    };
  });
  return { matches };
};

const mapDispatchToProps = (dispatch: any) => {
};

export default connect<IMatchViewerProps>(mapStateToProps)(Matches);