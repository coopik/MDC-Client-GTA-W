'use strict'

const path = require('path')
const fs = require('fs')
const os = require('os')
const https = require('https')
const { app, BrowserWindow, ipcMain, session, shell, dialog, Tray, Menu, nativeImage } = require('electron')

const LEGACY_APP_DIRS = ['PatrolOne Mobile Client', 'mdc-client', 'MDT Terminal', 'mdt-terminal']

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

const guests = new Set()

function wakeContents() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const list = [mainWindow.webContents]
  guests.forEach((c) => list.push(c))
  for (const c of list) {
    if (!c || c.isDestroyed()) continue
    try {
      if (typeof c.setBackgroundThrottling === 'function') c.setBackgroundThrottling(false)
      if (typeof c.invalidate === 'function') c.invalidate()
    } catch (_) {
    }
  }
  try {
    mainWindow.webContents.focus()
    mainWindow.webContents.send('app:wake')
  } catch (_) {
  }
}

function jiggle() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  try {
    const bounds = mainWindow.getBounds()
    mainWindow.setBounds({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height + 1
    })
    mainWindow.setBounds(bounds)
  } catch (_) {
  }
}

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
    jiggle()
    wakeContents()
    setTimeout(() => {
      jiggle()
      wakeContents()
    }, 120)
    setTimeout(wakeContents, 450)
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
  tray.setToolTip('PatrolOne Mobile Client')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open PatrolOne Mobile Client', click: showWindow },
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
    title: 'PatrolOne Mobile Client',
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

  mainWindow.on('show', () => setTimeout(wakeContents, 30))
  mainWindow.on('restore', () => setTimeout(wakeContents, 30))
  mainWindow.on('focus', () => wakeContents())

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
    guests.add(contents)
    contents.on('destroyed', () => guests.delete(contents))
    try {
      contents.setBackgroundThrottling(false)
    } catch (_) {
    }
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

const REPO = 'coopik/MDC-Client-GTA-W'
const UA = 'PatrolOne-Mobile-Client'

function httpsJson(url, depth) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' }
    }, (res) => {
      const code = res.statusCode || 0
      const location = res.headers && res.headers.location
      if (code >= 300 && code < 400 && location && (depth || 0) < 4) {
        res.resume()
        httpsJson(location, (depth || 0) + 1).then(resolve, reject)
        return
      }
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        if (code !== 200) { reject(new Error('GitHub returned HTTP ' + code)); return }
        try {
          resolve(JSON.parse(body))
        } catch (err) {
          reject(new Error('Could not read the release feed'))
        }
      })
    })
    req.setTimeout(15000, () => req.destroy(new Error('The update check timed out')))
    req.on('error', reject)
  })
}

function downloadTo(url, dest, depth) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      const code = res.statusCode || 0
      const location = res.headers && res.headers.location
      if (code >= 300 && code < 400 && location && (depth || 0) < 5) {
        res.resume()
        downloadTo(location, dest, (depth || 0) + 1).then(resolve, reject)
        return
      }
      if (code !== 200) { res.resume(); reject(new Error('Download failed with HTTP ' + code)); return }
      const file = fs.createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => file.close(() => resolve(dest)))
      file.on('error', reject)
    })
    req.setTimeout(120000, () => req.destroy(new Error('The download timed out')))
    req.on('error', reject)
  })
}

function cmpVersion(a, b) {
  const pa = String(a || '').replace(/^v/i, '').split(/[.\-+]/)
  const pb = String(b || '').replace(/^v/i, '').split(/[.\-+]/)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = parseInt(pa[i], 10)
    const nb = parseInt(pb[i], 10)
    if (isNaN(na) && isNaN(nb)) continue
    if (isNaN(na)) return -1
    if (isNaN(nb)) return 1
    if (na !== nb) return na > nb ? 1 : -1
  }
  return 0
}

function pickAsset(release) {
  const assets = Array.isArray(release && release.assets) ? release.assets : []
  const exe = assets.find((a) => /\.exe$/i.test(String(a.name || '')))
  const zip = assets.find((a) => /\.zip$/i.test(String(a.name || '')))
  const chosen = exe || zip
  if (!chosen) return null
  return { name: String(chosen.name || ''), url: String(chosen.browser_download_url || ''), size: Number(chosen.size || 0) }
}

ipcMain.handle('app:checkUpdates', async () => {
  const current = app.getVersion()
  try {
    const release = await httpsJson('https://api.github.com/repos/' + REPO + '/releases/latest')
    const latest = String(release.tag_name || release.name || '').replace(/^v/i, '')
    const asset = pickAsset(release)
    return {
      ok: true,
      current,
      latest: latest || current,
      newer: latest ? cmpVersion(latest, current) > 0 : false,
      notes: String(release.body || '').slice(0, 800),
      published: String(release.published_at || ''),
      page: String(release.html_url || ('https://github.com/' + REPO + '/releases/latest')),
      asset
    }
  } catch (err) {
    return { ok: false, current, error: String((err && err.message) || err) }
  }
})

ipcMain.handle('app:installUpdate', async (_e, payload) => {
  const url = String((payload && payload.url) || '')
  const name = String((payload && payload.name) || 'PatrolOne-Update.exe').replace(/[^\w.\-]/g, '_')
  if (!/^https:\/\//i.test(url)) return { ok: false, error: 'That download link is not usable.' }
  const dest = path.join(app.getPath('temp') || os.tmpdir(), name)
  try {
    await downloadTo(url, dest)
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) }
  }
  const opened = await shell.openPath(dest)
  if (opened) return { ok: false, error: opened, path: dest }
  setTimeout(() => {
    quitting = true
    destroyTray()
    app.quit()
  }, 1200)
  return { ok: true, path: dest }
})

function wireDownloads() {
  try {
    const ses = session.fromPartition(PARTITION)
    ses.on('will-download', (event, item) => {
      try {
        const dir = app.getPath('downloads')
        const base = item.getFilename() || 'download.png'
        const dot = base.lastIndexOf('.')
        const stem = dot > 0 ? base.slice(0, dot) : base
        const ext = dot > 0 ? base.slice(dot) : ''
        let name = base
        let n = 1
        while (fs.existsSync(path.join(dir, name))) {
          name = stem + ' (' + n + ')' + ext
          n += 1
        }
        item.setSavePath(path.join(dir, name))
      } catch (err) {
        console.warn('[download] could not set save path', err)
      }
    })
  } catch (err) {
    console.warn('[download] could not wire downloads', err)
  }
}

app.whenReady().then(wireDownloads)

let startupSoundDone = false

ipcMain.handle('app:startupOnce', () => {
  if (startupSoundDone) return false
  startupSoundDone = true
  return true
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

const DISCORD_APP_ID = '1532331199392120882'
const DISCORD_LARGE_IMAGE = 'app_icon'
let rpcSocket = null
let rpcReady = false
let rpcTrying = false
let rpcWanted = null

function rpcSocketPath(index) {
  if (process.platform === 'win32') return '\\\\?\\pipe\\discord-ipc-' + index
  const base =
    process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || process.env.TMP || '/tmp'
  return base.replace(/\/$/, '') + '/discord-ipc-' + index
}

function rpcFrame(op, payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  const head = Buffer.alloc(8)
  head.writeInt32LE(op, 0)
  head.writeInt32LE(body.length, 4)
  return Buffer.concat([head, body])
}

function rpcWrite(op, payload) {
  if (!rpcSocket) return
  try {
    rpcSocket.write(rpcFrame(op, payload))
  } catch (_) {
  }
}

function rpcDrop() {
  rpcReady = false
  if (rpcSocket) {
    try {
      rpcSocket.destroy()
    } catch (_) {
    }
  }
  rpcSocket = null
}

function rpcPushActivity() {
  if (!rpcReady) return
  if (!rpcWanted) {
    rpcWrite(1, {
      cmd: 'SET_ACTIVITY',
      args: { pid: process.pid },
      nonce: String(Date.now())
    })
    return
  }
  rpcWrite(1, {
    cmd: 'SET_ACTIVITY',
    args: {
      pid: process.pid,
      activity: {
        details: String(rpcWanted.details || 'On patrol').slice(0, 128),
        state: String(rpcWanted.state || 'Mobile Data Computer').slice(0, 128),
        timestamps: { start: rpcWanted.since || Date.now() },
        assets: {
          large_image: DISCORD_LARGE_IMAGE,
          large_text: 'PatrolOne Mobile Client'
        },
        instance: false
      }
    },
    nonce: String(Date.now())
  })
}

function rpcConnect(index) {
  if (index > 9) {
    rpcTrying = false
    return
  }
  const net = require('net')
  let sock = null
  try {
    sock = net.createConnection(rpcSocketPath(index))
  } catch (_) {
    rpcConnect(index + 1)
    return
  }
  sock.on('error', () => {
    try {
      sock.destroy()
    } catch (_) {
    }
    if (rpcSocket === sock) rpcDrop()
    rpcConnect(index + 1)
  })
  sock.on('close', () => {
    if (rpcSocket === sock) {
      rpcSocket = null
      rpcReady = false
    }
  })
  sock.on('connect', () => {
    rpcSocket = sock
    rpcTrying = false
    rpcWrite(0, { v: 1, client_id: DISCORD_APP_ID })
  })
  sock.on('data', () => {
    if (rpcSocket !== sock) return
    if (!rpcReady) {
      rpcReady = true
      rpcPushActivity()
    }
  })
}

ipcMain.handle('app:setPresence', (_e, payload) => {
  const wanted = payload && typeof payload === 'object' ? payload : {}
  if (!wanted.enabled) {
    rpcWanted = null
    if (rpcReady) rpcPushActivity()
    rpcDrop()
    return false
  }
  const since = rpcWanted && rpcWanted.since ? rpcWanted.since : Date.now()
  rpcWanted = { details: wanted.details, state: wanted.state, since: since }
  if (rpcReady) {
    rpcPushActivity()
  } else if (!rpcTrying) {
    rpcTrying = true
    rpcConnect(0)
  }
  return true
})

app.on('before-quit', () => {
  rpcWanted = null
  rpcDrop()
})

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
