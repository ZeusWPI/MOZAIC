import * as fs from 'mz/fs';
import * as p from 'path';
import * as Promise from 'bluebird';
import { connect } from 'react-redux';

import Matches, { IMatchesStateProps } from '../components/matches/Matches';
import { IGState } from '../reducers/index';
import { Config } from '../utils/Config';
import { MatchParser } from '../utils/MatchParser';
import * as A from '../actions/actions';
import { IMatchMetaData, IMatchData, MatchId } from '../utils/GameModels';

interface IProps {
  match: any; // Note: this is a match as in the regex sense (from the url)
}

const mapStateToProps = (state: IGState, ownProps: any) => {
  const matches = state.matches;
  const importError = state.matchesPage.importError;
  const uuid: MatchId | undefined = ownProps.match.params.bot;
  return {
    selectedMatch: uuid,
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

export default connect<IMatchesStateProps>(mapStateToProps, mapDispatchToProps)(Matches);

function importLog(logPath: string, dispatch: any): Promise<void> {
  return MatchParser.parseFileAsync(logPath)
    .then(copyMatchLog)
    .then(
      (match) => dispatch(A.importMatch(match.meta)),
      (err) => {
        console.log(err);
        dispatch(A.importMatchError(err.message));
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
