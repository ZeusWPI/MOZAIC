const {
  app,
  BrowserWindow,
  Menu,
  shell,
  globalShortcut
} = require('electron');

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


const installExtensions = () => {
  const installer = require('electron-devtools-installer'); // eslint-disable-line global-require

  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  return Promise.all(extensions.map(name => installer.default(installer[name], forceDownload)));

  return Promise.resolve([]);
};

app.on('ready', () =>
  installExtensions()
  .then()
  .then(() => {
    mainWindow = new BrowserWindow({
      show: false,
      width: 1024,
      height: 728,
    });

    mainWindow.loadURL(`file://${__dirname}/app.html`);

    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.show();
      // mainWindow.focus();
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // mainWindow.openDevTools();

    mainWindow.webContents.on('context-menu', (e, props) => {
      const {
        x,
        y
      } = props;

      Menu.buildFromTemplate([{
        label: 'Inspect element',
        click() {
          mainWindow.inspectElement(x, y);
        },
      }, {
        type: 'separator'
      }, {
        label: 'Cut',
        role: 'cut',
        accelerator: 'CmdOrCtrl+X',
      }, {
        label: 'Copy',
        role: 'copy',
        accelerator: 'CmdOrCtrl+C',
      }, {
        label: 'Paste',
        role: 'paste',
        accelerator: 'CmdOrCtrl+V',
      }, {
        label: 'Select all',
        role: 'selectall',
        accelerator: 'CmdOrCtrl+A'
      }, {
        type: 'separator'
      }, {
        label: 'Undo',
        role: 'undo',
        accelerator: 'CmdOrCtrl+Z',
      }, {
        label: 'Redo',
        role: 'redo',
        accelerator: 'CmdOrCtrl+Shift+Z'
      }]).popup(mainWindow);
    });

    globalShortcut.register('CmdOrCtrl+Q', () => app.quit());
    globalShortcut.register('CmdOrCtrl+R', () => mainWindow.webContents.reload());
    globalShortcut.register('Ctrl+CmdOrCtrl+F', () => mainWindow.setFullScreen(!mainWindow.isFullScreen()));
    globalShortcut.register('Alt+CtrlOrCmd+I', () => mainWindow.toggleDevTools());
    globalShortcut.register('Ctrl+W', () => mainWindow.close());
    globalShortcut.register('F12', () => mainWindow.toggleDevTools());
    globalShortcut.register('F11', () => mainWindow.setFullScreen(!mainWindow.isFullScreen()));
  }));