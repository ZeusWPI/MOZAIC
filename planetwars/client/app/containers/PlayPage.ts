import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import * as Promise from 'bluebird';
import { h } from 'react-hyperscript-helpers';
import { PlayPage, IPlayPageStateProps, IPlayPageDispatchProps } from '../components/play2/PlayPage';
import { connect } from 'react-redux';
import { fs } from 'mz';
import { v4 as uuidv4 } from 'uuid';

import * as A from '../actions/actions';
import { IGState } from '../reducers';
import { BotID, IMatchConfig } from '../utils/ConfigModels';
import { unselectBot } from '../actions/actions';
import { Config } from '../utils/Config';
import { IMap, IMapMeta } from '../utils/GameModels';

const mapStateToProps = (state: IGState) => {
  const bots = state.bots;
  const selectedBots = state.playPage.selectedBots;
  const maps = state.maps;
  return { bots, selectedBots, maps };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    selectBot(uuid: BotID) {
      dispatch(A.selectBot(uuid));
    },
    unselectBot(uuid: BotID, all: boolean = false) {
      if (all) {
        dispatch(A.unselectBotAll(uuid));
      } else {
        dispatch(A.unselectBot(uuid));
      }
    },
    startMatch(config: IMatchConfig) {
      console.log(config);
      throw new Error("Not implemented yet.");
    },
    importMatch(fileList: FileList) {
      const files = Array.from(fileList); // Fuck FileList;
      const imports = files.map((logFile) => {
        const path = (<any> logFile).path;
        return _importMatch(path, dispatch);
      });
      Promise.all(imports); // TODO: Check error handling
    },
    runMatch(params: A.MatchParams) {
      dispatch(A.runMatch(params));
    }
  };
};

export default connect<IPlayPageStateProps, IPlayPageDispatchProps>(mapStateToProps, mapDispatchToProps)(PlayPage);

function _importMatch(path: string, dispatch: any): Promise<void> {
  return Promise.resolve(fs.readFile(path))
    .then((buffer) => buffer.toString())
    .then((contents) => JSON.parse(contents))
    // Copy the log
    .then((map: IMap) => {
      const uuid = uuidv4();
      const mapPath = Config.generateMapPath(uuid);
      const slots = map.planets.filter((p) => p.owner !== undefined).length;
      return Promise
        .resolve(fs.writeFile(mapPath, JSON.stringify(map, undefined, 4)))
        .return({
          uuid,
          name: uuid.slice(0, 5),
          slots,
          mapPath,
          createdAt: new Date(Date.now()),
        });
    })
    .then(
      (map: IMapMeta) => dispatch(A.importMapFromDB(map)),
      (err: any) => dispatch(A.importMapError(err)),
  );
}
