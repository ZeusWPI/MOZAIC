import * as log from 'electron-log';

import { App } from 'electron';

import { WindowManager } from './window';

/**
 * Bind various event listeners to the app object.
 *
 * https://electronjs.org/docs/api/app
 * @param app the electron app
 */
export function configureAppListeners(app: App, windowManager: WindowManager) {
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') { app.quit(); }
    log.info('[SHUTDOWN] Window all closed');
  });

  // TODO weird typecheck
  app.on('error' as any, (err: Error) => {
    log.error('Unexpected error occurred', err, err.stack);
  });

  app.on('certificate-error', (ev, wc, url) => {
    log.error(`Certificate error for ${url}`);
  });

  app.on('quit', () => {
    log.info('[SHUTDOWN] App is quitting');
  });

  app.on('will-quit', () => {
    log.verbose('[SHUTDOWN] App will quit');
  });

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!windowManager.getMainWindow()) {
      windowManager.spawnMainWindow();
    }
  });

  log.info('[STARTUP] App listeners bound');
}
