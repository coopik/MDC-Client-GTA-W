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

  // Caption on its own line with the strip underneath, the same shape as the
  // quick shortcuts bar, so the row says what it is.
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

const THEMES = {
  light: 'Classic Light',
  dark: 'Classic Dark',
  lapd: 'LAPD Mobile',
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
  minimizeToTray: prefBool('minimizeToTray', false)
}

// The navigation bar replaces the site side panel, so switch anyone upgrading
// from an older build over to it once. The two are mutually exclusive: the side
// panel stays off and locked while the navigation bar is on.
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
  error: 'sounds/error.mp3'
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
  error: 700
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
    if (played && played.catch) played.catch(() => { })
  } catch (_) { }
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

function applyView() {
  // The navigation bar and the side panel cannot both be on.
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
  document.body.classList.toggle('theme-dark', view.theme === 'dark')
  document.body.classList.toggle('theme-lapd', view.theme === 'lapd')
  if (sbTheme) sbTheme.textContent = 'Skin: ' + THEMES[view.theme]
  applySidebar()
  applyTray()
  renderChecks()

  try {
    document.dispatchEvent(new Event('mdc:chrome-changed'))
  } catch (_) {
  }
}

function toggle(key) {
  // The side panel is restricted while the navigation bar is on.
  if (key === 'sidebar' && view.navBar) {
    setStatus('Side panel is unavailable while the navigation bar is on. Turn it off in Tools > Options.')
    playSound('error')
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
  const order = ['light', 'dark', 'lapd', 'off']
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
  wv.loadURL(RECORD_URL + encodeURIComponent(q))
}

function runPlate() {
  if (!qPlate) return
  const q = qPlate.value.trim().replace(/[\s-]/g, '').toUpperCase()
  if (!q) { qPlate.focus(); return }
  setStatus('Plate check: ' + q)
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
    try { activeView().stopFindInPage('clearSelection') } catch (_) { }
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
    if (findActive) { try { activeView().stopFindInPage('clearSelection') } catch (_) { } }
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

function openDialog(title, html) {
  if (!backdrop) return
  if (dialogTitle) dialogTitle.textContent = title
  if (dialogBody) dialogBody.innerHTML = html
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

function showAbout() {
  openDialog('About MDC Client',
    '<table>' +
    row('Product:', 'MDC Client') +
    row('Version:', appInfo.version || '1.0.0') +
    row('Runtime:', 'Electron ' + (appInfo.electron || '') + ' / Chromium ' + (appInfo.chrome || '')) +
    row('Endpoint:', HOME) +
    '</table>' +
    '<p>Desktop client for the GTA World Web MDC. Sign-in is handled by the MDC site itself; ' +
    'no credentials are stored by this application.</p>')
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
    radio('light') + radio('dark') + radio('lapd') + radio('off') +
    '<p class="opt-note">F8 cycles through the four skins. The LAPD Mobile skin ' +
    'repaints the whole MDC, the penal code tab and the client chrome in ' +
    'PremierOne colours.</p>' +
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
    '<p class="opt-note">Off by default. Plays a short tone on clicks and navigation, a second tone when closing a dialog or going back, and an error tone on failed actions and error messages.</p>' +
    '</fieldset>' +
    '<fieldset class="opt-group"><legend>Window</legend>' +
    check('minimizeToTray', 'Minimize to the notification area (system tray)') +
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
    input.addEventListener('change', () => toggle(input.getAttribute('data-opt')))
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

/* Quick shortcuts: a PremierOne-style icon strip, shown on any custom skin when
   the Quick Shortcuts option is on. Each button prefers the matching entry from
   the MDC's own navigation (so it follows the site if a page moves) and falls
   back to a known URL. */
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
  // The caption sits on its own line, with the buttons in a row underneath.
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

/* The MDC page header's own history, notifications and account controls stay
   hidden on a custom skin. The client asks the page for the contents of a
   dropdown and draws it here, next to Help, so nothing pops open half-way down
   the page and the original icons never come back. */
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
  on(el('hb-bell'), 'click', (e) => { e.stopPropagation(); headerCtlClick('bell') })
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
    const icon = document.createElement('span')
    icon.className = 'navicon'
    icon.textContent = navIcon(item.label)
    chip.appendChild(icon)
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
      playSound('click')
      renderNav()
    })
    // Right-click opens the destination as another page instead of replacing
    // the current one.
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
  print: () => activeView().print({}),
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
    if (view.lookupFields && qName) { qName.focus(); qName.select() } else nativeSearch('person')
  },
  focusplate: () => {
    if (view.lookupFields && qPlate) { qPlate.focus(); qPlate.select() } else nativeSearch('vehicle')
  },
  devtools: () => activeView().openDevTools(),
  layoutreport: () => {
    setStatus('Measuring page layout...')
    wv.send('mdt:layout-report')
  },
  copyurl: () => navigator.clipboard.writeText(activeView().getURL()).then(() => setStatus('Address copied')),
  opensite: () => window.mdt.openExternal('https://gta.world/'),
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
    'btn-print': 'print',
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
})

/* Wires one page's webview. Handlers that touch shell chrome (status bar,
   address bar, window title) only act when that page is the visible one, so a
   background page finishing a load cannot hijack the interface. */
function wirePage(wv, page) {
  const isActive = () => activeTab === 'mdc' && !!page && page.id === activePageId

  on(wv, 'did-start-loading', () => {
    if (isActive()) setStatus('Opening mdc.gta.world...')
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
    renderPageBar()
    if (!isActive()) return
    document.title = e.title ? 'MDC Client - ' + e.title : 'MDC Client'
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
      if (info.subject) setStatus('Record: ' + info.subject)
      else if (info.officer) setStatus('Signed in: ' + info.officer)
      return
    }
    if (e.channel === 'mdt:header-menu') {
      const payload = (e.args && e.args[0]) || {}
      renderHeaderMenu(String(payload.kind || ''), payload.items)
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
      ; allPageViews().concat([pcv]).forEach((v) => {
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
    const k = (e.key || '').toLowerCase()

    if (e.key === 'F5') run('reload')
    else if (e.key === 'F3') { e.preventDefault(); run('findnext') }
    else if (e.key === 'F8') run('cycletheme')
    else if (e.key === 'F9') run('toggleaddr')
    else if (e.key === 'F10') { e.preventDefault(); run('togglesidebar') }
    else if (e.key === 'Escape') {
      closeMenus()
      if (findOpen()) closeFind()
      else if (backdrop && !backdrop.classList.contains('hidden')) closeDialog()
      else if (!typing) run('stop')
    } else if (e.ctrlKey && k === 'f') { e.preventDefault(); run('find') }
    else if (e.altKey && e.key === 'ArrowLeft') run('back')
    else if (e.altKey && e.key === 'ArrowRight') run('forward')
    else if (e.ctrlKey && k === 'n') { e.preventDefault(); run('focusname') }
    else if (e.ctrlKey && k === 'l') { e.preventDefault(); run('focusplate') }
    else if (e.ctrlKey && k === 'p') { e.preventDefault(); run('print') }
    else if (e.ctrlKey && k === 't') { e.preventDefault(); run('newpage') }
    else if (e.ctrlKey && k === 'w') { e.preventDefault(); run('closepage') }
    else if (e.ctrlKey && (e.key === '+' || e.key === '=')) run('zoomin')
    else if (e.ctrlKey && e.key === '-') run('zoomout')
    else if (e.ctrlKey && e.key === '0') run('zoomreset')
  })
})

boot('init', () => {
  setInterval(tick, 1000)
  tick()
  applyView()
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