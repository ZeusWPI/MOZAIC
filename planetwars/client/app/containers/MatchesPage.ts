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

const mapDispatchToProps = (dispatch: any) => {
  return {
    loadLogs: (fileList: FileList): void => {
      const files = Array.from(fileList); // Fuck FileList;
      const imports = files.map((logFile) => {
        const path = (<any> logFile).path;
        return importLog(path, dispatch);
      });
      Promise.all(imports); // TODO: Check error handling
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Matches);

function importLog(logPath: string, dispatch: any): Promise<void> {
  return MatchParser.parseFileAsync(logPath)
    .then(copyMatchLog)
    .then(
      (match) => dispatch(A.importMatchMeta(match.meta)),
      (err) => {
        console.log(err);
        dispatch(A.matchImportError(err.message));
      },
  );
}

// TODO Fix log writing (add players);
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
