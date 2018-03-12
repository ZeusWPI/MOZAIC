import * as fs from 'mz/fs';
import * as p from 'path';
import * as Promise from 'bluebird';
import { connect } from 'react-redux';

import Matches from '../components/matches/Matches';
import { IGState } from '../reducers/index';
import { Config } from '../utils/Config';
import { MatchParser } from '../utils/MatchParser';
import * as A from '../actions/actions';
import { IMatchMetaData, IMatchData } from '../utils/GameModels';

const mapStateToProps = (state: IGState) => {
  const matches = state.matchesPage.matches.map((match, id) => ({ id, match }));
  const importError = state.matchesPage.importError;
  return {
    expandedGameId: 1,
    matches,
    importError,
  };
};

// TODO: Move logic to MatchImporter
const mapDispatchToProps = (dispatch: any) => {
  return {
    loadLog: (log: any): void => {
      MatchParser.parseFileAsync(log.path)
        .then(copyMatchLog)
        .then(
          (match) => dispatch(A.importMatchMeta(match.meta)),
          (err) => dispatch(A.matchImportError(err.message)),
      );
    },
  };
};

function copyMatchLog(match: IMatchData): Promise<IMatchData> {
  const path = Config.generateMatchPath(match.meta);
  const write = fs.writeFile(path, JSON.stringify(match.log));
  return Promise
    .resolve(write)
    .then(() => {
      match.meta.logPath = path;
      return match;
    });
}

export default connect(mapStateToProps, mapDispatchToProps)(Matches);
