'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('mdt', {
  getInfo: () => ipcRenderer.invoke('app:info'),
  startupOnce: () => ipcRenderer.invoke('app:startupOnce'),
  clearSession: () => ipcRenderer.invoke('app:clearSession'),
  clearForumSession: () => ipcRenderer.invoke('app:clearForumSession'),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  setWindowTheme: (theme) => ipcRenderer.invoke('app:setWindowTheme', theme),
  setTray: (enabled) => ipcRenderer.invoke('app:setTray', enabled),
  quit: () => ipcRenderer.invoke('app:quit'),
  messageBox: (options) => ipcRenderer.invoke('app:messageBox', options),
  checkUpdates: () => ipcRenderer.invoke('app:checkUpdates'),
  installUpdate: (payload) => ipcRenderer.invoke('app:installUpdate', payload),
  setPresence: (payload) => ipcRenderer.invoke('app:setPresence', payload),
  onOpenPage: (fn) => {
    if (typeof fn === 'function') ipcRenderer.on('app:openPage', (_event, url) => fn(url))
  },
  onWake: (fn) => {
    if (typeof fn !== 'function') return
    ipcRenderer.on('app:wake', () => {
      try {
        fn()
      } catch (_) {
      }
    })
  }
})
