import * as fs from 'mz/fs';
import * as p from 'path';
import * as Promise from 'bluebird';
import { connect, Dispatch } from 'react-redux';
import { push } from 'react-router-redux';

import Matches, {
  MatchViewerStateProps,
  MatchViewerDispatchProps,
} from '../components/matches/Matches';
import * as Comp from '../components/matches/types';
import { GState } from '../reducers/index';
import { Config } from '../utils/Config';
import * as A from '../actions/index';
import * as M from '../utils/database/models';
import { PathLike } from 'mz/fs';

function mapStateToProps(state: GState, ownProps: any): MatchViewerStateProps {
  const matches = Object.keys(state.matches).map((matchId) => {
    return getMatchData(state, matchId);
  });

  // Sort descending on time
  matches.sort((a, b) => (b.timestamp.getTime() - a.timestamp.getTime()));

  const selectedId: string | undefined = ownProps.match.params.matchId;
  if (selectedId && state.matches[selectedId]) {
    const selectedMatch = getMatchData(state, selectedId);
    return { matches, selectedMatch };
  } else {
    return { matches };
  }
}

function mapDispatchToProps(dispatch: any): MatchViewerDispatchProps {
  return {
    selectMatch: (matchId: string) => {
      dispatch(push(`/matches/${matchId}`));
    },
  };
}

const getMatchData = (state: GState, matchId: M.MatchId): Comp.Match => {
  const matchData = state.matches[matchId];

  if (matchData.type === M.MatchType.hosted) {
    const players = matchData.players.map(({ name, token }) => ({ name, token }));
    const mapData = state.maps[matchData.map];
    const map = { uuid: mapData.uuid, name: mapData.name };
    const { network, maxTurns, ...props } = matchData;
    return { ...props, players, map };
  } else {
    const { network, ...props } = matchData;
    return { ...props };
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Matches);
