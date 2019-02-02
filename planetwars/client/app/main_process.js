const log = require('electron-log');
log.transports.file.level = 'info';
log.info('[STARTUP] Main process started');

const { app, BrowserWindow, Menu } = require('electron');
const Promise = require('bluebird');
const windowStateKeeper = require('electron-window-state');

if (process.env.NODE_ENV === 'production') {
  require('electron-debug')();
  const sourceMapSupport = require('source-map-support'); // eslint-disable-line
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')(); // eslint-disable-line global-require
  const path = require('path'); // eslint-disable-line
  const p = path.join(__dirname, '..', 'app', 'node_modules'); // eslint-disable-line
  require('module').globalPaths.push(p); // eslint-disable-line
}

const installExtensions = () => {
  // const installer = require('electron-devtools-installer'); // eslint-disable-line global-require

  // const extensions = [
  //   'REACT_DEVELOPER_TOOLS',
  //   'REDUX_DEVTOOLS'
  // ];
  // const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  // return Promise.all(extensions.map(name => installer.default(installer[name], forceDownload)));
  return Promise.resolve();
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
        defaultHeight: 720
      });


      let mainWindow = new BrowserWindow({
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height
      });
      mainWindowState.manage(mainWindow);

      mainWindow.loadURL(`file://${__dirname}/index.html`);

      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.show();
        if (process.env.NODE_ENV === 'production') {
          mainWindow.focus();
        }
      });

      mainWindow.on('closed', () => {
        mainWindow = null;
      });

      mainWindow.openDevTools({ mode: 'right' });

      mainWindow.webContents.on('context-menu', (e, props) => {
        const {
          x,
          y
        } = props;

        // Menu.buildFromTemplate([
        //   //   {
        //   //   label: 'Inspect element',
        //   //   type: 'normal',
        //   //   click() {
        //   //     mainWindow.inspectElement(x, y);
        //   //   },
        //   // }
        // ]).popup(mainWindow);
      });

      const template = [{
        //   accelerator: 'CmdOrCtrl+Q',
        //   type: 'normal',
        //   click() {
        //     app.quit()
        //   }
        // }, {
        //   accelerator: 'CmdOrCtrl+R',
        //   type: 'normal',
        //   click() {
        //     mainWindow.webContents.reload()
        //   }
        // }, {
        //   accelerator: 'Ctrl+CmdOrCtrl+F',
        //   type: 'normal',
        //   click() {
        //     mainWindow.setFullScreen(!mainWindow.isFullScreen())
        //   }
        // }, {
        //   accelerator: 'Alt+CmdOrCtrl+I',
        //   type: 'normal',
        //   click() {
        //     mainWindow.toggleDevTools()
        //   }
        // }, {
        //   accelerator: 'Ctrl+W',
        //   type: 'normal',
        //   click() {
        //     mainWindow.close()
        //   }
        // }, {
        //   accelerator: 'F5',
        //   type: 'normal',
        //   click() {
        //     mainWindow.webContents.reload()
        //   }
        // }, {
        //   accelerator: 'F12',
        //   type: 'normal',
        //   click() {
        //     mainWindow.toggleDevTools()
        //   }
        // }, {
        //   accelerator: 'F11',
        //   type: 'normal',
        //   click() {
        //     mainWindow.setFullScreen(!mainWindow.isFullScreen())
        //   }
      }];

      const menu = Menu.buildFromTemplate([]);
      mainWindow.setMenu(menu);
      mainWindow.setMenuBarVisibility(false);
    })
    .then(() => log.info('[STARTUP] Browser window created'))
    .catch((err) => log.error(`[STARTUP] Error starting app: ${err.toString()} ${err.stack}`))
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
  log.info('[SHUTDOWN] Window all closed');
});

app.on('error', (err) => {
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