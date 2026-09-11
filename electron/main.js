'use strict';

const path = require('node:path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const persistence = require('./persistence');

const smokeMode = process.argv.includes('--tolou-smoke-test');
let mainWindow = null;
let closeConfirmed = false;
let closeRequested = false;
let forceCloseTimer = null;
let smokeTimer = null;

function finishSmoke(exitCode, message) {
  if (!smokeMode) return;
  if (smokeTimer) clearTimeout(smokeTimer);
  smokeTimer = null;
  if (message) console.log(`[tolou-smoke] ${message}`);
  app.exit(exitCode);
}

function createWindow() {
  closeConfirmed = false;
  closeRequested = false;
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#102b39',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow.webContents.getURL();
    if (current && url !== current) event.preventDefault();
  });

  if (smokeMode) {
    smokeTimer = setTimeout(() => finishSmoke(1, 'renderer load timed out'), 15000);
    mainWindow.webContents.once('did-finish-load', () => finishSmoke(0, 'renderer loaded successfully'));
    mainWindow.webContents.once('did-fail-load', (_event, errorCode, errorDescription) => {
      finishSmoke(1, `renderer failed to load (${errorCode}: ${errorDescription})`);
    });
    mainWindow.webContents.once('render-process-gone', (_event, details) => {
      finishSmoke(1, `renderer process exited unexpectedly (${details.reason})`);
    });
  }

  mainWindow.on('close', (event) => {
    if (smokeMode || closeConfirmed) return;
    event.preventDefault();
    if (closeRequested) return;
    closeRequested = true;
    mainWindow.webContents.send('tolou:close-requested');
    forceCloseTimer = setTimeout(() => {
      closeConfirmed = true;
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
    }, 7000);
  });

  mainWindow.on('closed', () => {
    if (forceCloseTimer) clearTimeout(forceCloseTimer);
    forceCloseTimer = null;
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    if (!smokeMode) mainWindow.show();
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
}

function registerIpc() {
  ipcMain.handle('tolou:app-info', () => ({
    platform: process.platform,
    appVersion: app.getVersion(),
    userDataPath: app.getPath('userData')
  }));

  ipcMain.handle('tolou:save', async (_event, payload) => persistence.saveSlot(app.getPath('userData'), payload));
  ipcMain.handle('tolou:load', async (_event, slot) => persistence.loadSlot(app.getPath('userData'), slot));
  ipcMain.handle('tolou:list-saves', async () => persistence.listSlots(app.getPath('userData')));
  ipcMain.handle('tolou:delete-save', async (_event, slot) => persistence.deleteSlot(app.getPath('userData'), slot));

  ipcMain.on('tolou:close-confirmed', () => {
    closeConfirmed = true;
    if (forceCloseTimer) clearTimeout(forceCloseTimer);
    forceCloseTimer = null;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (!smokeMode && BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
