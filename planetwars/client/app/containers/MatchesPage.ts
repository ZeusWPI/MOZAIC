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
import { PathLike } from 'mz/fs';

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
  // TODO: handle errors properly
  return MatchParser.parseFileAsync(logPath)
    .then(match => copyMatchLog(match, logPath))
    .then(
      (match) => dispatch(A.importMatchMeta(match.meta)),
      (err) => {
        console.log(err);
        dispatch(A.matchImportError(err.message));
      },
  );
}

function copyMatchLog(match: IMatchData, srcPath: string): Promise<IMatchData> {
  const path = Config.generateMatchPath(match.meta);
  let reader = fs.createReadStream(srcPath);
  let writer = fs.createWriteStream(path)
  return new Promise((resolve, reject) => {
    reader.on('error', reject);
    writer.on('error', reject);
    writer.on('finish', resolve);
    reader.pipe(writer);
  }).then(() => {
      match.meta.logPath = path;
      return match;
  }).catch(err => {
    reader.destroy();
    writer.end();
    // TODO: should we throw here?
    throw err;
  });
}
