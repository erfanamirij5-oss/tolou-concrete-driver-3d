'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const api = Object.freeze({
  isDesktop: true,
  getAppInfo: () => ipcRenderer.invoke('tolou:app-info'),
  save: (payload) => ipcRenderer.invoke('tolou:save', payload),
  load: (slot) => ipcRenderer.invoke('tolou:load', slot),
  listSaves: () => ipcRenderer.invoke('tolou:list-saves'),
  deleteSave: (slot) => ipcRenderer.invoke('tolou:delete-save', slot)
});

contextBridge.exposeInMainWorld('tolouDesktop', api);
