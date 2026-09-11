'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const api = Object.freeze({
  isDesktop: true,
  getAppInfo: () => ipcRenderer.invoke('tolou:app-info'),
  save: (payload) => ipcRenderer.invoke('tolou:save', payload),
  load: (slot) => ipcRenderer.invoke('tolou:load', slot),
  listSaves: () => ipcRenderer.invoke('tolou:list-saves'),
  deleteSave: (slot) => ipcRenderer.invoke('tolou:delete-save', slot),
  onCloseRequested: (handler) => {
    if (typeof handler !== 'function') return () => {};
    const listener = () => handler();
    ipcRenderer.on('tolou:close-requested', listener);
    return () => ipcRenderer.removeListener('tolou:close-requested', listener);
  },
  confirmClose: () => ipcRenderer.send('tolou:close-confirmed')
});

contextBridge.exposeInMainWorld('tolouDesktop', api);
