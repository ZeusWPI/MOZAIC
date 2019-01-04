import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { createSelector } from 'reselect';

import * as M from '../../database/models';
import * as Comp from './types';

import { GState } from '../../reducers/index';
import Matches, {
  MatchViewerStateProps,
  MatchViewerDispatchProps,
} from './Matches';

const matchesSelector = (state: GState) => state.matches;
const mapsSelector = (state: GState) => state.maps;

const matchListSelector = createSelector(
  matchesSelector,
  mapsSelector,
  (matches, maps) => {
    const matchData = {};
    const matchList = Object.keys(matches).map((matchId) => {
      const match = matches[matchId];
      return getMatchData(match, maps);
    });

    matchList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return matchList;
  },
);

function mapStateToProps(state: GState, ownProps: any): MatchViewerStateProps {
  return {
    matches: matchListSelector(state),
    selectedMatch: ownProps.match.params.matchId,
  };
}

function mapDispatchToProps(dispatch: any): MatchViewerDispatchProps {
  return {
    selectMatch: (matchId: string) => {
      dispatch(push(`/matches/${matchId}`));
    },
  };
}

const getMatchData = (match: M.Match, maps: M.MapList): Comp.Match => {
  const matchData = match;

  if (matchData.type === M.MatchType.hosted) {
    const players = matchData.players.map(({ name }, idx) => (
      { name, number: idx + 1 }
    ));
    const mapData = maps[matchData.map];
    const map = { uuid: mapData.uuid, name: mapData.name };
    const { network, maxTurns, ...props } = matchData;
    return {
      ...props,
      players,
      map,
    };
  } else {
    const { network, bot, ...props } = matchData;
    const players = [{
      name: bot.name,
      number: 1,
    }];
    return {
      ...props,
      players,
    };
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Matches);
