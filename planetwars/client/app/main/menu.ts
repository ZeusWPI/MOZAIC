import { app as electronApp, BrowserWindow, Menu, App } from 'electron';

export async function buildMenuAndShortcuts(window: BrowserWindow) {

  window.webContents.on('context-menu', (e, props) => {
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
  window.setMenu(menu);
  window.setMenuBarVisibility(false);
}
