'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('mdt', {
  getInfo: () => ipcRenderer.invoke('app:info'),
  clearSession: () => ipcRenderer.invoke('app:clearSession'),
  clearForumSession: () => ipcRenderer.invoke('app:clearForumSession'),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  setTray: (enabled) => ipcRenderer.invoke('app:setTray', enabled),
  quit: () => ipcRenderer.invoke('app:quit'),
  messageBox: (options) => ipcRenderer.invoke('app:messageBox', options)
})
