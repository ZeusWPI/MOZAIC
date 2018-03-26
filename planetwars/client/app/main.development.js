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
      }]).popup(mainWindow);
    });

    const template = [{
      accelerator: 'CmdOrCtrl+Q',
      click() {
        app.quit()
      }
    }, {
      accelerator: 'CmdOrCtrl+R',
      click() {
        mainWindow.webContents.reload()
      }
    }, {
      accelerator: 'Ctrl+CmdOrCtrl+F',
      click() {
        mainWindow.setFullScreen(!mainWindow.isFullScreen())
      }
    }, {
      accelerator: 'Alt+CmdOrCtrl+I',
      click() {
        mainWindow.toggleDevTools()
      }
    }, {
      accelerator: 'Ctrl+W',
      click() {
        mainWindow.close()
      }
    }, {
      accelerator: 'F12',
      click() {
        mainWindow.toggleDevTools()
      }
    }, {
      accelerator: 'F11',
      click() {
        mainWindow.setFullScreen(!mainWindow.isFullScreen())
      }
    }];

    menu = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menu);
    mainWindow.setMenuBarVisibility(false);
  }));