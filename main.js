'use strict'

const path = require('path')
const fs = require('fs')
const { app, BrowserWindow, ipcMain, session, shell, dialog, Tray, Menu, nativeImage } = require('electron')

const LEGACY_APP_DIRS = ['MDC Client', 'mdc-client', 'MDT Terminal', 'mdt-terminal']

try {
  const appData = app.getPath('appData')
  const userDataDir = path.join(appData, 'gtaw-mdc-client')

  if (!fs.existsSync(userDataDir)) {
    for (const name of LEGACY_APP_DIRS) {
      const legacy = path.join(appData, name)
      if (legacy !== userDataDir && fs.existsSync(legacy)) {
        try {
          fs.cpSync(legacy, userDataDir, { recursive: true })
          console.log('[session] migrated session data from ' + legacy)
        } catch (err) {
          console.warn('[session] could not migrate from ' + legacy, err)
        }
        break
      }
    }
  }

  app.setPath('userData', userDataDir)
} catch (err) {
  console.warn('[session] could not pin userData path', err)
}

const PARTITION = 'persist:gtaw-mdc'
const MDC_URL = 'https://mdc.gta.world/'

let mainWindow = null
let tray = null
let trayEnabled = false
let quitting = false

function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = null
    createWindow()
    return
  }
  try {
    mainWindow.setSkipTaskbar(false)
    if (mainWindow.isMinimized()) mainWindow.restore()
    if (!mainWindow.isVisible()) mainWindow.show()
    mainWindow.moveTop()
    mainWindow.focus()
    const view = mainWindow.webContents
    if (view && !view.isDestroyed()) {
      if (typeof view.invalidate === 'function') view.invalidate()
      const bounds = mainWindow.getBounds()
      mainWindow.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height + 1
      })
      mainWindow.setBounds(bounds)
    }
  } catch (err) {
    console.warn('[tray] could not restore the window', err)
  }
}

function trayImage() {
  const file = path.join(__dirname, 'build', 'icon.ico')
  try {
    const img = nativeImage.createFromPath(file)
    if (img && !img.isEmpty()) return img
  } catch (_) {}
  return file
}

function createTray() {
  if (tray) return
  try {
    tray = new Tray(trayImage())
  } catch (err) {
    console.warn('[tray] could not create tray icon', err)
    tray = null
    return
  }
  tray.setToolTip('MDC Client')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open MDC Client', click: showWindow },
      { type: 'separator' },
      {
        label: 'Exit',
        click: () => {
          quitting = true
          app.quit()
        }
      }
    ])
  )
  tray.on('click', () => setImmediate(showWindow))
  tray.on('double-click', showWindow)
}

function destroyTray() {
  if (!tray) return
  try {
    tray.destroy()
  } catch (_) {}
  tray = null
}

function setTrayEnabled(next) {
  trayEnabled = !!next
  if (trayEnabled) {
    createTray()
  } else {
    destroyTray()
    if (mainWindow && !mainWindow.isVisible()) mainWindow.show()
  }
  return trayEnabled
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'MDC Client',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: '#F0F0F0',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
      backgroundThrottling: false
    }
  })

  mainWindow.setMenuBarVisibility(false)

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))

  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.on('minimize', (event) => {
    if (!trayEnabled) return
    event.preventDefault()
    mainWindow.hide()
  })

  mainWindow.on('close', (event) => {
    if (!trayEnabled || quitting) return
    event.preventDefault()
    mainWindow.hide()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  session.fromPartition(PARTITION)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  quitting = true
  destroyTray()
})

app.on('window-all-closed', () => {
  if (trayEnabled) return
  if (process.platform !== 'darwin') app.quit()
})

app.on('web-contents-created', (_event, contents) => {
  if (contents.getType() === 'webview') {
    contents.setWindowOpenHandler(({ url }) => {
      try {
        const host = new URL(url).host
        if (host.endsWith('gta.world')) {
          contents.loadURL(url)
          return { action: 'deny' }
        }
      } catch (_) {
      }
      shell.openExternal(url)
      return { action: 'deny' }
    })
  }
})

ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  electron: process.versions.electron,
  chrome: process.versions.chrome,
  node: process.versions.node,
  partition: PARTITION,
  mdcUrl: MDC_URL
}))

ipcMain.handle('app:clearSession', async () => {
  const ses = session.fromPartition(PARTITION)
  await ses.clearStorageData()
  return true
})

ipcMain.handle('app:clearForumSession', async () => {
  const ses = session.fromPartition(PARTITION)
  const cookies = await ses.cookies.get({ domain: 'forum.gta.world' })
  for (const cookie of cookies) {
    const host = String(cookie.domain || '').replace(/^\./, '')
    const url = (cookie.secure ? 'https://' : 'http://') + host + (cookie.path || '/')
    try {
      await ses.cookies.remove(url, cookie.name)
    } catch (_) {
    }
  }
  return true
})

ipcMain.handle('app:openExternal', async (_e, url) => {
  await shell.openExternal(String(url))
  return true
})

ipcMain.handle('app:setTray', (_e, enabled) => setTrayEnabled(enabled))

ipcMain.handle('app:quit', () => {
  quitting = true
  app.quit()
})

ipcMain.handle('app:messageBox', async (_e, options) => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow
  const result = await dialog.showMessageBox(win, {
    type: 'info',
    buttons: ['OK'],
    noLink: true,
    ...options
  })
  return result.response
})
