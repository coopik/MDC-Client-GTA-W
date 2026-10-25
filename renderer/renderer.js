'use strict'

let dialogRoot = null

function el(id) {
  const scoped = dialogRoot && dialogRoot.querySelector('[data-dialog-id="' + id + '"]')
  const node = scoped || document.getElementById(id)
  if (!node) console.warn('[shell] missing element #' + id)
  return node
}

function on(node, event, fn, options) {
  if (node && node.addEventListener) node.addEventListener(event, fn, options)
}

function boot(label, fn) {
  try {
    fn()
  } catch (err) {
    console.error('[shell] init failed: ' + label, err)
  }
}

let wv = el('mdc')
const pcv = el('penal')
const laws = {
  penal: { el: pcv, title: 'San Andreas Penal Code', short: 'Penal Code', url: 'https://forum.gta.world/en/topic/78852-san-andreas-penal-code/', query: '' },
  depa: { el: el('depa'), title: 'Drug Enforcement & Prevention Act of 2020 (DEPA)', short: 'DEPA', url: 'https://forum.gta.world/en/topic/30297-drug-enforcement-prevention-act-of-2020-depa/', query: '' },
  shaft: { el: el('shaft'), title: 'State Handling of All Firearms and Training Act of 2021 (SHAFT ACT)', short: 'SHAFT Act', url: 'https://forum.gta.world/en/topic/62646-state-handling-of-all-firearms-and-training-act-of-2021-shaft-act/', query: '' }
}

function allLawViews() {
  return Object.values(laws).map((law) => law.el).filter(Boolean)
}
const pcBar = el('pc-bar')
const pcSearch = el('pc-search')
const tabNav = el('tab-nav')
const quickBar = el('quick-bar')
const hdrCtl = el('hdr-ctl')
let activeTab = 'mdc'

function activeView() {
  return laws[activeTab] ? laws[activeTab].el : wv
}

const PAGE_PARTITION = 'persist:gtaw-mdc'
let pages = []
let pageSeq = 0
let activePageId = ''

function allPageViews() {
  return pages.map((p) => p.el).filter((v) => !!v)
}

function findPage(id) {
  return pages.filter((p) => p.id === id)[0] || null
}

function clipLabel(text) {
  const s = String(text || '').trim() || 'New page'
  return s.length > 22 ? s.slice(0, 21) + '\u2026' : s
}

function pathLabel(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part))
    if (!parts.length) return 'Dashboard'
    const last = parts[parts.length - 1]
    if (/^\d+$/.test(last)) {
      const kind = parts.length > 1 ? parts[parts.length - 2] : 'Record'
      return kind.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' #' + last
    }
    return last.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  } catch (_) {
    return ''
  }
}

function pageLabel(page) {
  const url = String((page && page.url) || '')
  const hit = navItems.filter((n) => n.url && n.url === url)[0]
  if (hit) return clipLabel(hit.label)
  let raw = String((page && page.title) || '')
    .replace(/\s*[-|]\s*GTA\s*World\s*$/i, '')
    .replace(/^\s*(MDC|Mobile Data Computer)\s*[-|:]\s*/i, '')
    .replace(/\s*[-|]\s*(MDC|Mobile Data Computer)\s*$/i, '')
    .trim()
  if (!raw || /^(mdc|mobile data computer)$/i.test(raw)) raw = pathLabel(url) || 'MDC'
  return clipLabel(raw)
}

function makePage(url) {
  const content = document.querySelector('.content')
  if (!content) return null
  pageSeq += 1
  const v = document.createElement('webview')
  v.setAttribute('id', 'mdc-p' + pageSeq)
  v.setAttribute('partition', PAGE_PARTITION)
  v.setAttribute('preload', '../webview-preload.js')
  v.setAttribute('allowpopups', '')
  v.setAttribute('src', url || HOME)
  v.className = 'wv-off'
  content.appendChild(v)
  const page = { id: 'page-' + pageSeq, el: v, title: 'New page', url: url || HOME }
  pages.push(page)
  wirePage(v, page)
  return page
}

function openPage(url) {
  const page = makePage(url || HOME)
  if (!page) return
  showTab('mdc')
  showPage(page.id)
  playSound('click')
}

function clearRecordDocks() {
  pages.forEach(page=>{clearTimeout(page.recordRestoreTimer);page.recordDock=[];page.recordQueue=[];page.pendingRecord=null})
  renderRecordDock()
}
function closeDockRecord(page,record) {
  page.recordDock=(page.recordDock||[]).filter(r=>r.key!==record.key)
  try {page.el.send('mdt:record-dock',{action:'close',id:record.id,record})} catch(_) {}
  renderRecordDock()
}
function requestDockRecord(page,record) {
  if(record.pending) return
  record.pending=true
  page.recordQueue=page.recordQueue||[]
  page.recordQueue.push(record.key)
  pumpRecordDock(page)
  renderRecordDock()
}
function sendDockRecord(page) {
  const record=(page.recordDock||[]).find(r=>r.key===page.pendingRecord?.key)
  if(!record) return
  clearTimeout(page.recordRestoreTimer)
  page.recordRestoreTimer=setTimeout(()=>finishDockRecord(page,{key:record.key,success:false}),15000)
  try {page.el.send('mdt:record-dock',{action:'restore',id:record.id,record})} catch(_) {finishDockRecord(page,{key:record.key,success:false})}
}
function pumpRecordDock(page) {
  if(page.pendingRecord) return
  const key=page.recordQueue?.shift()
  if(!key) return
  page.pendingRecord={key,fallback:false}
  sendDockRecord(page)
}
function finishDockRecord(page,result) {
  if(page.pendingRecord?.key!==result.key) return
  clearTimeout(page.recordRestoreTimer)
  const record=(page.recordDock||[]).find(r=>r.key===result.key)
  if(!result.success&&record&&!page.pendingRecord.fallback) {
    try {
      const url=new URL(record.url)
      if(url.protocol==='https:'&&url.hostname==='mdc.gta.world'&&url.href!==page.el.getURL()) {
        page.pendingRecord.fallback=true
        page.el.loadURL(url.href)
        return
      }
    } catch(_) {}
  }
  if(result.success) page.recordDock=page.recordDock.filter(r=>r.key!==result.key)
  else {if(record) record.pending=false;setStatus('Record could not be reopened. Its dock tab has been kept; try again.')}
  page.pendingRecord=null
  if(page.id===activePageId) renderRecordDock()
  pumpRecordDock(page)
}

function renderRecordDock() {
  const dock = document.getElementById('record-dock')
  if (!dock) return
  const page = findPage(activePageId)
  const records = activeTab === 'mdc' && page && page.recordDock || []
  dock.textContent = ''
  records.forEach(record => {
    const tab = document.createElement('div')
    tab.className = 'record-tab'+(record.active?' active':'')
    const restore = document.createElement('button')
    restore.className = 'record-restore'
    restore.textContent = '\u25a4 ' + record.title
    restore.title = record.title
    if (record.color) {tab.style.borderLeft = '3px solid '+record.color;tab.style.setProperty('--record-color',record.color)}
    const close = document.createElement('button')
    close.className = 'record-close'
    close.textContent = '\u00d7'
    close.setAttribute('aria-label','Close '+record.title)
    restore.disabled=!!record.pending
    close.disabled=!!record.pending
    restore.addEventListener('click',()=>requestDockRecord(page,record))
    close.addEventListener('click',()=>closeDockRecord(page,record))
    tab.append(restore,close)
    dock.appendChild(tab)
  })
  dock.classList.toggle('hidden',!records.length)
  document.dispatchEvent(new Event('mdc:chrome-changed'))
}

function showPage(id) {
  closeHeaderMenu()
  const page = findPage(id)
  if (!page || !page.el) return
  activePageId = page.id
  wv = page.el
  allPageViews().forEach((v) => {
    v.classList.toggle('wv-off', activeTab !== 'mdc' || v !== page.el)
  })
  renderPageBar()
  renderRecordDock()
  navCurrent = page.url
  renderNav()
  updateNav()
  document.dispatchEvent(new Event('mdc:chrome-changed'))
}

function closePage(id) {
  if (pages.length < 2) return
  const idx = pages.map((p) => p.id).indexOf(id)
  if (idx < 0) return
  const page = pages[idx]
  pages.splice(idx, 1)
  clearTimeout(page.recordRestoreTimer)
  const owner=pages[Math.max(0,idx-1)]
  if(owner) {
    owner.recordDock=owner.recordDock||[]
    ;(page.recordDock||[]).forEach(r=>{r.pending=false;if(!owner.recordDock.some(n=>n.key===r.key)) owner.recordDock.push(r)})
  }
  try {
    if (page.el && page.el.parentNode) page.el.parentNode.removeChild(page.el)
  } catch (_) {
  }
  const next = pages[Math.max(0, idx - 1)]
  if (next) showPage(next.id)
  playSound('close')
}

function renderPageBar() {
  const bar = el('page-bar')
  if (!bar) return
  bar.innerHTML = ''

  const cap = document.createElement('span')
  cap.className = 'pagecap'
  cap.textContent = 'Pages'
  bar.appendChild(cap)
  const row = document.createElement('div')
  row.className = 'pagerow'
  bar.appendChild(row)

  pages.forEach((p) => {
    const btn = document.createElement('button')
    btn.className = 'pagetab' + (p.id === activePageId ? ' active' : '')
    btn.title = p.title || 'Page'

    const label = document.createElement('span')
    label.className = 'pagelabel'
    label.textContent = pageLabel(p)
    btn.appendChild(label)

    if (pages.length > 1) {
      const x = document.createElement('span')
      x.className = 'pageclose'
      x.textContent = '\u2716'
      x.title = 'Close this page'
      on(x, 'click', (ev) => {
        if (ev && ev.stopPropagation) ev.stopPropagation()
        closePage(p.id)
      })
      btn.appendChild(x)
    }

    on(btn, 'click', () => showPage(p.id))
    row.appendChild(btn)
  })

  const add = document.createElement('button')
  add.className = 'pageadd'
  add.textContent = '+'
  add.title = 'Open another page (Ctrl+T)'
  on(add, 'click', () => openPage(HOME))
  row.appendChild(add)

  bar.classList.toggle('hidden', activeTab !== 'mdc')
}

const statusbar = el('statusbar')
const sbStatus = el('sb-status')
const sbTheme = el('sb-theme')
const sbClock = el('sb-clock')
const findbar = el('findbar')
const findInput = el('find-input')
const findCase = el('find-case')
const findCount = el('find-count')

const HOME = 'https://mdc.gta.world/'
const RECORD_URL = 'https://mdc.gta.world/record/'
const DMV_URL = 'https://mdc.gta.world/dmv/'

const APP_NAME = 'PatrolOne Mobile Client'
const REPO_URL = 'https://github.com/coopik/MDC-Client-GTA-W'

const SKIN_CLASSES = ['p1', 'p1dark', 'aero', 'aerolapd', 'aerodark', 'off']

const THEMES = {
  p1: 'PatrolOne default',
  p1dark: 'PatrolOne Dark',
  aero: 'Windows 7 Aero',
  aerolapd: 'Windows 7 Aero LAPD',
  aerodark: 'Windows 7 Aero Dark',
  off: 'Original MDC'
}

let appInfo = {}
const MIN_ZOOM = Math.log(.5) / Math.log(1.2)
const MAX_ZOOM = Math.log(2) / Math.log(1.2)
let zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(localStorage.getItem('mdc.zoom')) || 0))
let zoomFrame = 0

function setZoom(next) {
  if (!Number.isFinite(next)) return
  zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next))
  localStorage.setItem('mdc.zoom', String(zoom))
  const apply = () => {
    zoomFrame = 0
    allPageViews().concat(allLawViews()).forEach((v) => {
      try { v.setZoomLevel(zoom) } catch (_) {}
    })
    document.dispatchEvent(new Event('mdc:chrome-changed'))
  }
  if (typeof requestAnimationFrame === 'function') {
    if (!zoomFrame) zoomFrame = requestAnimationFrame(apply)
  } else apply()
  setStatus('Zoom: ' + Math.round(Math.pow(1.2, zoom) * 100) + '%')
}

function stepZoom(direction) {
  const percent = Math.round(Math.pow(1.2, zoom) * 10) * 10
  setZoom(Math.log(Math.max(50, Math.min(200, percent + direction * 10)) / 100) / Math.log(1.2))
}

function prefBool(key, dflt) {
  try {
    const v = localStorage.getItem('mdc.' + key)
    return v === null ? dflt : v === '1'
  } catch (_) {
    return dflt
  }
}

function prefStr(key, dflt) {
  try {
    const v = localStorage.getItem('mdc.' + key)
    return v === null ? dflt : v
  } catch (_) {
    return dflt
  }
}

function savePref(key, val) {
  try {
    localStorage.setItem('mdc.' + key, typeof val === 'boolean' ? (val ? '1' : '0') : String(val))
  } catch (_) {
  }
}

const view = {
  theme: (function () {
    const t = prefStr('theme', 'p1')
    const next = Object.hasOwn(THEMES, t) ? t : 'p1'
    savePref('theme', next)
    return next
  })(),

  statusBar: prefBool('statusBar', true),
  sidebar: prefBool('sidebar', false),
  navBar: prefBool('navBar', true),
  searchBoxes: prefBool('searchBoxes', true),
  quickLinks: prefBool('quickLinks', true),
  sounds: prefBool('sounds', false),
  historyLog: prefBool('historyLog', true),
  historyOnlySubjects: prefBool('historyOnlySubjects', false),
  updateCheck: prefBool('updateCheck', false),
  alertBadge: prefBool('alertBadge', true),
  alertReminder: prefBool('alertReminder', true),
  dragWindows: prefBool('dragWindows', true),
  discordPresence: prefBool('discordPresence', false),
  minimizeToTray: prefBool('minimizeToTray', false)
}

const p1State = { officer: '', apbs: null, state: 'Ready' }

function renderP1() {
  try {
    renderP1Now()
  } catch (_) {
  }
}

function renderP1Now() {
  const set = (id, text) => {
    const node = document.getElementById(id)
    if (node && node.textContent !== text) node.textContent = text
  }
  set('p1-unit', p1State.officer || 'Mobile Data Computer')
  set('p1-alerts', String(typeof alertCount === 'number' ? alertCount : 0))
  set('p1-apbs', p1State.apbs === null ? '-' : p1State.apbs.toLocaleString('en-US'))
  set('p1-pages', String(typeof pages !== 'undefined' && pages.length ? pages.length : 1))
  set('p1-state', p1State.state)
  const d = new Date()
  let tz = ''
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(d)
    const hit = parts.find((x) => x.type === 'timeZoneName')
    tz = hit ? ' ' + hit.value : ''
  } catch (_) {
  }
  set('p1-date', d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))
  set('p1-time', pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + tz)
}

function updateActionBar() {
  const current = activeView()
  const back = document.getElementById('p1a-back')
  const forward = document.getElementById('p1a-forward')
  let canBack = false
  let canForward = false
  try {
    canBack = !!current && typeof current.canGoBack === 'function' && current.canGoBack()
    canForward = !!current && typeof current.canGoForward === 'function' && current.canGoForward()
  } catch (_) {}
  if (back) back.disabled = !canBack
  if (forward) forward.disabled = !canForward
  ;[['p1a-map', /emergency map/i], ['p1a-paperwork', /paperwork/i]].forEach(([id, match]) => {
    const button = document.getElementById(id)
    if (button) button.disabled = !navItems.some((item) => match.test(item.label))
  })
}

function applyP1Chrome() {
  const on = view.theme !== 'off'
  const strip = document.getElementById('p1-status')
  const bar = document.getElementById('p1-actions')
  if (strip) strip.classList.toggle('hidden', !on)
  if (bar) bar.classList.toggle('hidden', !on)
  if (on) renderP1()
}

if (prefStr('navChips', '') !== '1') {
  view.navBar = true
  view.sidebar = false
  savePref('navBar', true)
  savePref('sidebar', false)
  savePref('navChips', '1')
}

if (view.theme !== 'off' && view.navBar && view.sidebar) {
  view.sidebar = false
  savePref('sidebar', false)
}

const SOUND_FILES = {
  click: 'sounds/click.mp3',
  close: 'sounds/close.mp3',
  error: 'sounds/error.mp3',
  nav: 'sounds/nav.mp3',
  open: 'sounds/open.mp3',
  notify: 'sounds/notify.mp3',
  alert: 'sounds/alert.mp3',
  save: 'sounds/save.mp3',
  startup: 'sounds/startup.mp3'
}

const CLOSE_ACTIONS = {
  back: true,
  stop: true,
  exit: true,
  signout: true
}

const NAV_ACTIONS = new Set(['home', 'newpage', 'reload', 'back', 'forward', 'tabmdc', 'tabpenal', 'tabdepa', 'tabshaft'])

const SOUND_GAP = {
  click: 320,
  close: 260,
  error: 700,
  nav: 180,
  open: 220,
  notify: 400,
  alert: 900,
  save: 300,
  startup: 5000
}

const soundCache = {}
const soundLast = {}
let soundAny = 0

function playSound(name) {
  if (!view.sounds) return
  const file = SOUND_FILES[name]
  if (!file || typeof Audio !== 'function') return
  const now = Date.now()
  if (now - (soundLast[name] || 0) < (SOUND_GAP[name] || 300)) return
  if (now - soundAny < 90) return
  soundLast[name] = now
  soundAny = now
  try {
    let audio = soundCache[name]
    if (!audio) {
      audio = new Audio(file)
      audio.volume = 0.5
      soundCache[name] = audio
    }
    if (!audio.paused && !audio.ended && audio.currentTime > 0) return
    audio.currentTime = 0
    const played = audio.play()
    if (played && played.catch) played.catch(() => {})
  } catch (_) {}
}

const CHECKABLE = [
  { id: 'mi-status', key: 'statusBar', label: 'Status Bar', accel: '' },
  { id: 'mi-sidebar', key: 'sidebar', label: 'MDC Side Panel', accel: 'F10' }
]

const THEME_ITEMS = [
  { id: 'mi-theme-p1', theme: 'p1', label: 'PatrolOne default Skin', accel: 'F8' },
  { id: 'mi-theme-p1dark', theme: 'p1dark', label: 'PatrolOne Dark Skin', accel: '' },
  { id: 'mi-theme-aero', theme: 'aero', label: 'Windows 7 Aero Skin', accel: '' },
  { id: 'mi-theme-aerolapd', theme: 'aerolapd', label: 'Windows 7 Aero LAPD Skin', accel: '' },
  { id: 'mi-theme-aerodark', theme: 'aerodark', label: 'Windows 7 Aero Dark Skin', accel: '' },
  { id: 'mi-theme-off', theme: 'off', label: 'Original MDC Skin', accel: '' }
]

function markItem(node, marked, label, accel) {
  if (!node) return
  node.textContent = ''
  node.appendChild(document.createTextNode((marked ? '\u2713 ' : '\u2007\u2007 ') + label))
  if (accel) {
    const a = document.createElement('span')
    a.className = 'accel'
    a.textContent = accel
    node.appendChild(a)
  }
}

function renderChecks() {
  CHECKABLE.forEach((item) => {
    const node = document.getElementById(item.id)
    markItem(node, view[item.key], item.label, item.accel)
    if (node && item.key === 'sidebar') node.classList.toggle('disabled', view.theme === 'off' || view.navBar)
  })
  THEME_ITEMS.forEach((item) => {
    markItem(document.getElementById(item.id), view.theme === item.theme, item.label, item.accel)
  })
}

function pushPresence() {
  if (!window.mdt || typeof window.mdt.setPresence !== 'function') return
  let where = 'Mobile Data Computer'
  try {
    if (laws[activeTab]) {
      where = 'Reading ' + laws[activeTab].short
    } else {
      const page = findPage(activePageId)
      if (page) where = pageLabel(page) || where
    }
  } catch (_) {
  }
  try {
    window.mdt.setPresence({
      enabled: !!view.discordPresence,
      details: 'Using the MDC',
      state: where
    })
  } catch (_) {
  }
}

function applyView() {
  if (view.theme !== 'off' && view.navBar && view.sidebar) {
    view.sidebar = false
    savePref('sidebar', false)
  }
  renderNav()
  renderQuickBar()
  if (hdrCtl) hdrCtl.classList.toggle('hidden', view.theme === 'off')
  if (view.theme === 'off') closeHeaderMenu()
  if (statusbar) statusbar.classList.toggle('hidden', !view.statusBar)
  SKIN_CLASSES.forEach((name) => {
    document.body.classList.toggle('theme-' + name, view.theme === name)
  })
  if (view.theme === 'p1dark') document.body.classList.add('theme-p1')
  if (sbTheme) sbTheme.textContent = 'Skin: ' + THEMES[view.theme]
  document.body.classList.toggle('dispatch-layout', view.theme !== 'off')
  document.body.classList.toggle('glass-layout', view.theme.startsWith('aero'))
  if (window.mdt && window.mdt.setWindowTheme) window.mdt.setWindowTheme(view.theme)
  applyP1Chrome()
  applySidebar()
  applyDrag()
  renderAlerts()
  pushPresence()
  applyTray()
  renderChecks()

  try {
    document.dispatchEvent(new Event('mdc:chrome-changed'))
  } catch (_) {
  }
}

function toggle(key) {
  if (key === 'sidebar' && view.theme !== 'off' && view.navBar) {
    setStatus('Side panel is unavailable while the navigation bar is on. Turn it off in Tools > Options.')
    playSound('alert')
    return
  }
  view[key] = !view[key]
  savePref(key, view[key])
  if (key === 'navBar' && view.navBar && view.sidebar) {
    view.sidebar = false
    savePref('sidebar', false)
  }
  applyView()
}

function setTheme(next) {
  view.theme = Object.hasOwn(THEMES, next) ? next : 'p1'
  savePref('theme', view.theme)
  applyView()
  applySkin()
}

function cycleTheme() {
  const order = Object.keys(THEMES)
  setTheme(order[(order.indexOf(view.theme) + 1) % order.length])
}

function applySkin() {
  allPageViews().forEach((v) => {
    try {
      v.send('mdt:set-skin', view.theme)
    } catch (_) {
    }
  })
  allLawViews().forEach((v) => {
    try { v.send('mdt:set-skin', view.theme) } catch (_) {}
  })
}

function applySidebar() {
  allPageViews().forEach((v) => {
    try {
      v.send('mdt:set-sidebar', !view.sidebar)
    } catch (_) {
    }
    try {
      v.send('mdt:set-search-boxes', !view.searchBoxes)
    } catch (_) {
    }
  })
}

function applyTray() {
  try {
    if (window.mdt && window.mdt.setTray) window.mdt.setTray(view.minimizeToTray)
  } catch (_) {
  }
}

function pad(n) { return String(n).padStart(2, '0') }

function tick() {
  if (!sbClock) return
  const d = new Date()
  sbClock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  if (view.theme !== 'off') renderP1()
}

function setStatus(t) {
  if (sbStatus) sbStatus.textContent = t
  p1State.state = String(t || '')
  renderP1()
}

function runName(value) {
  const q = String(value || '').trim()
  if (!q) return
  setStatus('Name check: ' + q)
  histAdd({ url: RECORD_URL + encodeURIComponent(q), label: q, kind: 'Name check', query: q })
  wv.loadURL(RECORD_URL + encodeURIComponent(q))
}

function runPlate(value) {
  const q = String(value || '').trim().replace(/[\s-]/g, '').toUpperCase()
  if (!q) return
  setStatus('Plate check: ' + q)
  histAdd({ url: DMV_URL + encodeURIComponent(q), label: q, kind: 'Plate check', query: q })
  wv.loadURL(DMV_URL + encodeURIComponent(q))
}

function nativeSearch(which) {
  try {
    wv.send('mdt:search', { which, value: '' })
    setStatus(which === 'vehicle' ? 'Search Vehicle' : 'Search Person')
  } catch (_) {
    setStatus('Page not ready')
  }
}

let findActive = false
let lastFindTerm = ''

function openFind() {
  if (!findbar) return
  findbar.classList.remove('hidden')
  if (findInput) { findInput.focus(); findInput.select() }
}

function clearMatches() {
  if (findCount) {
    findCount.textContent = ''
    findCount.classList.remove('nomatch')
  }
  if (findActive) {
    try { activeView().stopFindInPage('clearSelection') } catch (_) {  }
    findActive = false
  }
}

function closeFind() {
  if (findbar) findbar.classList.add('hidden')
  clearMatches()
  lastFindTerm = ''
}

function doFind(forward) {
  if (!findInput) return
  const term = findInput.value
  if (!term) { clearMatches(); return }
  const opts = { forward: forward !== false, matchCase: !!(findCase && findCase.checked) }
  if (findActive && term === lastFindTerm) opts.findNext = true
  else {
    if (findActive) { try { activeView().stopFindInPage('clearSelection') } catch (_) {  } }
    lastFindTerm = term
  }
  try {
    activeView().findInPage(term, opts)
    findActive = true
  } catch (_) {
    if (findCount) findCount.textContent = 'Page not ready'
  }
}

function findOpen() { return !!(findbar && !findbar.classList.contains('hidden')) }

let backdrop = el('modal-backdrop')
let dialogTitle = el('dialog-title-text')
let dialogBody = el('dialog-body')
const dialogRoots = backdrop ? [backdrop] : []
const dialogTemplate = backdrop && typeof backdrop.cloneNode === 'function' ? backdrop.cloneNode(true) : null
let dialogLevel = 200


let dragPos = null
let dialogDragFrame = 0

function dialogEl() {
  return backdrop ? backdrop.querySelector('.dialog') : null
}

function resetDialogPos() {
  endDialogDrag()
  endDialogResize()
  const box = dialogEl()
  if (!box) return
  if (box.mdtDialogSize) {
    box.mdtDialogSize.forEach(([prop, value]) => { box.style[prop] = value })
    delete box.mdtDialogSize
  }
  box.style.left = ''
  box.style.top = ''
  box.style.position = ''
  box.style.transform = ''
  box.classList.remove('dragged')
}

function startDialogDrag(e) {
  if (!view.dragWindows || !e || e.button !== 0) return
  const box = dialogEl()
  if (!box || (e.target.closest && e.target.closest('button'))) return
  const rect = box.getBoundingClientRect()
  box.classList.add('dragged')
  box.style.willChange = 'transform'
  box.style.position = 'fixed'
  box.style.left = rect.left + 'px'
  box.style.top = rect.top + 'px'
  box.style.transform = ''
  const handle = e.currentTarget
  handle.setPointerCapture(e.pointerId)
  const header = handle.getBoundingClientRect()
  dragPos = { sx:e.clientX, sy:e.clientY, left:header.left, top:header.top, width:header.width, height:header.height, box, handle, pointer:e.pointerId, x:0, y:0 }
  e.preventDefault()
}

function paintDialogDrag() {
  dialogDragFrame = 0
  if (!dragPos) return
  dragPos.box.style.transform = 'translate3d(' + dragPos.x + 'px,' + dragPos.y + 'px,0)'
}

function moveDialogDrag(e) {
  if (!dragPos || e.pointerId !== dragPos.pointer) return
  dragPos.x = Math.min(Math.max(e.clientX - dragPos.sx, -dragPos.left), Math.max(0, innerWidth - dragPos.width) - dragPos.left)
  dragPos.y = Math.min(Math.max(e.clientY - dragPos.sy, -dragPos.top), Math.max(0, innerHeight - dragPos.height) - dragPos.top)
  if (!dialogDragFrame) dialogDragFrame = requestAnimationFrame(paintDialogDrag)
}

function endDialogDrag() {
  if (!dragPos) return
  if (dialogDragFrame) cancelAnimationFrame(dialogDragFrame)
  paintDialogDrag()
  dragPos.box.style.willChange = ''
  if (dragPos.handle.hasPointerCapture(dragPos.pointer)) dragPos.handle.releasePointerCapture(dragPos.pointer)
  dragPos = null
}

let dialogResize = null
let dialogResizeFrame = 0

function startDialogResize(e) {
  if (e.button !== 0) return
  const box = e.currentTarget.closest('.dialog')
  if (box.classList.contains('fixed-size')) return
  const r = box.getBoundingClientRect()
  if (!box.mdtDialogSize) box.mdtDialogSize = ['width','height','maxWidth','maxHeight'].map(prop=>[prop,box.style[prop]])
  box.style.position = 'fixed'
  box.style.left = r.left+'px'
  box.style.top = r.top+'px'
  box.style.transform = ''
  const handle = e.currentTarget
  const header = box.querySelector('.dialog-title').getBoundingClientRect()
  const footer = box.querySelector('.dialog-buttons').getBoundingClientRect()
  dialogResize = {box,handle,id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,width:r.width,height:r.height,minHeight:header.height+footer.height+40,nextWidth:r.width,nextHeight:r.height}
  handle.setPointerCapture(e.pointerId)
  handle.setAttribute('data-resizing','1')
  e.preventDefault()
}

function paintDialogResize() {
  dialogResizeFrame = 0
  if (!dialogResize) return
  const state = dialogResize
  state.box.style.maxWidth = 'none'
  state.box.style.maxHeight = 'none'
  state.box.style.width = state.nextWidth+'px'
  state.box.style.height = state.nextHeight+'px'
}

function moveDialogResize(e) {
  if (!dialogResize || e.pointerId !== dialogResize.id) return
  const state = dialogResize
  const minWidth = Math.min(280,innerWidth)
  state.nextWidth = Math.min(Math.max(minWidth,state.width+e.clientX-state.x),Math.max(minWidth,innerWidth-state.left))
  state.nextHeight = Math.min(Math.max(state.minHeight,state.height+e.clientY-state.y),Math.max(state.minHeight,innerHeight-state.top))
  if (!dialogResizeFrame) dialogResizeFrame = requestAnimationFrame(paintDialogResize)
  e.preventDefault()
}

function endDialogResize() {
  if (!dialogResize) return
  if (dialogResizeFrame) cancelAnimationFrame(dialogResizeFrame)
  paintDialogResize()
  const state = dialogResize
  state.handle.removeAttribute('data-resizing')
  if (state.handle.hasPointerCapture(state.id)) state.handle.releasePointerCapture(state.id)
  dialogResize = null
}

function applyDrag() {
  allPageViews().forEach((v) => {
    try {
      v.send('mdt:set-drag', !!view.dragWindows)
    } catch (_) {
    }
  })
  try {
    allLawViews().forEach((v) => { try { v.send('mdt:set-drag', !!view.dragWindows) } catch (_) {} })
  } catch (_) {
  }
}

function rememberDialogIds(root) {
  const index = dialogRoots.indexOf(root)
  const nodes = [root].concat(Array.from(root.querySelectorAll('[id]')))
  nodes.forEach((node) => {
    const alias = node.dataset.dialogId || node.id
    if (!alias) return
    node.dataset.dialogId = alias
    node.id = root === backdrop ? alias : alias + '-window-' + index
  })
  root.querySelectorAll('label[for]').forEach((label) => {
    const alias = label.dataset.dialogFor || label.getAttribute('for')
    label.dataset.dialogFor = alias
    label.setAttribute('for', root === backdrop ? alias : alias + '-window-' + index)
  })
}

function activateDialog(root) {
  if (!root) return
  backdrop = root
  dialogRoot = root
  dialogRoots.forEach(rememberDialogIds)
  dialogTitle = root.querySelector('[data-dialog-id="dialog-title-text"]') || el('dialog-title-text')
  dialogBody = root.querySelector('[data-dialog-id="dialog-body"]') || el('dialog-body')
  root.style.zIndex = String(++dialogLevel)
}

function wireDialog(root) {
  const close = root.querySelector('.dialog-close')
  const ok = root.querySelector('.dialog-buttons button')
  on(close, 'click', () => closeDialog(root))
  on(ok, 'click', () => closeDialog(root))
  on(root.querySelector('.dialog-title'), 'pointerdown', startDialogDrag)
  const grip = document.createElement('div')
  grip.className = 'dialog-resize'
  grip.title = 'Drag to resize'
  root.querySelector('.dialog').appendChild(grip)
  on(grip, 'pointerdown', startDialogResize)
}

function openDialog(title, html) {
  closeHeaderMenu()
  if (!backdrop) return
  let root = dialogRoots.find((node) => !node.classList.contains('hidden') && node.dataset.dialogTitle === title)
  if (!root) root = dialogRoots.find((node) => node.classList.contains('hidden'))
  if (!root && dialogTemplate) {
    root = dialogTemplate.cloneNode(true)
    dialogRoots.push(root)
    document.body.appendChild(root)
    wireDialog(root)
  }
  activateDialog(root || backdrop)
  backdrop.dataset.dialogTitle = title
  if (dialogTitle) dialogTitle.textContent = title
  if (dialogBody) dialogBody.innerHTML = html
  rememberDialogIds(backdrop)
  resetDialogPos()
  dialogEl().classList.toggle('fixed-size', !/^(History|Options|Keyboard Shortcuts|Layout Report)$/.test(title))
  backdrop.classList.remove('hidden')
}

function closeDialog(root) {
  const target = root && root.classList ? root : backdrop
  endDialogDrag()
  endDialogResize()
  if (target) target.classList.add('hidden')
  const remaining = dialogRoots.filter((node) => !node.classList.contains('hidden')).sort((a,b) => Number(b.style.zIndex)-Number(a.style.zIndex))
  if (remaining.length) activateDialog(remaining[0])
}

function row(label, value) {
  return '<tr><td class="field-label">' + label + '</td><td>' + value + '</td></tr>'
}

function showLayoutReport(r) {
  if (r.error) {
    openDialog('Layout Report', '<p>Could not measure the page: ' + r.error + '</p>')
    return
  }

  const host = wv ? wv.clientWidth + ' x ' + wv.clientHeight : 'n/a'
  const win = window.innerWidth + ' x ' + window.innerHeight

  let html = '<table>' +
    row('Window:', win) +
    row('Embedded view:', host) +
    row('Page viewport:', r.viewport || '?') +
    row('Page document:', r.document || '?') +
    row('Page body:', r.body || '?') +
    row('Document height:', r.ratio || '?') +
    row('Skin:', THEMES[r.skin] || r.skin || '?') +
    '</table>'

  if (r.tall && r.tall.length) {
    html += '<p>Elements taller than the viewport:</p><table>'
    r.tall.forEach((t) => { html += row(t.name + ':', t.height + 'px (' + t.css + ')') })
    html += '</table>'
  } else {
    html += '<p>No element is taller than the viewport.</p>'
  }

  html += '<p>The embedded view and the page viewport should match the window. ' +
    'If they do not, the shell is sizing the view wrongly; if they match but the ' +
    'document is several times the viewport, an element on the page is overlong.</p>'

  openDialog('Layout Report', html)
}

function wakeViews() {
  const v = activeView()
  try {
    document.dispatchEvent(new Event('mdc:chrome-changed'))
  } catch (_) {
  }
  if (!v || !v.classList) return
  v.classList.add('wv-off')
  const back = () => {
    v.classList.remove('wv-off')
    try {
      document.dispatchEvent(new Event('mdc:chrome-changed'))
      v.focus()
    } catch (_) {
    }
  }
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(back)
  else setTimeout(back, 16)
}

const HISTORY_KEY = 'mdtHistory'
const HISTORY_MAX = 800
let histList = []

function histLoad() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const list = raw ? JSON.parse(raw) : []
    histList = Array.isArray(list) ? list : []
  } catch (_) {
    histList = []
  }
}

function histSave() {
  renderQuickBar()
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(histList.slice(0, HISTORY_MAX)))
  } catch (_) {
  }
}

function histKind(url) {
  const u = String(url || '')
  if (/\/map(\/|$|\?|#)/.test(u)) return 'Map'
  if (/\/record\/[^/?#]+/.test(u)) return 'Record'
  if (/\/person\/[^/?#]+/.test(u)) return 'Record'
  if (/\/dmv\/[^/?#]+/.test(u)) return 'Vehicle'
  if (/\/dmv/.test(u)) return 'DMV database'
  if (/\/warrants?\/[0-9][^/?#]*/.test(u)) return 'Warrant'
  if (/warrant/.test(u)) return 'Warrants list'
  if (/\/emergency\/[0-9]/.test(u) || /incident\/[0-9]/.test(u)) return 'Incident'
  if (/\/emergency/.test(u) || /incident/.test(u)) return 'Incident list'
  if (/\/apb\/[0-9]/.test(u)) return 'APB'
  if (/\/apb/.test(u)) return 'APB list'
  if (/\/lookup/.test(u)) return 'Lookup'
  if (/forum\.gta\.world/.test(u)) return 'Penal code'
  return 'Page'
}

const HIST_SUBJECT_KINDS = {
  Record: true,
  Vehicle: true,
  'Name check': true,
  'Plate check': true,
  Warrant: true
}

function histAdd(entry) {
  if (!view.historyLog) return
  if (view.historyOnlySubjects) {
    const k = (entry && entry.kind) || histKind(String((entry && entry.url) || ''))
    if (!HIST_SUBJECT_KINDS[k]) return
  }
  const url = String((entry && entry.url) || '')
  if (!/^https?:/i.test(url)) return
  const label = String((entry && entry.label) || '')
  const now = Date.now()
  const top = histList[0]
  if (top && top.url === url && now - top.at < 5000) {
    if (label) top.label = label
    histSave()
    return
  }
  histList.unshift({
    url,
    label,
    kind: (entry && entry.kind) || histKind(url),
    query: (entry && entry.query) || '',
    at: now
  })
  if (histList.length > HISTORY_MAX) histList.length = HISTORY_MAX
  histSave()
}

function histLabel(url, label) {
  if (!view.historyLog) return
  const u = String(url || '')
  const text = String(label || '')
  if (!u || !text) return
  for (let i = 0; i < 12 && i < histList.length; i++) {
    if (histList[i].url === u) {
      if (!histList[i].label || histList[i].label.length < text.length) histList[i].label = text
      histSave()
      return
    }
  }
}

function histWhen(at) {
  const d = new Date(at || 0)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => (n < 10 ? '0' + n : String(n))
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const time = pad(d.getHours()) + ':' + pad(d.getMinutes())
  if (sameDay) return 'Today ' + time
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + time
}

function esc(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function histMatch(entry, q) {
  if (!q) return true
  const hay = (entry.label + ' ' + entry.kind + ' ' + entry.query + ' ' + entry.url + ' ' + histWhen(entry.at)).toLowerCase()
  return q.split(/\s+/).filter(Boolean).every((word) => hay.indexOf(word) !== -1)
}

function showHistory() {
  openDialog('History',
    '<div class="hist-tools">' +
    '<label class="fld-label" for="hist-q">Search history:</label>' +
    '<input type="text" id="hist-q" class="fld" size="30" placeholder="Name, plate, record number, page or date">' +
    '<label class="fld-label" for="hist-kind">Show:</label>' +
    '<select class="fld" id="hist-kind"><option value="">All visits</option><option value="subjects">Subjects and vehicles</option><option value="incidents">Incidents and warrants</option></select>' +
    '<span class="tspacer"></span>' +
    '<button class="btn-sm" id="hist-clear">Clear History</button>' +
    '</div>' +
    '<div class="hist-count" id="hist-count"></div>' +
    '<div class="hist-list" id="hist-list"></div>' +
    '<div class="hist-pager" id="hist-pager">' +
    '<button class="btn-sm" id="hist-first" title="First page">&#171;</button>' +
    '<button class="btn-sm" id="hist-prev" title="Previous page">&#8249;</button>' +
    '<span class="hist-page" id="hist-page"></span>' +
    '<button class="btn-sm" id="hist-next" title="Next page">&#8250;</button>' +
    '<button class="btn-sm" id="hist-last" title="Last page">&#187;</button>' +
    '<span class="tspacer"></span>' +
    '<label class="fld-label" for="hist-size">Per page:</label>' +
    '<select class="fld" id="hist-size">' +
    '<option value="25">25</option>' +
    '<option value="50" selected>50</option>' +
    '<option value="100">100</option>' +
    '<option value="200">200</option>' +
    '</select>' +
    '</div>' +
    '<p class="opt-note">Every page and record you open in this client is logged on this computer only, with the time you opened it. ' +
    'Left-click an entry to open it in the page in front, right-click to open it as a new page. ' +
    'Logging can be turned off under Tools &gt; Options.</p>')

  const input = el('hist-q')
  const list = el('hist-list')
  const count = el('hist-count')
  const pager = el('hist-pager')
  const pageLabel = el('hist-page')
  const sizeSel = el('hist-size')
  let page = 1
  let perPage = 50

  function histRows() {
    const q = (input && input.value ? input.value : '').trim().toLowerCase()
    const kind = el('hist-kind')
    const filter = kind ? kind.value : ''
    return histList.filter((entry) => histMatch(entry, q) && (!filter || (filter === 'subjects' ? /^(Record|Vehicle|Name check|Plate check)$/.test(entry.kind) : /^(Incident|Warrant|APB)$/.test(entry.kind))))
  }

  function paint() {
    const rows = histRows()
    const pages = Math.max(1, Math.ceil(rows.length / perPage))
    if (page > pages) page = pages
    if (page < 1) page = 1
    const from = (page - 1) * perPage
    const shown = rows.slice(from, from + perPage)
    if (count) {
      count.textContent = histList.length
        ? (rows.length
          ? 'Showing ' + (from + 1) + ' to ' + (from + shown.length) + ' of ' + rows.length +
            ' entries (' + histList.length + ' logged in total)'
          : '0 of ' + histList.length + ' entries')
        : 'Nothing logged yet.'
    }
    if (pageLabel) pageLabel.textContent = 'Page ' + page + ' of ' + pages
    if (pager) pager.style.display = rows.length ? '' : 'none'
    const firstB = el('hist-first')
    const prevB = el('hist-prev')
    const nextB = el('hist-next')
    const lastB = el('hist-last')
    if (firstB) firstB.disabled = page <= 1
    if (prevB) prevB.disabled = page <= 1
    if (nextB) nextB.disabled = page >= pages
    if (lastB) lastB.disabled = page >= pages
    if (!list) return
    if (!rows.length) {
      list.innerHTML = '<div class="hist-empty">No entries match.</div>'
      return
    }
    list.scrollTop = 0
    list.innerHTML = shown.map((entry) =>
      '<button type="button" class="hist-row" data-url="' + esc(entry.url) + '" title="' + esc(entry.url) + '">' +
      '<img class="hist-icon" src="' + navIcon(entry.kind === 'Record' ? 'Person' : entry.kind) + '" alt="">' +
      '<span class="hist-when">' + esc(histWhen(entry.at)) + '</span>' +
      '<span class="hist-kind">' + esc(entry.kind || 'Page') + '</span>' +
      '<span class="hist-what">' + esc(entry.label || entry.query || entry.url) + '</span>' +
      '</button>').join('')
  }

  on(el('hist-kind'), 'change', () => { page = 1; paint() })
  if (input) {
    input.addEventListener('input', () => {
      page = 1
      paint()
    })
    setTimeout(() => input.focus(), 0)
  }

  function gotoPage(target) {
    page = target
    paint()
    playSound('click')
  }

  const firstBtn = el('hist-first')
  const prevBtn = el('hist-prev')
  const nextBtn = el('hist-next')
  const lastBtn = el('hist-last')
  if (firstBtn) firstBtn.addEventListener('click', () => gotoPage(1))
  if (prevBtn) prevBtn.addEventListener('click', () => gotoPage(page - 1))
  if (nextBtn) nextBtn.addEventListener('click', () => gotoPage(page + 1))
  if (lastBtn) lastBtn.addEventListener('click', () => gotoPage(Math.max(1, Math.ceil(histRows().length / perPage))))
  if (sizeSel) {
    sizeSel.addEventListener('change', () => {
      const n = parseInt(sizeSel.value, 10)
      perPage = n > 0 ? n : 50
      page = 1
      paint()
    })
  }

  if (list) {
    list.addEventListener('click', (ev) => {
      const row = ev.target && ev.target.closest ? ev.target.closest('.hist-row') : null
      if (!row) return
      const url = row.getAttribute('data-url')
      if (!url) return
      closeDialog()
      if (/forum\.gta\.world/.test(url)) {
        const lawKey = Object.keys(laws).find((key) => url.startsWith(laws[key].url)) || 'penal'
        showTab(lawKey)
      } else {
        showTab('mdc')
        try {
          activeView().loadURL(url)
        } catch (_) {
        }
      }
      playSound('nav')
    })
    list.addEventListener('contextmenu', (ev) => {
      const row = ev.target && ev.target.closest ? ev.target.closest('.hist-row') : null
      if (!row) return
      ev.preventDefault()
      const url = row.getAttribute('data-url')
      if (!url) return
      closeDialog()
      openPage(url)
      playSound('open')
    })
  }

  const clear = el('hist-clear')
  if (clear) {
    clear.addEventListener('click', () => {
      histList = []
      histSave()
      paint()
      setStatus('History cleared')
      playSound('close')
    })
  }

  paint()
  playSound('open')
}

function promptLookup(which) {
  const plate = which === 'plate'
  openDialog(plate ? 'Plate Check' : 'Name Check',
    '<p class="opt-note">' + (plate
      ? 'Registration plate to run against the DMV database.'
      : 'Full name of the subject to run against records.') + '</p>' +
    '<div class="hist-tools">' +
    '<input type="text" class="fld" id="ask-q" size="26" placeholder="' +
    (plate ? 'ULX103' : 'Firstname Lastname') + '">' +
    '<button class="btn-sm" id="ask-go">Run</button>' +
    '</div>')
  const input = el('ask-q')
  const submit = () => {
    if (!input) return
    const q = input.value.trim()
    if (!q) { input.focus(); return }
    closeDialog()
    if (plate) runPlate(q)
    else runName(q)
  }
  on(el('ask-go'), 'click', submit)
  on(input, 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } })
  if (input) { input.focus(); input.select() }
}

const KEY_ACTIONS = [
  { action: 'keyhelp', label: 'Keyboard shortcuts', combo: 'F1' },
  { action: 'tabmdc', label: 'Mobile Data Computer tab', combo: 'Ctrl+1' },
  { action: 'tabpenal', label: 'Penal Code tab', combo: 'Ctrl+2' },
  { action: 'tabdepa', label: 'DEPA tab', combo: 'Ctrl+3' },
  { action: 'tabshaft', label: 'SHAFT Act tab', combo: 'Ctrl+4' },
  { action: 'findnext', label: 'Find next', combo: 'F3' },
  { action: 'reload', label: 'Reload page', combo: 'F5' },
  { action: 'cycletheme', label: 'Next skin', combo: 'F8' },
  { action: 'togglesidebar', label: 'Show or hide the MDC side panel', combo: 'F10' },
  { action: 'find', label: 'Find on page', combo: 'Ctrl+F' },
  { action: 'namecheck', label: 'Name check window', combo: 'Ctrl+N' },
  { action: 'platecheck', label: 'Plate check window', combo: 'Ctrl+L' },
  { action: 'history', label: 'History', combo: 'Ctrl+H' },
  { action: 'newpage', label: 'Open another page', combo: 'Ctrl+T' },
  { action: 'closepage', label: 'Close the page in front', combo: 'Ctrl+W' },
  { action: 'back', label: 'Back', combo: 'Alt+Left' },
  { action: 'forward', label: 'Forward', combo: 'Alt+Right' },
  { action: 'zoomin', label: 'Zoom in', combo: 'Ctrl++' },
  { action: 'zoomout', label: 'Zoom out', combo: 'Ctrl+-' },
  { action: 'zoomreset', label: 'Actual size', combo: 'Ctrl+0' },
  { action: 'options', label: 'Options', combo: 'Ctrl+,' }
]

const KEYMAP_KEY = 'mdtKeymap'
let keymap = {}

function keysLoad() {
  try {
    const raw = window.localStorage.getItem(KEYMAP_KEY)
    keymap = raw ? (JSON.parse(raw) || {}) : {}
  } catch (_) {
    keymap = {}
  }
}

function keysSave() {
  try {
    window.localStorage.setItem(KEYMAP_KEY, JSON.stringify(keymap))
  } catch (_) {
  }
}

function keyItem(action) {
  const items = keyActions()
  for (let i = 0; i < items.length; i++) {
    if (items[i].action === action) return items[i]
  }
  return null
}

function comboFor(action) {
  const item = keyItem(action)
  return Object.hasOwn(keymap, action) ? keymap[action] : (item ? item.combo : '')
}

function comboOf(e) {
  return window.mdtInput.comboOf(e)
}

function navAction(item) {
  try { const url = new URL(item.url); return 'nav:' + url.pathname + url.search } catch (_) { return 'nav:' + item.url }
}

function keyActions() {
  return KEY_ACTIONS.concat(navItems.map((item) => ({ action: navAction(item), label: 'Navigation: ' + item.label, combo: '' })))
}

function actionForCombo(combo) {
  if (!combo) return ''
  const want = combo.toLowerCase()
  const items = keyActions()
  for (let i = 0; i < items.length; i++) {
    if (comboFor(items[i].action).toLowerCase() === want) return items[i].action
  }
  return ''
}

function comboOfMouse(e) {
  if (!e || typeof e.button !== 'number') return ''
  const n = e.button + 1
  if (n !== 2 && n !== 4 && n !== 5) return ''
  return 'Mouse' + n
}

function mouseLabel(combo) {
  if (combo === 'Mouse2') return 'Middle mouse button'
  if (combo === 'Mouse4') return 'Mouse button 4 (back)'
  if (combo === 'Mouse5') return 'Mouse button 5 (forward)'
  return combo
}

function keysForViews() {
  const plain = {}
  const ctrl = {}
  const mouse = {}
  const combos = {}
  keyActions().forEach((item) => {
    const combo = comboFor(item.action)
    if (combo) combos[combo] = item.action
    const single = /^Ctrl\+(.)$/i.exec(combo)
    if (/^Mouse[245]$/i.test(combo)) mouse[combo] = item.action
    else if (/^F\d+$/i.test(combo)) plain[combo.toUpperCase()] = item.action
    else if (single) ctrl[single[1].toLowerCase()] = item.action
  })
  if (ctrl['+']) ctrl['='] = ctrl['+']
  return { plain, ctrl, mouse, combos }
}

function sendKeys() {
  document.querySelectorAll('.menu-item[data-action]').forEach((item) => {
    const action = item.getAttribute('data-action')
    if (!keyItem(action)) return
    let label = item.querySelector('.accel')
    const combo = comboFor(action)
    if (!label && combo) { label = document.createElement('span'); label.className = 'accel'; item.appendChild(label) }
    if (label) label.textContent = mouseLabel(combo)
  })
  const payload = keysForViews()
  allPageViews().forEach((v) => {
    try {
      v.send('mdt:set-keys', payload)
    } catch (_) {
    }
  })
  try {
    allLawViews().forEach((v) => { try { v.send('mdt:set-keys', payload) } catch (_) {} })
  } catch (_) {
  }
}

function showKeys() {
  const rows = keyActions().map((item) =>
    '<tr><td>' + esc(item.label) + '</td>' +
    '<td class="key-combo">' + esc(/^Mouse[245]$/.test(comboFor(item.action)) ? mouseLabel(comboFor(item.action)) : comboFor(item.action)) + '</td>' +
    '<td><button class="btn-sm key-set" data-key="' + esc(item.action) + '">Change</button> <button class="btn-sm key-clear" data-key="' + esc(item.action) + '">Clear</button></td></tr>'
  ).join('')

  openDialog('Keyboard Shortcuts',
    '<p class="opt-note">These work in the client and inside MDC pages. Press ' +
    'Change and then the combination you want; Escape cancels. Mouse buttons ' +
    'work too: press the middle button or a side button instead of a key. Escape itself ' +
    'always closes the find bar, a dialog or a loading page and cannot be ' +
    'remapped.</p>' +
    '<table class="key-table">' + rows + '</table>' +
    '<div class="hist-tools">' +
    '<button class="btn-sm" id="key-reset">Reset to defaults</button>' +
    '<span class="hist-count" id="key-status"></span>' +
    '</div>')

  if (!dialogBody) return
  const status = el('key-status')
  const arm = (action, btn) => {
    if (status) status.textContent = 'Press the new combination...'
    btn.textContent = 'Press key'
    const stop = () => {
      document.removeEventListener('keydown', handler, true)
      document.removeEventListener('mousedown', mouseHandler, true)
      document.removeEventListener('auxclick', swallow, true)
    }
    const assign = (combo) => {
      stop()
      const clash = actionForCombo(combo)
      if (clash && clash !== action) keymap[clash] = ''
      const item = keyItem(action)
      if (item && item.combo.toLowerCase() === combo.toLowerCase()) delete keymap[action]
      else keymap[action] = combo
      keysSave()
      sendKeys()
      renderNav()
      showKeys()
      const after = el('key-status')
      if (after) {
        after.textContent = (/^Mouse[245]$/.test(combo) ? mouseLabel(combo) : combo) +
          ' assigned' + (clash && clash !== action ? ', taken from ' + clash : '') + '.'
      }
    }
    const handler = (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      if (ev.key === 'Escape') {
        stop()
        showKeys()
        return
      }
      const combo = comboOf(ev)
      if (!combo) return
      assign(combo)
    }
    const mouseHandler = (ev) => {
      const combo = comboOfMouse(ev)
      if (!combo) return
      ev.preventDefault()
      ev.stopPropagation()
      assign(combo)
    }
    const swallow = (ev) => {
      if (!comboOfMouse(ev)) return
      ev.preventDefault()
      ev.stopPropagation()
    }
    document.addEventListener('keydown', handler, true)
    document.addEventListener('mousedown', mouseHandler, true)
    document.addEventListener('auxclick', swallow, true)
  }
  dialogBody.querySelectorAll('.key-set').forEach((btn) => {
    on(btn, 'click', () => arm(btn.getAttribute('data-key'), btn))
  })
  dialogBody.querySelectorAll('.key-clear').forEach((btn) => {
    on(btn, 'click', () => { keymap[btn.getAttribute('data-key')] = ''; keysSave(); sendKeys(); renderNav(); showKeys() })
  })
  on(el('key-reset'), 'click', () => {
    keymap = {}
    keysSave()
    sendKeys()
    renderNav()
    showKeys()
    const after = el('key-status')
    if (after) after.textContent = 'Defaults restored.'
  })
}

let lastUpdate = null

function renderUpdate(res) {
  const panel = el('upd-panel')
  if (!panel) return
  if (!res || !res.ok || !res.newer) { panel.innerHTML = ''; return }
  const size = res.asset && res.asset.size
    ? ' (' + Math.round(res.asset.size / 104857.6) / 10 + ' MB)'
    : ''
  panel.innerHTML =
    '<p class="opt-note"><b>Version ' + esc(res.latest) + ' is available.</b>' +
    (res.notes ? '<br>' + esc(res.notes.slice(0, 300)) : '') + '</p>' +
    '<div class="hist-tools">' +
    '<button class="btn-sm" id="upd-go">Update Now' + size + '</button>' +
    '<button class="btn-sm" id="upd-page">Open Release Page</button>' +
    '<span class="hist-count" id="upd-note"></span>' +
    '</div>'
  on(el('upd-page'), 'click', () => window.mdt.openExternal(res.page))
  on(el('upd-go'), 'click', () => installUpdate(res))
}

async function installUpdate(res) {
  const note = el('upd-note')
  if (!res.asset || !res.asset.url) {
    window.mdt.openExternal(res.page)
    return
  }
  if (note) note.textContent = 'Downloading ' + res.asset.name + '...'
  let out = null
  try {
    out = await window.mdt.installUpdate(res.asset)
  } catch (err) {
    out = { ok: false, error: String(err) }
  }
  if (out && out.ok) {
    if (note) note.textContent = 'Installer started. The client will close.'
    playSound('save')
    return
  }
  if (note) note.textContent = 'Download failed: ' + ((out && out.error) || 'unknown error')
  playSound('error')
}

async function runUpdateCheck(quiet) {
  const status = el('upd-status')
  if (status) status.textContent = 'Checking...'
  let res = null
  try {
    res = await window.mdt.checkUpdates()
  } catch (err) {
    res = { ok: false, error: String(err) }
  }
  lastUpdate = res
  if (!res || !res.ok) {
    if (status) status.textContent = 'Could not check: ' + ((res && res.error) || 'no answer')
    if (!quiet) playSound('error')
    return res
  }
  if (status) {
    status.textContent = res.newer
      ? 'Version ' + res.latest + ' is available.'
      : 'Up to date (' + res.latest + ').'
  }
  if (res.newer) {
    setStatus('Update available: version ' + res.latest)
    playSound('notify')
    if (quiet) showAbout()
    renderUpdate(res)
  }
  return res
}

function showAbout() {
  openDialog('About ' + APP_NAME,
    '<table>' +
    row('Product:', APP_NAME) +
    row('Version:', appInfo.version || '1.0.1') +
    row('Runtime:', 'Electron ' + (appInfo.electron || '') + ' / Chromium ' + (appInfo.chrome || '')) +
    row('Endpoint:', HOME) +
    '</table>' +
    '<p>Desktop client for the GTA World Web MDC. Sign-in is handled by the MDC site itself; ' +
    'no credentials are stored by this application.</p>' +
    '<div class="hist-tools">' +
    '<button class="btn-sm" id="upd-check">Check for Updates</button>' +
    '<button class="btn-sm" id="upd-repo">Project Page</button>' +
    '<span class="hist-count" id="upd-status"></span>' +
    '</div>' +
    '<div id="upd-panel"></div>')
  on(el('upd-check'), 'click', () => runUpdateCheck(false))
  on(el('upd-repo'), 'click', () => window.mdt.openExternal(REPO_URL))
  if (lastUpdate && lastUpdate.ok && lastUpdate.newer) renderUpdate(lastUpdate)
}

function showOptions() {
  const radio = (t) =>
    '<label class="opt-row"><input type="radio" name="opt-theme" value="' + t + '"' +
    (view.theme === t ? ' checked' : '') + '> ' + THEMES[t] + '</label>'

  const check = (key, label, locked) =>
    '<label class="opt-row' + (locked ? ' opt-off' : '') + '"><input type="checkbox" data-opt="' + key + '"' +
    (view[key] ? ' checked' : '') + (locked ? ' disabled' : '') + '> ' + label + '</label>'

  openDialog('Options',
    '<fieldset class="opt-group"><legend>Appearance</legend>' +
    radio('p1') + radio('p1dark') + radio('aero') +
    radio('aerolapd') + radio('aerodark') + radio('off') +
    '<p class="opt-note">F8 cycles through the skins. The three Windows 7 Aero ' +
    'skins give the client, the MDC and every popped-up window the glass ' +
    'gradients, rounded panels and blue highlights of a Windows 7 era ' +
    'terminal, in light, patrol navy or graphite. All custom skins share the ' +
    'icon navigation, recent records rail, status strip and bottom action bar. ' +
    'PatrolOne default lays the client out like a dispatch terminal: a black icon bar ' +
    'for the MDC pages, recent records on the left, a status strip and an action ' +
    'bar along the bottom. PatrolOne Dark keeps that layout with charcoal panels, light text and warm highlights.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Recent records</legend>' +
    check('quickLinks', 'Recent records rail', view.theme === 'off') +
    '<p class="opt-note">Return to the last twelve subjects, vehicles, warrants and incidents ' +
    'from History. Click to reuse an open record page; right-click opens another page.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Layout</legend>' +
    check('statusBar', 'Status bar') +
    check('navBar', 'MDC navigation bar (side panel links as tabs)', view.theme === 'off') +
    check('sidebar', 'MDC side panel (F10)', view.theme === 'off' || view.navBar) +
    '<p class="opt-note">' + (view.theme === 'off'
      ? 'Original MDC keeps the site layout, sidebar and search boxes. These layout settings apply to custom skins.'
      : view.navBar
      ? 'The navigation bar is on, so the side panel is hidden and locked. Clear the navigation bar to go back to using the side panel.'
      : 'The navigation bar puts the side panel links in the tab strip next to Penal Code. Turning it on hides and locks the side panel.') +
    '</p>' +
    check('searchBoxes', 'MDC search boxes (Search Person and Search Vehicle)', view.theme === 'off') +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Sounds</legend>' +
    check('sounds', 'Interface sounds') +
    '<p class="opt-note">Off by default. Nine tones: clicks, navigation, opening a page, closing a dialog or going back, a confirmation on copy, a notification tone, a warning tone on restricted actions, an error tone on failures and error messages, and a start-up tone.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>History</legend>' +
    check('historyLog', 'Keep a history of pages and records opened') +
    check('historyOnlySubjects', 'Only log subjects and vehicles', !view.historyLog) +
    '<p class="opt-note">' + (view.historyLog
      ? (view.historyOnlySubjects
        ? 'Only records, name checks, plate checks, vehicles and warrants are logged. Dashboards, lists, maps and the penal code are skipped.'
        : 'Everything you open is logged. Turn on the second option to keep records, name checks, plate checks, vehicles and warrants only.')
      : 'History is off, so there is nothing to narrow down.') +
    '</p>' +
    '<p class="opt-note">Tools &gt; History (Ctrl+H) lists everything you have opened with the time, searchable by name, plate, record number or address. Stored on this computer only and never sent anywhere. Clearing the session does not clear it; use Clear History in that window.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Notifications</legend>' +
    check('alertBadge', 'Show an unread count on the Alerts button') +
    '<p class="opt-note">Reads the unread count from the MDC and badges the ' +
    'Alerts button, with a short tone each time it grows. Opening Alerts ' +
    'clears the badge.</p>' +
    check('alertReminder', 'Remind me at sign-in when notifications are waiting') +
    '<p class="opt-note">Raises a window with a tone the first time a page ' +
    'reports unread notifications after the client starts.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Window</legend>' +
    check('dragWindows', 'Let pop-up windows be dragged by their title bar') +
    check('discordPresence', 'Show what you are doing on Discord') +
    '<p class="opt-note">Applies to this client\'s own windows (History, ' +
    'Options, Keyboard Shortcuts, Name Check and Plate Check) and to the ' +
    'MDC\'s own pop-ups such as View Record, Add Arrest Report and the ' +
    'charge pickers. Drag a window by its title bar; it reopens centred.</p>' +
    check('minimizeToTray', 'Minimize to the notification area (system tray)') +
    check('updateCheck', 'Check for updates when the client starts') +
    '<p class="opt-note">Update checks read the public release list on the project page and nothing else; nothing is downloaded or installed until you press Update. Off by default. Help &gt; About checks on demand.</p>' +
    '<p class="opt-note">When enabled, minimizing or closing the window keeps the application running in the notification area. Use the tray icon to reopen it, or its Exit command to quit.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Session</legend>' +
    '<table>' +
    row('Home address:', HOME) +
    row('Session store:', appInfo.partition || 'persist:gtaw-mdc') +
    row('Cookies:', 'Persisted between restarts') +
    row('Credentials:', 'Never stored by this application') +
    '</table></fieldset>')

  if (!dialogBody) return
  dialogBody.querySelectorAll('input[name="opt-theme"]').forEach((input) => {
    input.addEventListener('change', () => { if (input.checked) setTheme(input.value) })
  })
  dialogBody.querySelectorAll('input[data-opt]').forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.getAttribute('data-opt')
      toggle(key)
      if (key === 'historyLog' || key === 'navBar') showOptions()
    })
  })
}

function penalFilter() {
  const law = laws[activeTab]
  if (!law || !law.el || !law.el.send) return
  law.query = pcSearch ? String(pcSearch.value || '') : ''
  try {
    law.el.send('mdt:penal-filter', law.query)
  } catch (_) {
  }
}

const NAV_ICONS = [
  [/sign\s*out|log\s*out|logout/i, 'signout'],
  [/dashboard|^home$/i, 'home'],
  [/person\s*lookup|persons?|people|citizen/i, 'person'],
  [/vehicle.*map/i, 'vehicle-map'],
  [/emergency.*map|map|location/i, 'map'],
  [/apb|bolo|broadcast/i, 'apb'],
  [/paperwork|generator|report|citation|ticket|fine/i, 'report'],
  [/online.*warrant/i, 'warrant-online'],
  [/active.*warrant/i, 'warrant-active'],
  [/warrant.*database/i, 'warrant-database'],
  [/arrest|booking|wanted|warrant/i, 'warrant'],
  [/emergency|incident|call\s*log/i, 'incident'],
  [/dmv|vehicle|plate/i, 'vehicle'],
  [/database|records?|misc|other|menu/i, 'folder'],
  [/changelog|version|history/i, 'history'],
  [/law|penal|code/i, 'code'],
  [/mail|email|message/i, 'mail'],
  [/dispatch|phone/i, 'radio'],
  [/profile|account|officer/i, 'profile'],
  [/search|lookup|quer/i, 'search']
]

function navIcon(label) {
  const item = NAV_ICONS.find(([match]) => match.test(label))
  return 'icons/dispatch/' + (item ? item[1] : 'folder') + '.svg'
}

let navItems = []
let navCurrent = ''

function recentRecords() {
  const seen = new Set()
  return histList.filter((entry) => {
    if (!/^(Record|Vehicle|Name check|Plate check|Warrant|Incident|APB)$/.test(entry.kind) || seen.has(entry.url)) return false
    seen.add(entry.url)
    return true
  }).slice(0, 12)
}

let quickWidth = Number(localStorage.getItem('mdc.quickWidth')) || 0

function scaleRailContent() {
  const scale = quickWidth ? Math.max(.75, Math.min(1.8, quickWidth / (view.theme.startsWith('p1') ? 140 : 164))) : 1
  document.body.style.setProperty('--rail-scale', String(scale))
}

function setRailWidth(width, save) {
  quickWidth = Math.round(Math.max(100, Math.min(360, innerWidth * .4, width)))
  document.body.style.setProperty('--rail-width', quickWidth + 'px')
  scaleRailContent()
  if (save !== false) localStorage.setItem('mdc.quickWidth', String(quickWidth))
  const handle = quickBar && quickBar.querySelector('.quickresize')
  if (handle) handle.setAttribute('aria-valuenow', String(quickWidth))
  document.dispatchEvent(new Event('mdc:chrome-changed'))
}

function railResizeHandle() {
  const handle = document.createElement('button')
  handle.className = 'quickresize'
  handle.type = 'button'
  handle.setAttribute('role','separator')
  handle.setAttribute('aria-orientation','vertical')
  handle.setAttribute('aria-label','Resize recent records')
  handle.setAttribute('aria-valuemin','100')
  handle.setAttribute('aria-valuemax','360')
  handle.title = 'Drag to resize the rail and text. Alt+Left / Alt+Right while focused resizes both; Alt+Home resets.'
  let drag = null
  let frame = 0
  let shield = null
  const move = (e) => { if (!drag) return; drag.x=e.clientX; if (!frame) frame=requestAnimationFrame(paint) }
  const paint = () => { frame = 0; if (drag) setRailWidth(drag.width + drag.x - drag.start, false) }
  const finish = () => {
    if (!drag) return
    if (frame) cancelAnimationFrame(frame)
    paint()
    const id = drag.id
    drag = null
    document.body.classList.remove('rail-sizing')
    window.removeEventListener('blur',finish)
    if (shield) { shield.remove(); shield = null }
    if (handle.hasPointerCapture(id)) handle.releasePointerCapture(id)
    localStorage.setItem('mdc.quickWidth', String(quickWidth))
  }
  on(handle,'pointerdown',(e) => {
    if (e.button !== 0) return
    handle.focus()
    document.body.classList.add('rail-sizing')
    window.addEventListener('blur',finish)
    drag = {width:quickBar.getBoundingClientRect().width,start:e.clientX,x:e.clientX,id:e.pointerId}
    shield = document.createElement('div')
    shield.className = 'rail-shield'
    on(shield,'pointermove',move)
    on(shield,'pointerup',finish)
    on(shield,'pointercancel',finish)
    document.body.appendChild(shield)
    handle.setPointerCapture(e.pointerId)
    e.preventDefault()
  })
  on(handle,'pointermove',move)
  on(handle,'pointerup',finish)
  on(handle,'pointercancel',finish)
  on(handle,'lostpointercapture',finish)
  on(handle,'keydown',(e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    setRailWidth((quickWidth || quickBar.getBoundingClientRect().width) + (e.key === 'ArrowLeft' ? -12 : 12))
  })
  return handle
}

function renderQuickBar() {
  if (!quickBar) return
  const on = view.quickLinks && view.theme !== 'off'
  quickBar.classList.toggle('hidden', !on)
  quickBar.textContent = ''
  if (!on) return
  const caption = document.createElement('span')
  caption.className = 'quickcap'
  caption.textContent = 'Recent records'
  quickBar.appendChild(caption)
  quickBar.appendChild(railResizeHandle())
  scaleRailContent()
  if (quickWidth) document.body.style.setProperty('--rail-width', quickWidth + 'px')
  const row = document.createElement('div')
  row.className = 'quickrow'
  quickBar.appendChild(row)
  const records = recentRecords()
  if (!records.length) {
    const empty = document.createElement('p')
    empty.className = 'quickempty'
    empty.textContent = view.historyLog ? 'Opened subjects, vehicles and incidents appear here.' : 'Enable History in Options to keep recent records here.'
    row.appendChild(empty)
  }
  records.forEach((entry) => {
    const node = document.createElement('button')
    node.className = 'quickbtn' + (entry.url === navCurrent ? ' active' : '')
    node.title = entry.kind + ': ' + (entry.label || pathLabel(entry.url)) + '\n' + histWhen(entry.at)
    node.setAttribute('aria-label', node.title)
    const img = document.createElement('img')
    img.className = 'quickicon'
    img.src = navIcon(entry.kind === 'Record' || entry.kind === 'Name check' ? 'Person' : entry.kind)
    img.alt = ''
    node.appendChild(img)
    const text = document.createElement('span')
    text.className = 'quicklabel'
    text.textContent = entry.label || entry.query || pathLabel(entry.url)
    const detail = document.createElement('small')
    detail.textContent = entry.kind + ' | ' + histWhen(entry.at)
    text.appendChild(detail)
    node.appendChild(text)
    node.addEventListener('click', () => {
      const existing = pages.find((page) => page.url === entry.url)
      showTab('mdc')
      if (existing) showPage(existing.id)
      else wv.loadURL(entry.url)
      playSound('nav')
    })
    node.addEventListener('contextmenu', (ev) => {
      ev.preventDefault()
      openPage(entry.url)
    })
    row.appendChild(node)
  })
  const history = document.createElement('button')
  history.className = 'quickbtn quickhistory'
  history.innerHTML = '<img class="quickicon" src="icons/dispatch/history.svg" alt=""><span>Search history</span>'
  history.addEventListener('click', showHistory)
  quickBar.appendChild(history)
}

const hdrPop = el('hdr-popup')
let hdrOpen = ''

function closeHeaderMenu() {
  if (hdrOpen) {try {wv.send('mdt:header-panel-state',false)} catch (_) {}}
  hdrOpen = ''
  for(const id of ['hb-bell','hb-history'])el(id)?.setAttribute('aria-expanded','false')
  if (hdrPop) {
    hdrPop.classList.remove('open')
    hdrPop.textContent = ''
  }
  document.querySelectorAll('.hbtn.active').forEach((b) => b.classList.remove('active'))
}


let alertCount = 0
let alertGreeted = false

function alertBadgeEl() {
  const btn = el('hb-bell')
  if (!btn) return null
  const count = el('p1-alerts')
  if (count) return count
  let badge = btn.querySelector('.hbadge')
  if (!badge) {
    badge = document.createElement('span')
    badge.className = 'hbadge hidden'
    btn.appendChild(badge)
  }
  return badge
}

function renderAlerts() {
  const badge = alertBadgeEl()
  if (!badge) return
  badge.textContent = alertCount > 99 ? '99+' : String(alertCount)
  badge.classList.toggle('hidden', !(view.alertBadge && alertCount > 0))
  const btn = el('hb-bell')
  if (btn) {
    btn.title = alertCount > 0
      ? alertCount + ' unread notification' + (alertCount === 1 ? '' : 's')
      : 'Notifications'
  }
}

function remindAlerts(n) {
  playSound('notify')
  openDialog(
    'Notifications',
    '<p>You have <b>' + n + '</b> unread notification' + (n === 1 ? '' : 's') +
    ' waiting on the MDC.</p>' +
    '<p class="opt-note">Open them with the Alerts button at the top right. ' +
    'This reminder can be turned off under Tools &gt; Options.</p>'
  )
}

function alertAck() {
  const raw = parseInt(localStorage.getItem('mdc.alertAck') || '0', 10)
  return isNaN(raw) ? 0 : Math.max(0, raw)
}

function setAlertAck(n) {
  try {
    localStorage.setItem('mdc.alertAck', String(Math.max(0, Number(n) || 0)))
  } catch (_) {
  }
}

function setAlerts(value) {
  const next = Math.max(0, Number(value) || 0)
  const grew = next > alertCount
  alertCount = next
  renderAlerts()
  if (next === 0) {
    setAlertAck(0)
    alertGreeted = true
    return
  }
  if (next <= alertAck()) {
    alertGreeted = true
    return
  }
  setAlertAck(next)
  if (!alertGreeted) {
    alertGreeted = true
    if (view.alertReminder) remindAlerts(next)
    return
  }
  if (grew && view.alertBadge) playSound('notify')
}

function headerCtlClick(kind) {
  if (hdrOpen === kind) {
    closeHeaderMenu()
    return
  }
  closeHeaderMenu()
  showTab('mdc')
  hdrOpen = kind
  renderHeaderMenu(kind, null)
  const btn = el('hb-' + (kind === 'bell' ? 'bell' : 'history'))
  if (btn) btn.classList.add('active')
  playSound('click')
  try {
    wv.send('mdt:header-panel-state', true)
    wv.send('mdt:header-menu-request', kind)
  } catch (_) {
  }
}

const notificationTones = {primary:'#9C27B0',secondary:'#6C757D',success:'#4CAF50',danger:'#F44336',warning:'#FF9800',info:'#00BCD4',light:'#F8F9FA',dark:'#343A40',muted:'#6C757D'}
function notificationInk(color, background) {
  const parse=value=>{
    const hex=/^#([a-f0-9]{3}|[a-f0-9]{6})$/i.exec(value.trim())
    if(hex){const h=hex[1].length===3?hex[1].split('').map(c=>c+c).join(''):hex[1];return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16))}
    const rgb=/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i.exec(value)
    return rgb?rgb.slice(1,4).map(Number):null
  }
  const fg=parse(color),bg=parse(background)
  if(!fg||!bg)return null
  const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)
  const b=luminance(bg),target=b>.179?0:255
  for(let step=0;step<=100;step++) {
    const rgb=fg.map(v=>Math.round(v+(target-v)*step/100)),l=luminance(rgb)
    if((Math.max(l,b)+.05)/(Math.min(l,b)+.05)>=4.5)return 'rgb('+rgb.join(',')+')'
  }
  return target?'#FFFFFF':'#000000'
}

function renderHeaderMenu(kind, items) {
  if (!hdrPop || hdrOpen !== kind) return
  hdrPop.textContent = ''
  const list = Array.isArray(items) ? items : []
  const heading = document.createElement('div')
  heading.className = 'hdrpop-heading'
  heading.textContent = kind === 'bell' ? 'MDC notifications' : 'MDC history'
  hdrPop.appendChild(heading)
  if (!list.length) {
    const empty = document.createElement('div')
    empty.className = 'hdrpop-empty'
    empty.textContent = items === null ? 'Loading from the MDC...' : 'No notifications available on this page.'
    hdrPop.appendChild(empty)
  }
  list.forEach((item) => {
    const row = document.createElement('button')
    row.className = 'hdrpop-item' + (item.unread ? ' unread' : '')
    row.title = item.label || item.sub || ''
    const label = document.createElement('span')
    label.className = 'hdrpop-label'
    const text=item.label||item.sub||''
    const parts=Array.isArray(item.parts)&&item.parts.map(p=>String(p.text||'')).join('')===text?item.parts:null
    if(!parts)label.textContent=text
    else {
      const background=getComputedStyle(hdrPop).backgroundColor,hover=getComputedStyle(document.body).getPropertyValue('--hover')
      parts.forEach(part=>{
        const source=String(part.color||'')||notificationTones[part.tone]
        const ink=source&&notificationInk(source,background),over=source&&notificationInk(source,hover)
        if(!ink)label.appendChild(document.createTextNode(String(part.text||'')))
        else {const span=document.createElement('span');span.className='hdrpop-colored';span.dataset.tone=part.tone||'authored';span.textContent=String(part.text||'');span.style.setProperty('--notify-ink',ink);span.style.setProperty('--notify-hover-ink',over||ink);label.appendChild(span)}
      })
    }
    row.appendChild(label)
    if (item.sub) {
      const sub = document.createElement('span')
      sub.className = 'hdrpop-sub'
      sub.textContent = item.sub
      row.appendChild(sub)
    }
    row.addEventListener('click', () => {
      try {
        wv.send('mdt:header-item', { kind: kind, index: item.index })
      } catch (_) {
      }
      playSound('click')
      closeHeaderMenu()
    })
    hdrPop.appendChild(row)
  })
  hdrPop.classList.add('open')
  el('hb-'+(kind==='bell'?'bell':'history'))?.setAttribute('aria-expanded','true')
}

function wireHeaderCtl() {
  const outside = (e) => {if(hdrOpen&&!hdrPop?.contains(e.target)&&!e.target.closest?.('#hb-bell, #hb-history'))closeHeaderMenu()}
  on(document, 'pointerdown', outside, true)
  on(document, 'click', outside, true)
  on(window, 'blur', closeHeaderMenu)
  on(el('hb-history'), 'click', (e) => { e.stopPropagation(); closeHeaderMenu(); showHistory() })
  on(el('hb-bell'), 'click', (e) => { e.stopPropagation(); headerCtlClick('bell') })
  on(document, 'click', (e) => {
    if (!hdrOpen) return
    if (hdrPop && hdrPop.contains(e.target)) return
    closeHeaderMenu()
  })
  on(document, 'keydown', (e) => {
    if (!hdrOpen) return
    if (e.key === 'Escape') {
      e.preventDefault()
      closeHeaderMenu()
      el('hb-bell').focus()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const rows = hdrPop ? Array.from(hdrPop.querySelectorAll('.hdrpop-item')) : []
      if (!rows.length) return
      e.preventDefault()
      const index = rows.indexOf(document.activeElement)
      rows[(index + (e.key === 'ArrowDown' ? 1 : rows.length - 1) + rows.length) % rows.length].focus()
    }
  })
}

function renderNav() {
  if (!tabNav) return
  tabNav.textContent = ''
  navItems.forEach((item) => {
    const chip = document.createElement('button')
    chip.className = 'navchip' + (item.url === navCurrent ? ' active' : '')
    chip.title = item.label + '\n' + item.url
    const icon = document.createElement('img')
    icon.className = 'navicon'
    icon.src = navIcon(item.label)
    icon.alt = ''
    icon.setAttribute('aria-hidden', 'true')
    chip.appendChild(icon)
    if (/sign\s*out|log\s*out|logout/i.test(item.label)) chip.classList.add('navchip-out')
    const text = document.createElement('span')
    if (item.depth > 1) text.className = 'navsub'
    text.textContent = item.label
    chip.appendChild(text)
    const binding = comboFor(navAction(item))
    if (binding) {
      const badge = document.createElement('span')
      badge.className = 'navkey'
      badge.textContent = binding
      chip.appendChild(badge)
      chip.title = item.label + ' (' + binding + ')\n' + item.url
    }
    chip.addEventListener('click', () => {
      navCurrent = item.url
      showTab('mdc')
      try {
        wv.send('mdt:nav-go', item.url)
      } catch (_) {
      }
      setStatus(item.label)
      playSound('nav')
      renderNav()
    })
    chip.addEventListener('contextmenu', (ev) => {
      ev.preventDefault()
      openPage(item.url)
      setStatus(item.label + ' (new page)')
    })
    tabNav.appendChild(chip)
  })
  tabNav.classList.toggle('hidden', view.theme === 'off' || !navItems.length || !view.navBar)
}

function setNav(items) {
  const list = []
  if (items && typeof items.length === 'number') {
    for (let i = 0; i < items.length && list.length < 40; i++) {
      const item = items[i]
      if (!item || !item.label || !item.url) continue
      list.push({ label: String(item.label), url: String(item.url), depth: Number(item.depth) || 0 })
    }
  }
  navItems = list
  sendKeys()
  renderNav()
  renderQuickBar()
  updateActionBar()
}

function showTab(name) {
  if (name !== activeTab) closeHeaderMenu()
  activeTab = Object.hasOwn(laws, name) ? name : 'mdc'
  const law = laws[activeTab]
  const penal = !!law
  Object.entries(laws).forEach(([key, item]) => {
    const v = item.el
    if (!v) return
    v.classList.toggle('wv-off', key !== activeTab)
    if (key === activeTab && v.getAttribute('data-loaded') !== '1') {
      v.setAttribute('data-loaded', '1')
      try {
        v.loadURL(item.url)
      } catch (_) {
      }
    }
    const tab = document.getElementById('tab-' + key)
    if (tab) tab.classList.toggle('active', key === activeTab)
  })
  allPageViews().forEach((v) => {
    if (v) v.classList.toggle('wv-off', penal || v !== wv)
  })
  renderPageBar()
  renderRecordDock()
  if (pcBar) pcBar.classList.toggle('hidden', !penal)
  const tabMdc = document.getElementById('tab-mdc')
  if (tabMdc) tabMdc.classList.toggle('active', !penal)
  if (law && pcSearch) {
    pcSearch.value = law.query
    pcSearch.placeholder = 'Search ' + law.short
    const label = document.querySelector('label[for="pc-search"]')
    if (label) label.textContent = 'Search ' + law.short + ':'
  }
  document.dispatchEvent(new Event('mdc:chrome-changed'))
  updateActionBar()
  setStatus(penal ? law.title : 'Ready')
  if (penal && pcSearch) pcSearch.focus()
}

const actions = {
  home: () => { showTab('mdc'); wv.loadURL(HOME) },
  newpage: () => openPage(HOME),
  closepage: () => closePage(activePageId),
  reload: () => activeView().reload(),
  stop: () => activeView().stop(),
  back: () => { const v = activeView(); if (v.canGoBack()) v.goBack() },
  forward: () => { const v = activeView(); if (v.canGoForward()) v.goForward() },
  zoomin: () => stepZoom(1),
  zoomout: () => stepZoom(-1),
  zoomreset: () => setZoom(0),
  tabmdc: () => showTab('mdc'),
  tabpenal: () => showTab('penal'),
  tabdepa: () => showTab('depa'),
  tabshaft: () => showTab('shaft'),
  penalsignout: async () => {
    const r = await window.mdt.messageBox({
      type: 'warning',
      buttons: ['Sign Out', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      title: 'Forum Sign Out',
      message: 'Sign out of the GTA World forums in this client?',
      detail: 'Only forum cookies are cleared. Your MDC session stays signed in.'
    })
    if (r === 0) {
      await window.mdt.clearForumSession()
      setStatus('Forum session cleared')
      Object.values(laws).forEach((law) => {
        if (law.el && law.el.getAttribute('data-loaded') === '1') {
          try { law.el.loadURL(law.url) } catch (_) {}
        }
      })
    }
  },
  themep1: () => setTheme('p1'),
  themep1dark: () => setTheme('p1dark'),
  themeaero: () => setTheme('aero'),
  themeaerolapd: () => setTheme('aerolapd'),
  themeaerodark: () => setTheme('aerodark'),
  namecheck: () => promptLookup('name'),
  platecheck: () => promptLookup('plate'),
  keyhelp: () => showKeys(),
  checkupdates: () => { showAbout(); runUpdateCheck() },
  openrepo: () => window.mdt.openExternal(REPO_URL),
  themeoff: () => setTheme('off'),
  cycletheme: () => cycleTheme(),
  togglestatus: () => toggle('statusBar'),
  togglesidebar: () => toggle('sidebar'),
  togglenavbar: () => toggle('navBar'),
  find: () => openFind(),
  findnext: () => { if (findOpen()) doFind(true) },
  focusname: () => promptLookup('name'),
  focusplate: () => promptLookup('plate'),
  devtools: () => activeView().openDevTools(),
  layoutreport: () => {
    setStatus('Measuring page layout...')
    wv.send('mdt:layout-report')
  },
  copyurl: () => navigator.clipboard.writeText(activeView().getURL()).then(() => {
    setStatus('Address copied')
    playSound('save')
  }),
  opensite: () => window.mdt.openExternal('https://gta.world/'),
  history: () => showHistory(),
  options: () => showOptions(),
  about: () => showAbout(),
  exit: () => window.mdt.quit(),
  signout: async () => {
    const r = await window.mdt.messageBox({
      type: 'warning',
      buttons: ['Clear Session', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      title: 'Clear Session',
      message: 'Clear stored MDC session data?',
      detail: 'You will need to sign in to the GTA World UCP again in this client. ' +
        'No password is stored by this application.'
    })
    if (r === 0) {
      clearRecordDocks()
      await window.mdt.clearSession()
      setStatus('Session cleared')
      wv.loadURL(HOME)
    }
  }
}

function run(action) {
  const destination = navItems.find((item) => navAction(item) === action)
  if (destination) {
    playSound('nav')
    showTab('mdc')
    wv.send('mdt:nav-go', destination.url)
    setStatus(destination.label)
    return
  }
  const fn = actions[action]
  if (!fn) return
  playSound(NAV_ACTIONS.has(action) ? 'nav' : CLOSE_ACTIONS[action] ? 'close' : 'click')
  try {
    fn()
  } catch (err) {
    console.error('[shell] action failed: ' + action, err)
    setStatus('Action unavailable')
    playSound('error')
  }
}

const menus = Array.from(document.querySelectorAll('.menu'))
let menuArmed = false

function closeMenus() {
  menus.forEach((m) => m.classList.remove('open'))
  menuArmed = false
}

boot('menubar', () => {
  menus.forEach((menu) => {
    const label = menu.querySelector('.menu-label')
    on(label, 'click', (e) => {
      e.stopPropagation()
      closeHeaderMenu()
      const wasOpen = menu.classList.contains('open')
      closeMenus()
      if (!wasOpen) {
        menu.classList.add('open')
        menuArmed = true
      }
    })
    on(menu, 'mouseenter', () => {
      if (menuArmed) {
        menus.forEach((m) => m.classList.remove('open'))
        menu.classList.add('open')
      }
    })
  })

  const bar = el('menubar')
  let closeTimer = null
  const cancelClose = () => {
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
  }
  on(bar, 'mouseleave', () => {
    cancelClose()
    closeTimer = setTimeout(() => {
      closeTimer = null
      closeMenus()
    }, 320)
  })
  on(bar, 'mouseenter', cancelClose)

  document.querySelectorAll('.menu-item').forEach((item) => {
    on(item, 'click', () => {
      if (item.classList.contains('disabled')) return
      const action = item.getAttribute('data-action')
      closeMenus()
      if (action) run(action)
    })
  })

  document.addEventListener('click', closeMenus)
})

boot('header-controls', () => {
  wireHeaderCtl()
})

boot('findbar', () => {
  on(findInput, 'keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); doFind(!e.shiftKey) }
    else if (e.key === 'Escape') { e.preventDefault(); closeFind() }
  })
  on(findInput, 'input', () => { if (findInput && !findInput.value) clearMatches() })
  on(findCase, 'change', () => { lastFindTerm = ''; doFind(true) })
  on(el('find-next'), 'click', () => doFind(true))
  on(el('find-prev'), 'click', () => doFind(false))
  on(el('find-close'), 'click', closeFind)
})

boot('dialog', () => {
  if (backdrop) { rememberDialogIds(backdrop); wireDialog(backdrop) }
  for (const type of ['pointerdown','click','input','change','keydown','focusin']) on(document, type, (e) => {
    const root = e.target && e.target.closest && e.target.closest('.modal-backdrop')
    if (root && root !== backdrop && dialogRoots.includes(root)) activateDialog(root)
  }, true)
  on(window, 'pointermove', moveDialogDrag)
  on(window, 'pointerup', endDialogDrag)
  on(window, 'pointercancel', endDialogDrag)
  on(window, 'blur', endDialogDrag)
  on(window, 'pointermove', moveDialogResize)
  on(window, 'pointerup', endDialogResize)
  on(window, 'pointercancel', endDialogResize)
  on(window, 'blur', endDialogResize)
})

function wirePage(wv, page) {
  const isActive = () => activeTab === 'mdc' && !!page && page.id === activePageId
  on(wv, 'focus', () => {if(isActive())closeHeaderMenu()})

  on(wv, 'did-start-loading', () => {
    if (isActive()) closeHeaderMenu()
    if (isActive()) setStatus('Opening mdc.gta.world...')
  })

  on(wv, 'did-start-navigation', e => {
    if (e.isMainFrame && !e.isInPlace) {
      page.recordDocument=null
      if(/\/(?:logout|signout)(?:[/?#]|$)/i.test(e.url||'')) clearRecordDocks()
    }
  })
  on(wv, 'dom-ready', () => {
    try {
      wv.setZoomLevel(zoom)
      wv.send('mdt:set-skin', view.theme)
      wv.send('mdt:set-drag', !!view.dragWindows)
      wv.send('mdt:record-dock-sync')
      if(page.pendingRecord) setTimeout(()=>sendDockRecord(page),250)
      wv.send('mdt:set-sidebar', !view.sidebar)
      wv.send('mdt:set-search-boxes', !view.searchBoxes)
    } catch (_) {
    }
  })

  on(wv, 'did-stop-loading', () => {
    if (isActive()) setStatus('Done')
    try {
      wv.send('mdt:set-skin', view.theme)
    } catch (_) {
    }
    try {
      wv.send('mdt:set-sidebar', !view.sidebar)
      wv.send('mdt:set-search-boxes', !view.searchBoxes)
      wv.send('mdt:set-drag', !!view.dragWindows)
    } catch (_) {
    }
    if (isActive()) updateNav()
  })

  on(wv, 'new-window', (e) => {
    if (!e || !e.url) return
    openPage(e.url)
  })

  on(wv, 'did-fail-load', (e) => {
    if (e.errorCode === -3) return
    setStatus('Error ' + e.errorCode + ': ' + e.errorDescription)
    playSound('error')
  })

  on(wv, 'did-navigate', (e) => {
    if (page) page.url = e.url
    histAdd({ url: e.url, label: page ? pageLabel(page) : '' })
    if (!isActive()) return
    navCurrent = e.url
    renderNav()
    updateNav()
  })

  on(wv, 'did-navigate-in-page', (e) => {
    if (page) page.url = e.url
    if (!isActive()) return
    navCurrent = e.url
    renderNav()
    updateNav()
  })

  on(wv, 'page-title-updated', (e) => {
    if (page) page.title = e.title || 'Page'
    if (page) histLabel(page.url, pageLabel(page))
    renderPageBar()
    renderRecordDock()
    if (!isActive()) return
    document.title = APP_NAME
    setStatus(e.title || 'Ready')
  })

  on(wv, 'ipc-message', (e) => {
    if(e.channel==='mdt:record-dock') {
      const incoming=Array.isArray(e.args[0])?e.args[0]:[]
      page.recordDock=page.recordDock||[]
      incoming.forEach(record=>{
        if(!record.key||!/^\d+$/.test(String(record.recordId))) return
        page.recordDock.forEach(r=>r.active=false)
        const existing=page.recordDock.find(r=>r.key===record.key)
        if(existing) Object.assign(existing,record)
        else page.recordDock.push(record)
      })
      if(isActive()) renderRecordDock()
      return
    }
    if(e.channel==='mdt:record-ready') {page.recordDocument=e.args[0]?.documentId;return}
    if(e.channel==='mdt:record-dock-result') {finishDockRecord(page,e.args[0]||{});return}
    if(e.channel==='mdt:record-signout') {clearRecordDocks();return}
    if(e.channel==='mdt:record-minimize-warning') {
      window.mdt.messageBox({type:'warning',buttons:['Minimize','Cancel'],defaultId:1,cancelId:1,title:'Minimize record with an editor',message:'This record contains editable fields.',detail:'The fields stay alive on this page, but navigation or reloading will lose unsaved edits. Restoring after navigation reloads the saved record.'}).then(answer=>{if(answer===0) wv.send('mdt:record-minimize-approved',e.args[0]?.recordId)})
      return
    }
    if (!isActive()) return
    if (e.channel === 'mdt:dismiss-header-panel') {closeHeaderMenu();return}
    if (e.channel === 'mdt:page-info') {
      const info = (e.args && e.args[0]) || {}

      if (sbTheme) {
        sbTheme.textContent = info.skinnable === false
          ? 'Skin: not applied (sign-in)'
          : 'Skin: ' + THEMES[view.theme]
      }
      if (info.officer) p1State.officer = String(info.officer)
      if (typeof info.apbs === 'number') p1State.apbs = info.apbs
      renderP1()
      if (info.subject && page) histLabel(page.url, info.subject)
      if (info.subject) setStatus('Record: ' + info.subject)
      else if (info.officer) setStatus('Signed in: ' + info.officer)
      return
    }
    if (e.channel === 'mdt:header-menu') {
      const payload = (e.args && e.args[0]) || {}
      renderHeaderMenu(String(payload.kind || ''), payload.items)
      return
    }
    if (e.channel === 'mdt:alerts') {
      setAlerts((e.args && e.args[0]) || 0)
      return
    }
    if (e.channel === 'mdt:nav') {
      setNav((e.args && e.args[0]) || [])
      return
    }
    if (e.channel === 'mdt:sound') {
      playSound(String((e.args && e.args[0]) || ''))
      return
    }
    if (e.channel === 'mdt:open-new-page') {
      const url = String((e.args && e.args[0]) || '')
      if (url) openPage(url)
      return
    }
    if (e.channel === 'mdt:open-penal') {
      showTab('penal')
      return
    }
    if (e.channel === 'mdt:hotkey') {
      run(String((e.args && e.args[0]) || ''))
      return
    }
    if (e.channel === 'mdt:layout-report-result') {
      showLayoutReport((e.args && e.args[0]) || {})
    }
  })

  on(wv, 'found-in-page', (e) => {
    const r = e.result || {}
    if (!findCount) return
    if (!r.matches) {
      findCount.textContent = 'No matches'
      findCount.classList.add('nomatch')
      return
    }
    findCount.classList.remove('nomatch')
    findCount.textContent = (r.activeMatchOrdinal || 0) + ' of ' + r.matches
  })
}

boot('webview', () => {
  pageSeq = 1
  const first = { id: 'page-1', el: wv, title: 'Mobile Data Computer', url: HOME }
  pages = [first]
  activePageId = first.id
  wirePage(wv, first)
  renderPageBar()
  renderRecordDock()
})

function updateNav() {
  updateActionBar()
}

boot('p1-actions', () => {
  on(el('p1a-back'), 'click', () => run('back'))
  on(el('p1a-forward'), 'click', () => run('forward'))
  on(el('p1a-reload'), 'click', () => run('reload'))
  const goNav = (re) => {
    const hit = navItems.find((item) => re.test(item.label))
    if (!hit) return
    const url = hit.url
    navCurrent = url
    showTab('mdc')
    try {
      wv.send('mdt:nav-go', url)
    } catch (_) {
    }
    playSound('nav')
    renderNav()
  }
  on(el('p1a-map'), 'click', () => {
    goNav(/emergency map/i)
    setStatus('Emergency Map')
  })
  on(el('p1a-paperwork'), 'click', () => {
    goNav(/paperwork/i)
    setStatus('Paperwork Generators')
  })
  on(el('p1a-detach'), 'click', () => {
    let url = HOME
    try {
      url = wv.getURL() || HOME
    } catch (_) {
    }
    openPage(url)
    setStatus('Opened as a new page')
  })
  applyP1Chrome()
  updateActionBar()
})

boot('sizing', () => {
  const content = document.querySelector('.content')

  function sizeWebview() {
    if (!content) return
    const w = content.clientWidth
    const h = content.clientHeight
    if (w <= 0 || h <= 0) return
    ;allPageViews().concat(allLawViews()).forEach((v) => {
      if (!v || !v.style) return
      if (v.style.width !== w + 'px') v.style.width = w + 'px'
      if (v.style.height !== h + 'px') v.style.height = h + 'px'
    })
  }

  sizeWebview()
  if (typeof ResizeObserver === 'function') new ResizeObserver(sizeWebview).observe(content)
  if (window.addEventListener) window.addEventListener('resize', sizeWebview)

  document.addEventListener('mdc:chrome-changed', sizeWebview)
  document.addEventListener('visibilitychange', sizeWebview)
  if (window.addEventListener) window.addEventListener('focus', sizeWebview)
  setTimeout(sizeWebview, 0)
  setTimeout(sizeWebview, 300)
})

boot('sounds', () => {
  document.addEventListener('click', (e) => {
    const t = e && e.target
    if (!t || !t.closest) return
    if (t.closest('.dialog-close, .find-close, #btn-stop')) {
      playSound('close')
      return
    }
    if (t.closest('.menu-label, .fld-check, .btn')) playSound('click')
  }, true)
})

boot('rail-sizing', () => {
  on(quickBar, 'keydown', (e) => {
    if (!e.altKey || e.ctrlKey) return
    const key = e.key
    if (!['ArrowLeft','ArrowRight','Home'].includes(key)) return
    e.preventDefault()
    e.stopPropagation()
    setRailWidth(key === 'Home' ? (view.theme.startsWith('p1') ? 140 : 164) : (quickWidth || quickBar.getBoundingClientRect().width) + (key === 'ArrowLeft' ? -24 : 24))
  })
})

boot('keyboard', () => {
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return
    const typing = ['INPUT', 'TEXTAREA'].includes((e.target && e.target.tagName) || '')

    if (e.key === 'Escape') {
      closeMenus()
      if (findOpen()) closeFind()
      else if (backdrop && !backdrop.classList.contains('hidden')) closeDialog()
      else if (!typing) run('stop')
      return
    }

    let combo = comboOf(e)
    if (e.ctrlKey && combo === 'Ctrl+=') combo = 'Ctrl++'
    const action = actionForCombo(combo)
    if (!action) return
    if (typing && !e.ctrlKey && !e.altKey && !/^F\d+$/.test(e.key)) return
    e.preventDefault()
    run(action)
  })

  document.addEventListener('mousedown', (e) => {
    if (backdrop && !backdrop.classList.contains('hidden')) return
    const combo = comboOfMouse(e)
    if (!combo) return
    const action = actionForCombo(combo)
    if (!action) return
    e.preventDefault()
    e.stopPropagation()
    run(action)
  }, true)

  document.addEventListener('auxclick', (e) => {
    const combo = comboOfMouse(e)
    if (!combo || !actionForCombo(combo)) return
    e.preventDefault()
    e.stopPropagation()
  }, true)
})

boot('init', () => {
  setInterval(tick, 1000)
  tick()
  histLoad()
  keysLoad()
  sendKeys()
  setInterval(sendKeys, 4000)
  if (view.updateCheck) setTimeout(() => runUpdateCheck(true), 4000)
  applyView()
  if (window.mdt && window.mdt.onOpenPage) window.mdt.onOpenPage(openPage)
  if (window.mdt && window.mdt.onWake) window.mdt.onWake(wakeViews)
  let played = false
  try {
    played = sessionStorage.getItem('mdtStartupPlayed') === '1'
    sessionStorage.setItem('mdtStartupPlayed', '1')
  } catch (_) {
  }
  if (window.mdt && window.mdt.startupOnce) {
    window.mdt.startupOnce().then((first) => {
      if (first) setTimeout(() => playSound('startup'), 500)
    }).catch(() => {
      if (!played) setTimeout(() => playSound('startup'), 500)
    })
  } else if (!played) {
    setTimeout(() => playSound('startup'), 500)
  }
  if (window.mdt && window.mdt.getInfo) {
    window.mdt.getInfo().then((info) => { appInfo = info })
  }
})

function bindLawView(key, law) {
  const pcv = law.el
  if (!pcv) return

  on(pcv, 'dom-ready', () => {
    pcv.setZoomLevel(zoom)
    pcv.send('mdt:set-skin', view.theme)
    sendKeys()
  })

  on(pcv, 'did-start-loading', () => { if (activeTab === key) setStatus('Opening forum.gta.world...') })

  on(pcv, 'did-stop-loading', () => {
    pcv.send('mdt:set-skin', view.theme)
    pcv.send('mdt:penal-filter', law.query)
  })

  on(pcv, 'did-fail-load', (e) => {
    if (e.errorCode === -3) return
    if (activeTab === key) setStatus(law.short + ' error ' + e.errorCode + ': ' + e.errorDescription)
    playSound('error')
  })

  on(pcv, 'ipc-message', (e) => {
    if (e.channel === 'mdt:sound') {
      playSound(String((e.args && e.args[0]) || ''))
      return
    }
    if (e.channel === 'mdt:hotkey') {
      run(String((e.args && e.args[0]) || ''))
      return
    }
    if (e.channel === 'mdt:penal-info') {
      const info = (e.args && e.args[0]) || {}
      if (activeTab !== key) return
      setStatus(info.signedIn ? law.title : 'Forum sign-in required')
      return
    }
    if (e.channel === 'mdt:penal-result') {
      if (activeTab !== key) return
      const r = (e.args && e.args[0]) || {}
      if (!r.query) setStatus(law.title)
      else setStatus(law.short + ': ' + r.shown + ' of ' + r.total + ' sections match "' + r.query + '"')
    }
  })

  on(pcv, 'found-in-page', (e) => {
    const r = e.result || {}
    if (!findCount) return
    findCount.textContent = r.matches ? (r.activeMatchOrdinal || 0) + ' of ' + r.matches : 'No matches'
  })
}

boot('law pages', () => {
  Object.entries(laws).forEach(([key, law]) => bindLawView(key, law))
})

boot('tabs', () => {
  on(document.getElementById('tab-mdc'), 'click', () => run('tabmdc'))
  on(document.getElementById('tab-penal'), 'click', () => run('tabpenal'))
  on(document.getElementById('tab-depa'), 'click', () => run('tabdepa'))
  on(document.getElementById('tab-shaft'), 'click', () => run('tabshaft'))
  on(pcSearch, 'input', penalFilter)
  on(el('pc-clear'), 'click', () => {
    if (pcSearch) pcSearch.value = ''
    penalFilter()
  })
  on(el('pc-signout'), 'click', () => run('penalsignout'))

})
