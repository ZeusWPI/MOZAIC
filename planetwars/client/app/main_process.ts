import * as log from 'electron-log';
import { app } from 'electron';

import * as process from './process';

// TODO: Check all libraries mentioned here below
// https://github.com/sindresorhus/electron-util

// TODO Remove bluebird from app (check render process)
// const Promise = require('bluebird');

/**
 * Main process main function.
 * Sets up the environment and spawns a browser window;
 */
async function main_process() {
  // First thing to do is setting up logging
  process.shared.setupLogging('main');

  // Log this only after log is setup to respect log policy
  log.verbose("[STARTUP] Main process started.");

  // Dirty global main window var, it seems to be the way to go for electron
  const windowManager = new process.main.WindowManager({
    mainContentURL: `file://${__dirname}/index.html`,
  });

  // Bind listeners (close, certificate-errors, etc...)
  process.main.configureAppListeners(app, windowManager);

  // When app is ready, spawn the (main window) browser window
  await app.whenReady();
  try {
    windowManager.spawnMainWindow();
    process.main.installExtensions()
      .catch((_err) => log.error('[STARTUP] Failed to install all extensions'));
  } catch (err) {
    log.error("[STARTUP] [FATAL] Failed to create browser window!", err, err.stack);
    app.quit();
  }
}

main_process();
