import * as log from 'electron-log';
import * as sourceMapSupport from 'source-map-support';
import * as path from 'path';

import electronDebug from 'electron-debug';

import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer';

export function installExtensions(): Promise<any> {
  // TODO: Check use
  if (process.env.NODE_ENV === 'development') {
    const p = path.join(__dirname, '..', 'app', 'node_modules');
    // tslint:disable-next-line:no-var-requires
    require('module').globalPaths.push(p);
  }

  // Install electron debug
  // https://github.com/sindresorhus/electron-debug
  electronDebug({
    showDevTools: true,
    devToolsMode: 'previous',
  });

  // Install sourceMap support
  sourceMapSupport.install();
  log.debug("[STARTUP] Installed source map support");

  // Install react dev tools and redux devtools
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const react = installExtension(REACT_DEVELOPER_TOOLS, forceDownload)
    .then((name) => log.debug(`[STARTUP] ${name} installed`))
    .catch((err) => {
      log.error(err);
      log.error('[STARTUP] Failed to install React Dev Tools');
      throw err;
    });

  const redux = installExtension(REDUX_DEVTOOLS, forceDownload)
    .then((name) => log.debug(`[STARTUP] ${name} installed`))
    .catch((err) => {
      log.error(err);
      log.error('[STARTUP] Failed to install Redux Dev Tools');
      throw err;
    });

  return Promise.all([react, redux]);
}
