import * as Promise from 'bluebird';
import * as fs from 'mz/fs';
import * as mkdirp from 'mkdirp';

// tslint:disable-next-line:no-var-requires
const asar = require('asar');

import { Config } from './Config';

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

export function unPackBinaries(): Promise<void[]> {
  const binaries = Config.binaries;
  const copyFile: (or: string, dest: string) => void = <any> fs.copyFile;
  const pBins = Object.keys(binaries).map((binCurr) => {
    return fs.exists(binCurr)
      .then((exists) => {
        if (!exists) { return Promise.reject(`Binary ${binCurr} not found`); }
        return Promise.resolve();
      })
      .then(() => {
        return fs.copyFile(binCurr, binaries[binCurr], );
      });
  });
  return Promise.all([]);
}
