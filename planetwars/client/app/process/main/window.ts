import { BrowserWindow } from 'electron';

import * as log from 'electron-log';
import * as windowStateKeeper from 'electron-window-state';

import * as menu from './menu';

export interface WindowManagerOptions {
  mainContentURL: string;
}

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private mainContentURL: string;

  constructor(options: WindowManagerOptions) {
    Object.assign(this, options);
  }

  public spawnMainWindow(): BrowserWindow {
    if (this.mainWindow) {
      log.warn('Main window spawned, but one already exists');
      return this.mainWindow;
    }

    const window = createBrowserWindow();
    log.verbose("[STARTUP] Main Browser Window created");

    window.loadURL(this.mainContentURL);
    log.verbose("[STARTUP] Main Content loaded");

    menu.buildMenuAndShortcuts(window)
      .catch((err) => {
        log.error('[STARTUP] Failed to build menu', err, err.stack);
      });

    menu.attachContextMenu(window)
      .catch((err) => {
        log.error('[STARTUP] Failed to attach context menu', err, err.stack);
      });

    bindWindowListeners(window)
      .catch((err) => {
        log.error('[STARTUP] Failed to bind all window listeners', err, err.stack);
      });

    bindWebContentListeners(window)
      .catch((err) => {
        log.error('[STARTUP] Failed to bind all web content listeners', err, err.stack);
      });

    window.on('closed', () => {
      this.mainWindow = null;
    });

    window.webContents.openDevTools();

    this.mainWindow = window;
    return this.mainWindow;
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
}

function createBrowserWindow() {
  const windowState = windowStateKeeper({
    defaultWidth: 1024,
    defaultHeight: 720,
  });

  const mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
  });
  windowState.manage(mainWindow);
  return mainWindow;
}

async function bindWebContentListeners(window: BrowserWindow) {
  window.webContents.on('did-finish-load', () => {
    window.show();
    if (process.env.NODE_ENV === 'production') {
      window.focus();
    }
    log.verbose('[STARTUP] Webcontent finished loading');
  });
}

async function bindWindowListeners(window: BrowserWindow) {
  window.on('closed', () => {
    log.verbose('[SHUTDOWN] Main window is closed');
  });
}
