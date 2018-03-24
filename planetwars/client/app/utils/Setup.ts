import * as Promise from 'bluebird';
import * as fs from 'mz/fs';

import { Config } from './Config';

export function initializeDirs(): Promise<void[]> {
  const dirs = Config.dirs;
  const pDirs = dirs.map((dir) => {
    return fs
      .exists(dir)
      .then((exists) => {
        if (exists) { return Promise.resolve(); }
        return fs.mkdir(dir);
      });
  });
  return Promise.all(pDirs);
}
