import * as fs from 'fs';
import * as p from 'path';
import { connect } from 'react-redux';

import History from '../components/history/History';
import { IGState } from '../reducers/index';
import { Config } from '../utils/Config';
import { GameAnalyser } from '../utils/GameAnalyser';

// interface IProps

const mapStateToProps = (state: IGState) => {
  // TODO: Get this from redux state
  const matchPaths = readGames();
  const matches = matchPaths.map((path, id) => {
    const analyzer = GameAnalyser.parseGame(p.format(path));
    return { id, match: analyzer.getData() };
  });

  return {
    expandedGameId: 1,
    matches,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(History);

function readGames(): p.ParsedPath[] {
  const dir = Config.games;
  if (fs.existsSync(dir)) {
    let fileNames = fs.readdirSync(dir);
    fileNames = fileNames.filter((file) => fs.lstatSync(p.resolve(dir, file)).isFile());
    const paths = fileNames.map((f) => p.parse(p.resolve(dir, f)));
    return paths;
  }
  return [];
}
