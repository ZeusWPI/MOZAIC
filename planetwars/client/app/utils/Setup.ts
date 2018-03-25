import * as Promise from 'bluebird';
import * as fs from 'mz/fs';
import * as mkdirp from 'mkdirp';
import * as p from 'path';

import { Importer } from './Importer';
import { Config } from './Config';
import { store } from '../index';
import * as A from '../actions/actions';
import { IGState } from '../reducers';

export function initializeDirs(): Promise<void[]> {
  const dirs = Config.dirs;
  const pDirs = dirs.map((dir) => {
    return Promise.try(() => mkdirp.sync(dir)).return();
  });
  return Promise.all(pDirs);
}

export function checkDataFilesAgainstDb(): void {
  return;
}

export function populateMaps(): Promise<void[]> {
  // The correct type definition is missing for this function
  const copyFile: (or: string, dest: string) => Promise<void> = fs.copyFile as any;
  const state: IGState = store.getState();
  if (Object.keys(state.maps).length !== 0) {
    return Promise.resolve([]);
  }
  return Promise
    .resolve(fs.readdir(Config.staticMaps))
    .then((staticMaps) => {
      const pMaps = staticMaps.map((file) => {
        const path = p.resolve(Config.staticMaps, file);
        return Importer
          .importMapFromFile(path)
          .then((map) => store.dispatch(A.importMap(map)));
      });
      return Promise.all(pMaps);
    });
}

export function populateBots(): Promise<void[]> {
  return Promise.resolve([]);
}
