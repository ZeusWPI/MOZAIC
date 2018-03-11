import * as fs from 'mz/fs';
import * as p from 'path';
import * as Promise from 'bluebird';
import { connect } from 'react-redux';

import Matches from '../components/matches/Matches';
import { IGState } from '../reducers/index';
import { Config } from '../utils/Config';
import { MatchParser } from '../utils/MatchParser';
import * as A from '../actions/actions';

const mapStateToProps = (state: IGState) => {
  const matches = state.matchesPage.matches.map((match, id) => ({ id, match }));
  const importError = state.matchesPage.importError;
  return {
    expandedGameId: 1,
    matches,
    importError,
  };
};

// TODO: Copy matchlog
const mapDispatchToProps = (dispatch: any) => {
  return {
    loadLog: (log: any): void => {
      MatchParser.parseFileAsync(log.path)
        .then(
          (match) => dispatch(A.importMatchMeta(match)),
          (err) => dispatch(A.matchImportError(err.message)),
      );
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Matches);
