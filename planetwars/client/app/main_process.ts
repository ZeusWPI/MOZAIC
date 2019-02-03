import * as log from 'electron-log';
log.transports.file.level = 'info';
log.info('[STARTUP] Main process started');

import { app, BrowserWindow, Menu } from 'electron';
import electronDebug from 'electron-debug';

import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer';

import * as windowStateKeeper from 'electron-window-state';
import * as sourceMapSupport from 'source-map-support';
import * as path from 'path';

electronDebug();

// TODO Remove bluebird from app (check render process)
// const Promise = require('bluebird');

if (process.env.NODE_ENV === 'production') {
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development') {
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  // tslint:disable-next-line:no-var-requires
  require('module').globalPaths.push(p);
}

const installExtensions = () => {
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  return Promise.all([
    installExtension(REACT_DEVELOPER_TOOLS, forceDownload),
    installExtension(REDUX_DEVTOOLS, forceDownload),
  ]);
};

log.info('[STARTUP] Modules loaded');

app.on('ready', () => {
  log.info('[STARTUP] App ready');
  return installExtensions()
    .catch((err) => log.error(`[STARTUP] Error installing extensions ${err.toString()}`))
    .then()
    .then(() => log.info('[STARTUP] Extensions installed'))
    .then(() => {
      const mainWindowState = windowStateKeeper({
        defaultWidth: 1024,
        defaultHeight: 720,
      });

      let mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
      });
      mainWindowState.manage(mainWindow);

      mainWindow.loadURL(`file://${__dirname}/index.html`);

      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.show();
        if (process.env.NODE_ENV === 'production') {
          mainWindow.focus();
        }
      });

      mainWindow.on('closed', () => { mainWindow = null as any; });

      mainWindow.webContents.openDevTools();

      mainWindow.webContents.on('context-menu', (e, props) => {
        const {
          x,
          y,
        } = props;

        // TODO: Add cut/copy/paste
        Menu.buildFromTemplate([{
          label: 'Inspect element',
          type: 'normal',
          click() {
            mainWindow.webContents.inspectElement(x, y);
          },
        }]).popup();
      });

      const template: Electron.MenuItemConstructorOptions[] = [
        // {
        //   accelerator: 'CmdOrCtrl+Q',
        //   type: 'normal',
        //   click() {
        //     app.quit();
        //   },
        // }, {
        //   accelerator: 'CmdOrCtrl+R',
        //   type: 'normal',
        //   click() {
        //     mainWindow.webContents.reload();
        //   },
        // }, {
        //   accelerator: 'Ctrl+CmdOrCtrl+F',
        //   type: 'normal',
        //   click() {
        //     mainWindow.setFullScreen(!mainWindow.isFullScreen());
        //   },
        // }, {
        //   accelerator: 'Alt+CmdOrCtrl+I',
        //   type: 'normal',
        //   click() {
        //     mainWindow.webContents.toggleDevTools();
        //   },
        // }, {
        //   accelerator: 'Ctrl+W',
        //   type: 'normal',
        //   click() {
        //     mainWindow.close();
        //   },
        // }, {
        //   accelerator: 'F5',
        //   type: 'normal',
        //   click() {
        //     mainWindow.webContents.reload();
        //   },
        // }, {
        //   accelerator: 'F12',
        //   type: 'normal',
        //   click() {
        //     mainWindow.webContents.toggleDevTools();
        //   },
        // }, {
        //   accelerator: 'F11',
        //   type: 'normal',
        //   click() {
        //     mainWindow.setFullScreen(!mainWindow.isFullScreen());
        //   },
        // }
      ];

      const menu = Menu.buildFromTemplate(template);
      mainWindow.setMenu(menu);
      mainWindow.setMenuBarVisibility(false);
    })
    .then(() => log.info('[STARTUP] Browser window created'))
    .catch((err) => log.error(`[STARTUP] Error starting app: ${err.toString()} ${err.stack}`));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') { app.quit(); }
  log.info('[SHUTDOWN] Window all closed');
});

// TODO weird typecheck
app.on('error' as any, (err: Error) => {
  log.error(`Unexpected error occurred: ${err.toString()} ${err.stack}`);
});

app.on('certificate-error', (ev, wc, url) => {
  log.error(`Certificate error for ${url}`);
});

app.on('quit', () => {
  log.info('[SHUTDOWN] App is quitting');
});

app.on('will-quit', () => {
  log.info('[SHUTDOWN] App will quit');
});

log.info('[STARTUP] App listeners bound');
