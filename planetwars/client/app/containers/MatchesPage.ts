import * as fs from 'mz/fs';
import * as p from 'path';
import * as Promise from 'bluebird';
import { connect } from 'react-redux';

import Matches, { IMatchViewerProps } from '../components/matches/Matches';
import { IGState } from '../reducers/index';
import { Config } from '../utils/Config';
import { parseLogFile } from '../utils/MatchParser';
import * as A from '../actions/actions';
import { Match, MatchId } from '../utils/GameModels';
import { PathLike } from 'mz/fs';

interface IProps {
  match: any; // Note: this is a match as in the regex sense (from the url)
}

const mapStateToProps = (state: IGState, ownProps: any) => {
  const matches = state.matches;
  const importError = state.matchesPage.importError;
  const uuid: MatchId | undefined = ownProps.match.params.bot;
  return {
    matches: Object.keys(matches).map(id => matches[id]),
  };
};

const mapDispatchToProps = (dispatch: any) => {
};

export default connect<IMatchViewerProps>(mapStateToProps)(Matches);