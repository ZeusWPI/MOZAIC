import * as log from 'electron-log';

import { app, BrowserWindow, Menu } from 'electron';
import electronDebug from 'electron-debug';

import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer';

import * as windowStateKeeper from 'electron-window-state';
import * as sourceMapSupport from 'source-map-support';
import * as path from 'path';

// TODO: Check all libraries mentioned here below
// https://github.com/sindresorhus/electron-util

/**
 * Main process main function.
 * Sets up the environment and spawns a browser window;
 */
async function main() {
  setupLog();
  log.verbose("[STARTUP] Main process started.");
  mainBla();
}

/**
 * Set up log levels for dev and production, and allow ENV variables
 * configuration.
 */
function setupLog() {
  const { file, rendererConsole, logS } = log.transports;
  const mainConsole = log.transports.console;

  // In dev, set log level to debug for all transports (except remote)
  if (process.env.NODE_ENV === 'development') {
    rendererConsole.level = "debug";
    mainConsole.level = "debug";
    file.level = "debug";
    logS.level = false;

    // In prod, set log level to verbose for all transports (except remote)
  } else {
    rendererConsole.level = "verbose";
    mainConsole.level = "verbose";
    file.level = "info";
    logS.level = false; // TODO: Would be cool to have a Sentry endpoint here
  }

  // Set log level for all transports
  if (process.env.BB_LOG_LEVEL) {
    setLogLevelFromEnv(rendererConsole, process.env.BB_LOG_LEVEL);
    setLogLevelFromEnv(mainConsole, process.env.BB_LOG_LEVEL);
    setLogLevelFromEnv(file, process.env.BB_LOG_LEVEL);
    setLogLevelFromEnv(logS, process.env.BB_LOG_LEVEL);
  }

  // Allow specific transport log levels to be controlled with env vars;
  setLogLevelFromEnv(rendererConsole, process.env.BB_LOG_LEVEL_CONSOLE);
  setLogLevelFromEnv(mainConsole, process.env.BB_LOG_LEVEL_WEB);
  setLogLevelFromEnv(file, process.env.BB_LOG_LEVEL_FILE);
  setLogLevelFromEnv(logS, process.env.BB_LOG_LEVEL_REMOTE);

  log.debug("[STARTUP] Logging configured");
  log.debug("[STARTUP] Debug logging main process activated");
  log.verbose("[STARTUP] Verbose logging main process activated");
}

function setLogLevelFromEnv(transport: log.ITransport, envVar: string | undefined): void {
  const logLevels = ['silly', 'debug', 'verbose', 'info', 'warn', 'error'];
  if (envVar !== undefined && envVar !== "") {
    if (envVar === 'false') {
      transport.level = false;
      return;
    }
    if (logLevels.includes(envVar)) {
      transport.level = envVar as log.LevelOption;
      return;
    }
  }
}

function mainBla() {

  // https://github.com/sindresorhus/electron-debug
  electronDebug({
    showDevTools: true,
    devToolsMode: 'previous',
  });

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
          Menu.buildFromTemplate([
            // {
            //   label: 'Inspect element',
            //   type: 'normal',
            //   click() {
            //     mainWindow.webContents.inspectElement(x, y);
            //   },
            // }, {
            //   accelerator: 'CmdOrCtrl+Z',
            //   role: 'undo',
            // }, {
            //   accelerator: 'CmdOrCtrl+Shift+Z',
            //   role: 'redo',
            // }, {
            //   type: 'separator',
            // }, {
            //   accelerator: 'CmdOrCtrl+X',
            //   role: 'cut',
            // }, {
            //   accelerator: 'CmdOrCtrl+C',
            //   role: 'copy',
            // }, {
            //   accelerator: 'CmdOrCtrl+V',
            //   role: 'paste',
            // }, {
            //   type: 'separator',
            // }, {

            // }
          ]).popup();
        });

        const template: Electron.MenuItemConstructorOptions[] = [
          // {
          //   type: 'submenu',
          //   role: 'edit',
          // },
          // {
          //   type: 'submenu',
          //   submenu: [
          //     {
          //       accelerator: 'CmdOrCtrl+Q',
          //       type: 'normal',
          //       role: 'quit',
          //     },
          //   ],
          // },
          // {
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
}

main();
