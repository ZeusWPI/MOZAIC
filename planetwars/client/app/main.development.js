let log = require('electron-log');
log.transports.file.level = 'info';
log.info('[STARTUP] Main process started');

const {
  app,
  BrowserWindow,
  Menu,
  shell,
} = require('electron');
let Promise = require('bluebird');

let menu;
let template;
let mainWindow = null;

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
  const installer = require('electron-devtools-installer'); // eslint-disable-line global-require

  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  return Promise.all(extensions.map(name => installer.default(installer[name], forceDownload)));
};

log.info('[STARTUP] Modules loaded');

app.on('ready', () => {
  log.info('[STARTUP] App ready');
  return installExtensions()
    .catch((err) => log.error(`[STARTUP] Error installing extensions ${err.toString()}`))
    .then()
    .then(() => log.info('[STARTUP] Extensions installed'))
    .then(() => {
      mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 728,
      });

      mainWindow.loadURL(`file://${__dirname}/app.html`);

      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.show();
        mainWindow.focus();
      });

      mainWindow.on('closed', () => { mainWindow = null; });


      const editActions = [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]

      // Set context menu (right click)
      mainWindow.webContents.on('context-menu', (e, props) => {
        const { x, y } = props;
        Menu.buildFromTemplate([{
            label: 'Inspect element',
            click() { mainWindow.inspectElement(x, y); },
          }, {
            type: "separator"
          }]
          .concat(editActions)
        ).popup(mainWindow);
      });

      const visible = (os) => process.platform === os;
      const visibleAll = (osses) => osses.indexOf(process.platform) >= 0;
      const notMac = ['win32', 'linux', 'aix', 'freebsd', 'openbsd', 'sunos'];
      const mac = 'darwin';
      const all = notMac.concat(mac);

      // Set keyboard shortcuts
      // All shortcuts will work trigger on each platform
      // Some duplicates will not be displayed depending on the platform
      const template = [{
        label: 'App',
        submenu: [{
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          visible: true,
          click() { app.quit() }
        }, {
          label: 'Close Window',
          accelerator: 'CmdOrCtrl+W',
          selector: 'performClose:'
        }, {
          label: 'Minimize Window',
          accelerator: 'CmdOrCtrl+M',
          selector: 'performMiniaturize:'
        }, {
          label: 'Bring All to Front',
          selector: 'arrangeInFront:'
        }],
      }, {
        label: "Edit",
        submenu: [...editActions]
      }, {
        label: 'View',
        submenu: [{
          label: 'Reload',
          visible: visible(mac),
          accelerator: 'CmdOrCtrl+R',
          click() { mainWindow.webContents.reload() }
        }, {
          label: 'Reload',
          visible: visibleAll(notMac),
          accelerator: 'F5',
          click() { mainWindow.webContents.reload() }
        }, {
          label: 'Toggle Fullscreen',
          accelerator: 'Ctrl+CmdOrCtrl+F',
          visible: visible(mac),
          click() { mainWindow.setFullScreen(!mainWindow.isFullScreen()) }
        }, {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          visible: visibleAll(notMac),
          click() { mainWindow.setFullScreen(!mainWindow.isFullScreen()) }
        }, {
          label: 'Toggle DevTools',
          accelerator: 'Alt+CmdOrCtrl+I',
          visible: visible(mac),
          click() { mainWindow.toggleDevTools() }
        }, {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          visible: visibleAll(notMac),
          click() { mainWindow.toggleDevTools() }
        }, {
          label: 'Toggle Top Menu',
          accelerator: 'CmdOrCtrl+T',
          visible: true,
          click() { mainWindow.setMenuBarVisibility(!mainWindow.isMenuBarVisible()) }
        }]
        // TODO: Add tools here for things like clearing matches, bots, db...
      }];

      menu = Menu.buildFromTemplate(template);
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