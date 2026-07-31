'use strict'

function el(id) {
  const node = document.getElementById(id)
  if (!node) console.warn('[shell] missing element #' + id)
  return node
}

function on(node, event, fn) {
  if (node && node.addEventListener) node.addEventListener(event, fn)
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
const pcBar = el('pc-bar')
const pcSearch = el('pc-search')
const tabNav = el('tab-nav')
const quickBar = el('quick-bar')
const hdrCtl = el('hdr-ctl')
let activeTab = 'mdc'

function activeView() {
  return activeTab === 'penal' && pcv ? pcv : wv
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
    const parts = new URL(url).pathname.split('/').filter(Boolean)
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

function showPage(id) {
  const page = findPage(id)
  if (!page || !page.el) return
  activePageId = page.id
  wv = page.el
  allPageViews().forEach((v) => {
    v.classList.toggle('wv-off', activeTab !== 'mdc' || v !== page.el)
  })
  renderPageBar()
  try {
    if (address) address.value = page.el.getURL()
  } catch (_) {
  }
  updateNav()
  document.dispatchEvent(new Event('mdc:chrome-changed'))
}

function closePage(id) {
  if (pages.length < 2) return
  const idx = pages.map((p) => p.id).indexOf(id)
  if (idx < 0) return
  const page = pages[idx]
  pages.splice(idx, 1)
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

const address = el('address')
const addrGroup = el('addr-group')
const lookupGroup = el('lookup-group')
const toolbar = el('toolbar')
const statusbar = el('statusbar')
const sbStatus = el('sb-status')
const sbTheme = el('sb-theme')
const sbClock = el('sb-clock')
const qName = el('q-name')
const qPlate = el('q-plate')
const findbar = el('findbar')
const findInput = el('find-input')
const findCase = el('find-case')
const findCount = el('find-count')

const HOME = 'https://mdc.gta.world/'
const RECORD_URL = 'https://mdc.gta.world/record/'
const DMV_URL = 'https://mdc.gta.world/dmv/'
const PENAL_URL = 'https://forum.gta.world/en/topic/78852-san-andreas-penal-code/'

const APP_NAME = 'PatrolOne Mobile Client'
const REPO_URL = 'https://github.com/coopik/MDC-Client-GTA-W'

const SKIN_CLASSES = ['dark', 'lapd', 'aero', 'aerolapd', 'aerodark', 'off']

const THEMES = {
  light: 'Classic Light',
  dark: 'Classic Dark',
  lapd: 'LAPD Mobile',
  aero: 'Windows 7 Aero',
  aerolapd: 'Windows 7 Aero LAPD',
  aerodark: 'Windows 7 Aero Dark',
  off: 'Original MDC'
}

let appInfo = {}
let zoom = 0

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
    const t = prefStr('theme', 'light')
    return THEMES[t] ? t : 'light'
  })(),
  toolbar: prefBool('toolbar', true),

  lookupFields: prefBool('lookupFields', false),
  addressBar: prefBool('addressBar', false),
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

if (prefStr('navChips', '') !== '1') {
  view.navBar = true
  view.sidebar = false
  savePref('navBar', true)
  savePref('sidebar', false)
  savePref('navChips', '1')
}

if (view.navBar && view.sidebar) {
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
  { id: 'mi-toolbar', key: 'toolbar', label: 'Toolbar', accel: '' },
  { id: 'mi-lookup', key: 'lookupFields', label: 'Lookup Fields', accel: '' },
  { id: 'mi-addr', key: 'addressBar', label: 'Address Bar', accel: 'F9' },
  { id: 'mi-status', key: 'statusBar', label: 'Status Bar', accel: '' },
  { id: 'mi-sidebar', key: 'sidebar', label: 'MDC Side Panel', accel: 'F10' }
]

const THEME_ITEMS = [
  { id: 'mi-theme-light', theme: 'light', label: 'Classic Light Skin', accel: 'F8' },
  { id: 'mi-theme-dark', theme: 'dark', label: 'Classic Dark Skin', accel: '' },
  { id: 'mi-theme-lapd', theme: 'lapd', label: 'LAPD Mobile Skin', accel: '' },
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
    markItem(document.getElementById(item.id), view[item.key], item.label, item.accel)
  })
  THEME_ITEMS.forEach((item) => {
    markItem(document.getElementById(item.id), view.theme === item.theme, item.label, item.accel)
  })
}

function pushPresence() {
  if (!window.mdt || typeof window.mdt.setPresence !== 'function') return
  let where = 'Mobile Data Computer'
  try {
    if (activeTab === 'penal') {
      where = 'Reading the penal code'
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
  if (view.navBar && view.sidebar) {
    view.sidebar = false
    savePref('sidebar', false)
  }
  const sidebarBtn = document.getElementById('btn-sidebar')
  if (sidebarBtn) {
    sidebarBtn.disabled = !!view.navBar
    sidebarBtn.title = view.navBar
      ? 'Unavailable while the navigation bar is on (Tools > Options)'
      : 'Show or hide the MDC side panel (F10)'
  }
  renderNav()
  renderQuickBar()
  if (hdrCtl) hdrCtl.classList.toggle('hidden', view.theme === 'off')
  if (view.theme === 'off') closeHeaderMenu()
  if (toolbar) toolbar.classList.toggle('hidden', !view.toolbar)
  if (statusbar) statusbar.classList.toggle('hidden', !view.statusBar)
  if (addrGroup) addrGroup.classList.toggle('hidden', !view.addressBar)
  if (lookupGroup) lookupGroup.classList.toggle('hidden', !view.lookupFields)
  SKIN_CLASSES.forEach((name) => {
    document.body.classList.toggle('theme-' + name, view.theme === name)
  })
  if (sbTheme) sbTheme.textContent = 'Skin: ' + THEMES[view.theme]
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
  if (key === 'sidebar' && view.navBar) {
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
  view.theme = THEMES[next] ? next : 'light'
  savePref('theme', view.theme)
  applyView()
  applySkin()
}

function cycleTheme() {
  const order = ['light', 'dark', 'lapd', 'aero', 'aerolapd', 'aerodark', 'off']
  setTheme(order[(order.indexOf(view.theme) + 1) % order.length])
}

function applySkin() {
  allPageViews().forEach((v) => {
    try {
      v.send('mdt:set-skin', view.theme)
    } catch (_) {
    }
  })
  try {
    if (pcv) pcv.send('mdt:set-skin', view.theme)
  } catch (_) {
  }
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
}

function setStatus(t) { if (sbStatus) sbStatus.textContent = t }

function runName() {
  if (!qName) return
  const q = qName.value.trim()
  if (!q) { qName.focus(); return }
  setStatus('Name check: ' + q)
  histAdd({ url: RECORD_URL + encodeURIComponent(q), label: q, kind: 'Name check', query: q })
  wv.loadURL(RECORD_URL + encodeURIComponent(q))
}

function runPlate() {
  if (!qPlate) return
  const q = qPlate.value.trim().replace(/[\s-]/g, '').toUpperCase()
  if (!q) { qPlate.focus(); return }
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

const backdrop = el('modal-backdrop')
const dialogTitle = el('dialog-title-text')
const dialogBody = el('dialog-body')


let dragPos = null

function dialogEl() {
  return backdrop ? backdrop.querySelector('.dialog') : null
}

function resetDialogPos() {
  const box = dialogEl()
  if (!box) return
  box.style.left = ''
  box.style.top = ''
  box.style.position = ''
  box.classList.remove('dragged')
}

function startDialogDrag(e) {
  if (!view.dragWindows || !e || e.button !== 0) return
  const box = dialogEl()
  if (!box) return
  if (e.target && e.target.closest && e.target.closest('button')) return
  const rect = box.getBoundingClientRect()
  box.classList.add('dragged')
  box.style.position = 'fixed'
  box.style.left = rect.left + 'px'
  box.style.top = rect.top + 'px'
  dragPos = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, box: box }
  e.preventDefault()
}

function moveDialogDrag(e) {
  if (!dragPos) return
  const box = dragPos.box
  const x = Math.min(Math.max(e.clientX - dragPos.dx, 60 - box.offsetWidth), window.innerWidth - 60)
  const y = Math.min(Math.max(e.clientY - dragPos.dy, 0), window.innerHeight - 28)
  box.style.left = x + 'px'
  box.style.top = y + 'px'
}

function endDialogDrag() {
  dragPos = null
}

function applyDrag() {
  allPageViews().forEach((v) => {
    try {
      v.send('mdt:set-drag', !!view.dragWindows)
    } catch (_) {
    }
  })
  try {
    if (pcv) pcv.send('mdt:set-drag', !!view.dragWindows)
  } catch (_) {
  }
}

function openDialog(title, html) {
  if (!backdrop) return
  if (dialogTitle) dialogTitle.textContent = title
  if (dialogBody) dialogBody.innerHTML = html
  resetDialogPos()
  backdrop.classList.remove('hidden')
}

function closeDialog() {
  if (backdrop) backdrop.classList.add('hidden')
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
    return histList.filter((entry) => histMatch(entry, q))
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
      '<div class="hist-row" data-url="' + esc(entry.url) + '" title="' + esc(entry.url) + '">' +
      '<span class="hist-when">' + esc(histWhen(entry.at)) + '</span>' +
      '<span class="hist-kind">' + esc(entry.kind || 'Page') + '</span>' +
      '<span class="hist-what">' + esc(entry.label || entry.query || entry.url) + '</span>' +
      '</div>').join('')
  }

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
        showTab('penal')
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
    if (plate) {
      if (qPlate) qPlate.value = q
      runPlate()
    } else {
      if (qName) qName.value = q
      runName()
    }
  }
  on(el('ask-go'), 'click', submit)
  on(input, 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } })
  if (input) { input.focus(); input.select() }
}

const KEY_ACTIONS = [
  { action: 'keyhelp', label: 'Keyboard shortcuts', combo: 'F1' },
  { action: 'findnext', label: 'Find next', combo: 'F3' },
  { action: 'reload', label: 'Reload page', combo: 'F5' },
  { action: 'cycletheme', label: 'Next skin', combo: 'F8' },
  { action: 'toggleaddr', label: 'Show or hide the address bar', combo: 'F9' },
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
  for (let i = 0; i < KEY_ACTIONS.length; i++) {
    if (KEY_ACTIONS[i].action === action) return KEY_ACTIONS[i]
  }
  return null
}

function comboFor(action) {
  const item = keyItem(action)
  return keymap[action] || (item ? item.combo : '')
}

function comboOf(e) {
  const raw = e.key || ''
  if (!raw || ['Control', 'Alt', 'Shift', 'Meta', 'OS'].indexOf(raw) >= 0) return ''
  let name = raw.length === 1 ? raw.toUpperCase() : raw
  name = name.replace(/^Arrow/, '')
  if (name === ' ') name = 'Space'
  let out = ''
  if (e.ctrlKey) out += 'Ctrl+'
  if (e.altKey) out += 'Alt+'
  if (e.shiftKey && (name.length > 1 || e.ctrlKey || e.altKey)) out += 'Shift+'
  return out + name
}

function actionForCombo(combo) {
  if (!combo) return ''
  const want = combo.toLowerCase()
  for (let i = 0; i < KEY_ACTIONS.length; i++) {
    if (comboFor(KEY_ACTIONS[i].action).toLowerCase() === want) return KEY_ACTIONS[i].action
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
  KEY_ACTIONS.forEach((item) => {
    const combo = comboFor(item.action)
    const single = /^Ctrl\+(.)$/i.exec(combo)
    if (/^Mouse[245]$/i.test(combo)) mouse[combo] = item.action
    else if (/^F\d+$/i.test(combo)) plain[combo.toUpperCase()] = item.action
    else if (single) ctrl[single[1].toLowerCase()] = item.action
  })
  return { plain, ctrl, mouse }
}

function sendKeys() {
  const payload = keysForViews()
  allPageViews().forEach((v) => {
    try {
      v.send('mdt:set-keys', payload)
    } catch (_) {
    }
  })
  try {
    if (pcv) pcv.send('mdt:set-keys', payload)
  } catch (_) {
  }
}

function showKeys() {
  const rows = KEY_ACTIONS.map((item) =>
    '<tr><td>' + esc(item.label) + '</td>' +
    '<td class="key-combo">' + esc(/^Mouse[245]$/.test(comboFor(item.action)) ? mouseLabel(comboFor(item.action)) : comboFor(item.action)) + '</td>' +
    '<td><button class="btn-sm key-set" data-key="' + item.action + '">Change</button></td></tr>'
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
      if (clash && clash !== action) delete keymap[clash]
      const item = keyItem(action)
      if (item && item.combo.toLowerCase() === combo.toLowerCase()) delete keymap[action]
      else keymap[action] = combo
      keysSave()
      sendKeys()
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
  on(el('key-reset'), 'click', () => {
    keymap = {}
    keysSave()
    sendKeys()
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
    radio('light') + radio('dark') + radio('lapd') + radio('aero') +
    radio('aerolapd') + radio('aerodark') + radio('off') +
    '<p class="opt-note">F8 cycles through the skins. The three Windows 7 Aero ' +
    'skins give the client, the MDC and every popped-up window the glass ' +
    'gradients, rounded panels and blue highlights of a Windows 7 era ' +
    'terminal, in light, patrol navy or graphite. LAPD Mobile repaints the ' +
    'whole MDC, the penal code tab and the client chrome in patrol colours.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Quick shortcuts</legend>' +
    check('quickLinks', 'Quick shortcuts bar (icon buttons under the tabs)') +
    '<p class="opt-note">Large icon buttons for Home, Query, Traffic, C6, Calls ' +
    'and Dispatch, shown under the tab strip on any custom skin.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Layout</legend>' +
    check('toolbar', 'Toolbar') +
    check('lookupFields', 'Lookup fields (duplicates the MDC search boxes)') +
    check('addressBar', 'Address bar') +
    check('statusBar', 'Status bar') +
    check('navBar', 'MDC navigation bar (side panel links as tabs)') +
    check('sidebar', 'MDC side panel (F10)', view.navBar) +
    '<p class="opt-note">' + (view.navBar
      ? 'The navigation bar is on, so the side panel is hidden and locked. Clear the navigation bar to go back to using the side panel.'
      : 'The navigation bar puts the side panel links in the tab strip next to Penal Code. Turning it on hides and locks the side panel.') +
    '</p>' +
    check('searchBoxes', 'MDC search boxes (Search Person and Search Vehicle)') +
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

function applyPenalSkin() {
  if (!pcv || !pcv.send) return
  try {
    pcv.send('mdt:set-skin', view.theme)
  } catch (_) {
  }
}

function penalFilter() {
  if (!pcv || !pcv.send) return
  try {
    pcv.send('mdt:penal-filter', pcSearch ? String(pcSearch.value || '') : '')
  } catch (_) {
  }
}

const NAV_ICONS = [
  [/dashboard/i, '\u25A6'],
  [/person\s*lookup|persons?|people/i, '\u263A'],
  [/dmv|vehicle|plate/i, '\u26D0'],
  [/wanted|warrant/i, '\u2691'],
  [/incident|report/i, '\u2637'],
  [/arrest|booking/i, '\u26D3'],
  [/map|location/i, '\u2316'],
  [/misc|other/i, '\u2630'],
  [/changelog|version/i, '\u2261'],
  [/law|penal|code/i, '\u2696'],
  [/mail|email|message/i, '\u2709'],
  [/call|dispatch/i, '\u260E'],
  [/citation|ticket/i, '\u270E'],
  [/note|memo/i, '\u2338'],
  [/web|site/i, '\u2295']
]

function navIcon(label) {
  for (let i = 0; i < NAV_ICONS.length; i++) {
    if (NAV_ICONS[i][0].test(label)) return NAV_ICONS[i][1]
  }
  return '\u25AB'
}

let navItems = []
let navCurrent = ''

const QUICK_BUTTONS = [
  { icon: 'home.png', label: 'Home', match: /dashboard|^home$/i, url: HOME },
  { icon: 'query.png', label: 'Query', match: /person lookup/i, url: HOME },
  { icon: 'traffic.png', label: 'Traffic', match: /dmv database/i, url: DMV_URL },
  { icon: 'c6.png', label: 'C6', match: /vehicle map/i, url: 'https://mdc.gta.world/map/vehicles' },
  { icon: 'calls.png', label: 'Calls', match: /incident database/i, url: 'https://mdc.gta.world/emergency/list' },
  { icon: 'dispatch.png', label: 'Dispatch', match: /active warrants|warrants database|online warrants/i, url: HOME }
]

function quickTarget(btn) {
  const hit = navItems.find((item) => btn.match.test(item.label))
  return hit ? hit.url : btn.url
}

function renderQuickBar() {
  if (!quickBar) return
  const on = view.quickLinks && view.theme !== 'off'
  quickBar.classList.toggle('hidden', !on)
  quickBar.textContent = ''
  if (!on) return
  const caption = document.createElement('span')
  caption.className = 'quickcap'
  caption.textContent = 'Quick shortcuts'
  quickBar.appendChild(caption)
  const row = document.createElement('div')
  row.className = 'quickrow'
  quickBar.appendChild(row)
  QUICK_BUTTONS.forEach((btn) => {
    const node = document.createElement('button')
    node.className = 'quickbtn'
    node.title = btn.label
    const img = document.createElement('img')
    img.className = 'quickicon'
    img.src = 'icons/' + btn.icon
    img.alt = ''
    node.appendChild(img)
    const text = document.createElement('span')
    text.className = 'quicklabel'
    text.textContent = btn.label
    node.appendChild(text)
    node.addEventListener('click', () => {
      const url = quickTarget(btn)
      navCurrent = url
      showTab('mdc')
      try {
        wv.send('mdt:nav-go', url)
      } catch (_) {
      }
      setStatus(btn.label)
      playSound('click')
      renderNav()
    })
    node.addEventListener('contextmenu', (ev) => {
      ev.preventDefault()
      openPage(quickTarget(btn))
      setStatus(btn.label + ' (new page)')
    })
    row.appendChild(node)
  })
}

const hdrPop = el('hdr-popup')
let hdrOpen = ''

function closeHeaderMenu() {
  hdrOpen = ''
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

function clearAlerts() {
  alertCount = 0
  setAlertAck(0)
  renderAlerts()
}

function headerCtlClick(kind) {
  if (hdrOpen === kind) {
    closeHeaderMenu()
    return
  }
  closeHeaderMenu()
  hdrOpen = kind
  const btn = el('hb-' + (kind === 'bell' ? 'bell' : kind === 'menu' ? 'menu' : 'history'))
  if (btn) btn.classList.add('active')
  showTab('mdc')
  playSound('click')
  try {
    wv.send('mdt:header-menu-request', kind)
  } catch (_) {
  }
}

function renderHeaderMenu(kind, items) {
  if (!hdrPop || hdrOpen !== kind) return
  hdrPop.textContent = ''
  const list = Array.isArray(items) ? items : []
  if (!list.length) {
    const empty = document.createElement('div')
    empty.className = 'hdrpop-empty'
    empty.textContent = 'Nothing to show.'
    hdrPop.appendChild(empty)
  }
  list.forEach((item) => {
    const row = document.createElement('button')
    row.className = 'hdrpop-item'
    const label = document.createElement('span')
    label.className = 'hdrpop-label'
    label.textContent = item.label || item.sub || ''
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
}

function wireHeaderCtl() {
  on(el('hb-history'), 'click', (e) => { e.stopPropagation(); headerCtlClick('history') })
  on(el('hb-bell'), 'click', (e) => { e.stopPropagation(); clearAlerts(); headerCtlClick('bell') })
  on(el('hb-menu'), 'click', (e) => { e.stopPropagation(); headerCtlClick('menu') })
  on(document, 'click', (e) => {
    if (!hdrOpen) return
    if (hdrPop && hdrPop.contains(e.target)) return
    closeHeaderMenu()
  })
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && hdrOpen) closeHeaderMenu()
  })
}

function renderNav() {
  if (!tabNav) return
  tabNav.textContent = ''
  navItems.forEach((item) => {
    const chip = document.createElement('button')
    chip.className = 'navchip' + (item.url === navCurrent ? ' active' : '')
    chip.title = item.label + '\n' + item.url
    if (/sign\s*out|log\s*out|logout/i.test(item.label)) {
      const img = document.createElement('img')
      img.className = 'naviconimg'
      img.src = 'icons/logout.png'
      img.alt = ''
      chip.appendChild(img)
      chip.classList.add('navchip-out')
    } else {
      const icon = document.createElement('span')
      icon.className = 'navicon'
      icon.textContent = navIcon(item.label)
      chip.appendChild(icon)
    }
    const text = document.createElement('span')
    if (item.depth > 1) text.className = 'navsub'
    text.textContent = item.label
    chip.appendChild(text)
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
  tabNav.classList.toggle('hidden', !navItems.length || !view.navBar)
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
  renderNav()
}

function showTab(name) {
  activeTab = name === 'penal' ? 'penal' : 'mdc'
  const penal = activeTab === 'penal'
  if (pcv) {
    pcv.classList.toggle('wv-off', !penal)
    if (penal && pcv.getAttribute('data-loaded') !== '1') {
      pcv.setAttribute('data-loaded', '1')
      try {
        pcv.loadURL(PENAL_URL)
      } catch (_) {
      }
    }
  }
  allPageViews().forEach((v) => {
    if (v) v.classList.toggle('wv-off', penal || v !== wv)
  })
  renderPageBar()
  if (pcBar) pcBar.classList.toggle('hidden', !penal)
  const tabMdc = document.getElementById('tab-mdc')
  const tabPenal = document.getElementById('tab-penal')
  if (tabMdc) tabMdc.classList.toggle('active', !penal)
  if (tabPenal) tabPenal.classList.toggle('active', penal)
  document.dispatchEvent(new Event('mdc:chrome-changed'))
  setStatus(penal ? 'San Andreas Penal Code' : 'Ready')
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
  zoomin: () => { zoom = Math.min(zoom + 0.5, 3); activeView().setZoomLevel(zoom) },
  zoomout: () => { zoom = Math.max(zoom - 0.5, -3); activeView().setZoomLevel(zoom) },
  zoomreset: () => { zoom = 0; activeView().setZoomLevel(0) },
  tabmdc: () => showTab('mdc'),
  tabpenal: () => showTab('penal'),
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
      if (pcv) {
        try {
          pcv.loadURL(PENAL_URL)
        } catch (_) {
        }
      }
    }
  },
  themelight: () => setTheme('light'),
  themedark: () => setTheme('dark'),
  themelapd: () => setTheme('lapd'),
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
  toggletoolbar: () => toggle('toolbar'),
  toggleaddr: () => toggle('addressBar'),
  togglelookup: () => toggle('lookupFields'),
  togglestatus: () => toggle('statusBar'),
  togglesidebar: () => toggle('sidebar'),
  togglenavbar: () => toggle('navBar'),
  find: () => openFind(),
  findnext: () => { if (findOpen()) doFind(true) },
  focusname: () => {
    if (view.lookupFields && qName) { qName.focus(); qName.select() } else promptLookup('name')
  },
  focusplate: () => {
    if (view.lookupFields && qPlate) { qPlate.focus(); qPlate.select() } else promptLookup('plate')
  },
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
      await window.mdt.clearSession()
      setStatus('Session cleared')
      wv.loadURL(HOME)
    }
  }
}

function run(action) {
  const fn = actions[action]
  if (!fn) return
  playSound(CLOSE_ACTIONS[action] ? 'close' : 'click')
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

boot('toolbar', () => {
  const map = {
    'btn-back': 'back',
    'btn-forward': 'forward',
    'btn-refresh': 'reload',
    'btn-stop': 'stop',
    'btn-home': 'home',
    'btn-namecheck': 'namecheck',
    'btn-platecheck': 'platecheck',
    'btn-history': 'history',
    'btn-newpage': 'newpage',
    'btn-settings': 'options'
  }
  Object.keys(map).forEach((id) => {
    on(document.getElementById(id), 'click', () => run(map[id]))
  })

  on(el('go-name'), 'click', runName)
  on(el('go-plate'), 'click', runPlate)
  on(qName, 'keydown', (e) => { if (e.key === 'Enter') runName() })
  on(qPlate, 'keydown', (e) => { if (e.key === 'Enter') runPlate() })
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
  on(el('dialog-ok'), 'click', closeDialog)
  on(el('dialog-close'), 'click', closeDialog)

  const title = backdrop ? backdrop.querySelector('.dialog-title') : null
  on(title, 'mousedown', startDialogDrag)
  on(window, 'mousemove', moveDialogDrag)
  on(window, 'mouseup', endDialogDrag)
})

function wirePage(wv, page) {
  const isActive = () => activeTab === 'mdc' && !!page && page.id === activePageId

  on(wv, 'did-start-loading', () => {
    if (isActive()) setStatus('Opening mdc.gta.world...')
  })

  on(wv, 'dom-ready', () => {
    try {
      wv.send('mdt:set-skin', view.theme)
      wv.send('mdt:set-drag', !!view.dragWindows)
      wv.send('mdt:set-sidebar', !!view.sidebar)
      wv.send('mdt:set-search-boxes', !!view.searchBoxes)
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
    if (address) address.value = e.url
    updateNav()
  })

  on(wv, 'did-navigate-in-page', (e) => {
    if (page) page.url = e.url
    if (!isActive()) return
    if (address) address.value = e.url
    updateNav()
  })

  on(wv, 'page-title-updated', (e) => {
    if (page) page.title = e.title || 'Page'
    if (page) histLabel(page.url, pageLabel(page))
    renderPageBar()
    if (!isActive()) return
    document.title = APP_NAME
    setStatus(e.title || 'Ready')
  })

  on(wv, 'ipc-message', (e) => {
    if (!isActive()) return
    if (e.channel === 'mdt:page-info') {
      const info = (e.args && e.args[0]) || {}

      if (sbTheme) {
        sbTheme.textContent = info.skinnable === false
          ? 'Skin: not applied (sign-in)'
          : 'Skin: ' + THEMES[view.theme]
      }
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
})

function updateNav() {
  try {
    const back = document.getElementById('btn-back')
    const fwd = document.getElementById('btn-forward')
    if (back) back.disabled = !wv.canGoBack()
    if (fwd) fwd.disabled = !wv.canGoForward()
  } catch (_) {
  }
}

boot('sidebar-button', () => {
  on(el('btn-sidebar'), 'click', () => run('togglesidebar'))
})

boot('sizing', () => {
  const content = document.querySelector('.content')

  function sizeWebview() {
    if (!content) return
    const w = content.clientWidth
    const h = content.clientHeight
    if (w <= 0 || h <= 0) return
    ;allPageViews().concat([pcv]).forEach((v) => {
      if (!v || !v.style) return
      v.style.width = w + 'px'
      v.style.height = h + 'px'
    })
  }

  sizeWebview()
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

boot('keyboard', () => {
  document.addEventListener('keydown', (e) => {
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

boot('penal', () => {
  if (!pcv) return

  on(pcv, 'did-start-loading', () => setStatus('Opening forum.gta.world...'))

  on(pcv, 'did-stop-loading', () => {
    applyPenalSkin()
    penalFilter()
  })

  on(pcv, 'did-fail-load', (e) => {
    if (e.errorCode === -3) return
    setStatus('Penal code error ' + e.errorCode + ': ' + e.errorDescription)
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
      if (activeTab !== 'penal') return
      setStatus(info.signedIn ? 'San Andreas Penal Code' : 'Forum sign-in required')
      return
    }
    if (e.channel === 'mdt:penal-result') {
      const r = (e.args && e.args[0]) || {}
      if (!r.query) setStatus('San Andreas Penal Code')
      else setStatus('Penal code: ' + r.shown + ' of ' + r.total + ' sections match "' + r.query + '"')
    }
  })

  on(pcv, 'found-in-page', (e) => {
    const r = e.result || {}
    if (!findCount) return
    findCount.textContent = r.matches ? (r.activeMatchOrdinal || 0) + ' of ' + r.matches : 'No matches'
  })
})

boot('tabs', () => {
  on(document.getElementById('tab-mdc'), 'click', () => run('tabmdc'))
  on(document.getElementById('tab-penal'), 'click', () => run('tabpenal'))
  on(pcSearch, 'input', penalFilter)
  on(el('pc-clear'), 'click', () => {
    if (pcSearch) pcSearch.value = ''
    penalFilter()
  })
  on(el('pc-signout'), 'click', () => run('penalsignout'))

  document.addEventListener('keydown', (e) => {
    if (!e.ctrlKey || e.altKey || e.shiftKey) return
    if (e.key === '1') {
      e.preventDefault()
      run('tabmdc')
    } else if (e.key === '2') {
      e.preventDefault()
      run('tabpenal')
    }
  })
})
