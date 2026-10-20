'use strict'

const { ipcRenderer } = require('electron')
function comboOf(event) {
  const raw = event.key || ''
  if (!raw || ['Control', 'Alt', 'Shift', 'Meta', 'OS'].includes(raw)) return ''
  const ctrl = event.ctrlKey || event.metaKey
  if (ctrl && !event.altKey && (raw === '+' || raw === '=' || event.code === 'NumpadAdd')) return 'Ctrl++'
  if (ctrl && !event.altKey && (raw === '-' || event.code === 'NumpadSubtract')) return 'Ctrl+-'
  let name = raw.length === 1 ? raw.toUpperCase() : raw.replace(/^Arrow/, '')
  if (name === ' ') name = 'Space'
  return (ctrl ? 'Ctrl+' : '') + (event.altKey ? 'Alt+' : '') + (event.shiftKey && (name.length > 1 || ctrl || event.altKey) ? 'Shift+' : '') + name
}

const STYLE_ID = 'mdt-penal-skin'
const TOPIC_RE = /\/topic\/(?:78852|30297|62646)(?:[-/]|$)/

const PALETTES = {
  light: {
    panel: '#F0F0F0',
    panelAlt: '#ECE9D8',
    header: '#D4D0C8',
    border: '#A0A0A0',
    field: '#FFFFFF',
    fieldBorder: '#7F9DB9',
    text: '#000000',
    textMuted: '#3C3C3C',
    link: '#0000CC',
    zebra: '#F7F7F7',
    scrollTrack: '#F0F0F0',
    scrollThumb: '#C8C8C8',
    highlight: '#FFF6A0'
  },
  aerodark: {
    panel: '#2B2B2B',
    panelAlt: '#333333',
    header: '#3C3C3C',
    border: '#565656',
    field: '#1E1E1E',
    fieldBorder: '#6A6A6A',
    text: '#E4E4E4',
    textMuted: '#B4B4B4',
    link: '#7FB3FF',
    zebra: '#303030',
    scrollTrack: '#262626',
    scrollThumb: '#4A4A4A',
    highlight: '#6B5C00'
  },
  aerolapd: {
    panel: '#0E2360',
    panelAlt: '#13307E',
    header: '#1B3F9E',
    border: '#5C86D6',
    field: '#08174A',
    fieldBorder: '#7BA3E8',
    text: '#FFFFFF',
    textMuted: '#B9CBF2',
    link: '#9CC4FF',
    zebra: '#122A6E',
    scrollTrack: '#0B1C52',
    scrollThumb: '#33569E',
    highlight: '#7A6400'
  },
  aero: {
    panel: '#F1F6FB',
    panelAlt: '#E6F0FA',
    header: '#D3E5F5',
    border: '#8CAFCF',
    field: '#FFFFFF',
    fieldBorder: '#7DA2C4',
    text: '#10222E',
    textMuted: '#44586B',
    link: '#0B4C8C',
    zebra: '#F5F9FD',
    scrollTrack: '#EFF5FA',
    scrollThumb: '#B9D2E6',
    highlight: '#FFF3A8'
  }
}

PALETTES.p1 = Object.assign({}, PALETTES.light, {panel:'#DCDAD5', panelAlt:'#E9E7E1', field:'#F1F0EC', header:'#292929', headingInk:'#FFFFFF', border:'#9B9A94', text:'#202020', textMuted:'#45443F', link:'#224F78'})

const SKINS = ['p1', 'aero', 'aerolapd', 'aerodark', 'off']
let theme = 'p1'
let paintedMode = ''
let lastQuery = ''
let lastSoundName = ''
let lastSoundAt = 0

function isForumHost() {
  try {
    return /(^|\.)forum\.gta\.world$/i.test(location.hostname)
  } catch (_) {
    return false
  }
}

function hasTopicContent() {
  return !!document.getElementById('elPostFeed')
}

function isTopicPage() {
  try {
    return TOPIC_RE.test(location.pathname) && hasTopicContent()
  } catch (_) {
    return false
  }
}

function themeNow() {
  if (!isForumHost() || !isTopicPage()) return 'off'
  return SKINS.includes(theme) ? theme : 'p1'
}

function buildCss(p) {
  return `
#elPostFeed .cPost::before { content: none !important; display: none !important; }
header, #elSearch, #elSearchWrapper, #elUserNav, #elNotificationsBrowser,
.ipsNavBar_primary, .ipsNavBar_secondary, #elMobileDrawer, .ipsAppMenu,
.ipsBreadcrumb, #elFooter, #elFooterLinks, #elCopyright, .ipsPager,
.ipsRecommendedComments, .ipsComment_author, .cAuthorPane, .cAuthorPane_mobile,
.ipsPageHeader__meta, .ipsPhotoPanel, .ipsBadge, .ipsBadge_icon, .ipsHr,
#replyForm, [data-role="replyArea"], .ipsComment_ignored, .ipsAreaBackground,
.ipsComment_controls, .ipsComment_meta, .ipsComment_badges, .ipsComment_toolWrap,
.ipsItemControls, .ipsShareLinks, .ipsFollow, .ipsLikeRep, .ipsReact,
.ipsUserPhoto, .ipsPos_sticky, .ipsResponsive_showPhone, .ipsPageHeader .ipsButton,
.ipsType_sectionHead + .ipsButton, .ipsMenu, .ipsCookieAlert, #elGuestMessage,
.ipsPageHeader .ipsFlex-flex\\:11 + div, .ipsAreaBackground_reset > .ipsPad_half,
#elTopicEventLog, .cTopicEventLog, [data-role="eventLog"], [data-role="topicEventLog"],
.ipsQuote_citation, .ipsQuote_open, .ipsQuote_close,
.ipsPageHeader, .ipsPageHeader h1, .ipsType_pageTitle, .ipsPageHeader__meta {
  display: none !important;
}
.ipsPagination, .ipsPagination li, .ipsPagination a, .ipsPagination .ipsPagination_page,
.ipsPagination .ipsPagination_pageJump, .ipsPagination .ipsPagination_prev,
.ipsPagination .ipsPagination_next, .ipsPagination .ipsPagination_first,
.ipsPagination .ipsPagination_last, .ipsPagination_mobile, .ipsPagination_pageJump a {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}
html, body {
  background: ${p.panel} !important;
  color: ${p.text} !important;
  font-family: ${themeNow() === 'p1' ? 'Tahoma, "Microsoft Sans Serif", sans-serif' : '"Segoe UI", Tahoma, sans-serif'} !important;
  font-size: 12px !important;
  line-height: 16px !important;
  overflow-x: hidden !important;
  max-width: 100% !important;
}
body, #ipsLayout_body, #ipsLayout_contentArea, #ipsLayout_contentWrapper,
#ipsLayout_mainArea, .ipsLayout_container, .ipsAreaBackground_reset,
.cPost, .cPost_contentWrap, .ipsType_richText, [data-role="commentContent"] {
  overflow-x: hidden !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}
.ipsType_richText table, .ipsType_richText pre, .ipsType_richText img,
[data-role="commentContent"] table, [data-role="commentContent"] pre {
  max-width: 100% !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;
  white-space: normal !important;
}
body * {
  font-family: ${themeNow() === 'p1' ? 'Tahoma, "Microsoft Sans Serif", sans-serif' : '"Segoe UI", Tahoma, sans-serif'} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  text-shadow: none !important;
  letter-spacing: normal !important;
}
i, .fa, .fas, .far, .fal, [class*="fa-"], .ipsIcon, .material-icons {
  font-family: "Font Awesome 5 Free", "Font Awesome 5 Pro", FontAwesome, "Material Icons" !important;
  font-weight: 900 !important;
  font-style: normal !important;
}
.fab, [class*="fa-"].fab {
  font-family: "Font Awesome 5 Brands" !important;
  font-weight: 400 !important;
}
.ipsLayout_container, .ipsLayout_contentArea, #ipsLayout_mainArea,
#ipsLayout_contentWrapper, .ipsApp, .ipsAreaBackground_reset {
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  background: ${p.panel} !important;
}
article.cPost, .ipsBox, .cPost_contentWrap {
  background: ${p.panel} !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
  display: block !important;
  width: 100% !important;
}
#elPostFeed {
  background: ${p.panel} !important;
  border: 1px solid ${p.border} !important;
  margin: 4px !important;
  padding: 6px 10px !important;
}
.ipsType_richText, .ipsType_richText * {
  color: ${p.text} !important;
  background-color: transparent !important;
  font-size: 12px !important;
  line-height: 16px !important;
}
.ipsType_richText h1, .ipsType_richText h2, .ipsType_richText h3,
.ipsType_richText h4, .ipsType_richText strong, .ipsType_richText b {
  color: ${p.text} !important;
  font-weight: bold !important;
}
.ipsType_richText h1, .ipsType_richText h2 {
  background: ${p.header} !important;
  border: 1px solid ${p.border} !important;
  padding: 2px 6px !important;
  margin: 8px 0 4px 0 !important;
  font-size: 13px !important;
}
.ipsType_richText h3, .ipsType_richText h4 {
  border-bottom: 1px solid ${p.border} !important;
  margin: 6px 0 3px 0 !important;
  font-size: 12px !important;
}
.ipsType_richText p, .ipsType_richText li { margin: 2px 0 !important; }
.ipsType_richText a, a { color: ${p.link} !important; text-decoration: none !important; }
.ipsType_richText table {
  border-collapse: collapse !important;
  width: 100% !important;
  background: ${p.field} !important;
}
.ipsType_richText th {
  background: ${p.header} !important;
  border: 1px solid ${p.border} !important;
  padding: 2px 5px !important;
  text-align: left !important;
}
.ipsType_richText td {
  border: 1px solid ${p.border} !important;
  padding: 2px 5px !important;
}
.ipsType_richText tr:nth-child(even) td { background: ${p.zebra} !important; }
.ipsType_richText blockquote, .ipsQuote {
  background: ${p.panelAlt} !important;
  border: 1px solid ${p.border} !important;
  color: ${p.textMuted} !important;
  padding: 3px 6px !important;
  margin: 3px 0 !important;
}
#elPostFeed blockquote, #elPostFeed .ipsQuote, #elPostFeed [data-ipsquote],
#elPostFeed .ipsSpoiler, #elPostFeed .ipsStyle_spoiler {
  display: block !important;
  position: static !important;
  float: none !important;
  clear: both !important;
  width: auto !important;
  max-width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: visible !important;
  box-sizing: border-box !important;
  margin: 4px 0 !important;
}
#elPostFeed .ipsQuote_contents, #elPostFeed .ipsSpoiler_contents,
#elPostFeed [data-ipsquote-contents] {
  display: block !important;
  position: static !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: visible !important;
  margin: 0 !important;
  padding: 1px 0 !important;
}
#elPostFeed p, #elPostFeed li, #elPostFeed div, #elPostFeed span,
#elPostFeed h1, #elPostFeed h2, #elPostFeed h3, #elPostFeed h4, #elPostFeed strong {
  position: static !important;
  max-width: 100% !important;
  overflow-wrap: break-word !important;
}
#elPostFeed p, #elPostFeed li, #elPostFeed td, #elPostFeed th {
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: visible !important;
}
#elPostFeed img { max-width: 100% !important; max-height: 160px !important; height: auto !important; object-fit: contain !important; }

[data-mdt-penal-hit="1"] {
  background: ${p.highlight} !important;
  color: ${p.text} !important;
}
#elPostFeed, #elPostFeed *, .ipsPageHeader, .ipsPageHeader * {
  background-image: none !important;
}
.ipsSpoiler, .ipsSpoiler_header, .ipsSpoiler_contents, .ipsStyle_spoiler,
.ipsQuote_citation, .ipsQuote_contents, .ipsCode, pre, code, kbd, samp {
  background: ${p.field} !important;
  color: ${p.text} !important;
  border: 1px solid ${p.border} !important;
}
.ipsType_richText hr, #elPostFeed hr, .ipsHr {
  border: none !important;
  border-top: 1px solid ${p.border} !important;
  background: transparent !important;
  height: 0 !important;
  margin: 5px 0 !important;
}
.ipsType_richText mark, #elPostFeed mark {
  background: ${p.highlight} !important;
  color: ${p.text} !important;
}
.ipsType_richText ul, .ipsType_richText ol { padding-left: 18px !important; }
#elPostFeed { margin: 10px !important; padding: 14px 18px !important; border-radius: 3px !important; background: ${p.field} !important; }
#elPostFeed .ipsType_richText { line-height: 1.55 !important; }
#elPostFeed .ipsType_richText h1, #elPostFeed .ipsType_richText h2 { padding: 8px 12px !important; margin: 14px 0 8px !important; background: ${p.header} !important; color: ${p.headingInk || p.text} !important; }
#elPostFeed .ipsType_richText h1 *, #elPostFeed .ipsType_richText h2 *, #elPostFeed .ipsType_richText th, #elPostFeed .ipsType_richText th * { color: ${p.headingInk || p.text} !important; }
#elPostFeed .ipsType_richText h3, #elPostFeed .ipsType_richText h4 { padding: 5px 0 !important; margin: 12px 0 6px !important; }
#elPostFeed .ipsType_richText p { margin: 5px 0 !important; line-height: 1.55 !important; }
#elPostFeed .ipsType_richText blockquote { padding: 10px 12px !important; margin: 8px 0 14px !important; border-left: 3px solid ${p.fieldBorder} !important; }
#elPostFeed .ipsType_richText a:hover { text-decoration: underline !important; }
#elPostFeed [data-mdt-penal-art] {
  display: flow-root !important; position: static !important; float: none !important; clear: both !important;
  height: auto !important; min-height: 0 !important; overflow: visible !important;
  transform: none !important; margin: 20px 0 14px !important; padding: 12px !important;
  text-align: center !important; background: transparent !important; border: 0 !important;
}
#elPostFeed [data-mdt-penal-art] * { position: static !important; float: none !important; transform: none !important; margin-top: 0 !important; top: auto !important; }
#elPostFeed [data-mdt-penal-art] img { display: block !important; width: auto !important; height: auto !important; max-height: 160px !important; margin: 0 auto 10px !important; }
#elPostFeed [data-mdt-penal-divider] { height: 0 !important; min-height: 0 !important; padding: 0 !important; margin: 16px 0 0 !important; background: transparent !important; border: 0 !important; border-top: 1px solid ${p.border} !important; }
::-webkit-scrollbar { width: 12px; height: 12px; }
::-webkit-scrollbar-track { background: ${p.scrollTrack}; }
::-webkit-scrollbar-thumb { background: ${p.scrollThumb}; border: 1px solid ${p.border}; }
`
}

function styleEl() {
  let el = document.getElementById(STYLE_ID)
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
  }
  return el
}

function applyTheme(next) {
  if (typeof next === 'string') theme = SKINS.includes(next) ? next : 'p1'
  const mode = themeNow()
  const el = styleEl()
  if (mode === 'off') {
    if (el.parentNode) el.parentNode.removeChild(el)
    paintedMode = ''
    restorePenal()
    return
  }
  if (paintedMode && paintedMode !== mode) restorePenal()
  paintedMode = mode
  const css = buildCss(PALETTES[mode])
  if (el.textContent !== css) el.textContent = css
  if (!el.parentNode && document.head) document.head.appendChild(el)
  else if (!el.parentNode && document.documentElement) document.documentElement.appendChild(el)
  normalizeIllustrations()
  paintText(PALETTES[mode], mode)
  hideClosedNotice()
  scrubOoc()
}

function normalizeIllustrations() {
  document.querySelectorAll('#elPostFeed .ipsType_richText img').forEach((image) => {
    let block = image.closest('p, figure, div')
    if (!block || block.classList.contains('ipsType_richText')) return
    while (block.parentElement && !block.parentElement.classList.contains('ipsType_richText')) {
      const parent = block.parentElement
      if (flatText(parent).length > 220 || parent.querySelectorAll('img').length !== 1 || parent.querySelector('table, blockquote, h1, h2, h3')) break
      block = parent
    }
    if (flatText(block).length > 220 || block.querySelectorAll('img').length !== 1) return
    block.setAttribute('data-mdt-penal-art', '1')
    const previous = block.previousElementSibling
    if (previous && !flatText(previous) && !previous.querySelector('img, input, button, a, iframe') && previous.getBoundingClientRect().height > 20) previous.setAttribute('data-mdt-penal-divider', '1')
  })
}

function sections() {
  const out = []
  document.querySelectorAll('#elPostFeed .ipsType_richText').forEach((host) => {
    Array.prototype.forEach.call(host.children, (child) => {
      if (child && child.style) out.push(child)
    })
  })
  return out
}

function clearHits() {
  document.querySelectorAll('[data-mdt-penal-hit="1"]').forEach((el) => {
    if (el.dataset) delete el.dataset.mdtPenalHit
  })
}

function filterPenal(query) {
  lastQuery = String(query || '')
  const term = lastQuery.trim().toLowerCase()
  const nodes = sections()
  clearHits()
  let shown = 0
  nodes.forEach((el) => {
    if (!term) {
      el.style.removeProperty('display')
      shown++
      return
    }
    const text = String(el.textContent || '').toLowerCase()
    if (text.indexOf(term) === -1) {
      el.style.setProperty('display', 'none', 'important')
      return
    }
    el.style.removeProperty('display')
    if (el.dataset) el.dataset.mdtPenalHit = '1'
    shown++
  })
  try {
    ipcRenderer.sendToHost('mdt:penal-result', { shown: shown, total: nodes.length, query: lastQuery })
  } catch (_) {}
}

function sendSound(name) {
  const now = Date.now()
  if (name === lastSoundName && now - lastSoundAt < 400) return
  if (now - lastSoundAt < 120) return
  lastSoundName = name
  lastSoundAt = now
  try {
    ipcRenderer.sendToHost('mdt:sound', name)
  } catch (_) {}
}

function watchClicks() {
  document.addEventListener('click', (e) => {
    const t = e && e.target
    if (!t || !t.closest) return
    if (t.closest('.ipsDialog_close, [data-action="close"]')) sendSound('close')
    else if (t.closest('a, button, .ipsButton')) sendSound('click')
  }, true)
}

function reportPage() {
  try {
    ipcRenderer.sendToHost('mdt:penal-info', {
      signedIn: isTopicPage(),
      url: location.href,
      skinnable: themeNow() !== 'off'
    })
  } catch (_) {}
}

ipcRenderer.on('mdt:set-skin', (_e, next) => applyTheme(next))
ipcRenderer.on('mdt:penal-filter', (_e, query) => filterPenal(query))

let VIEW_KEY_COMBOS = null
const HOTKEYS = {
  F3: 'findnext',
  F5: 'reload',
  F8: 'cycletheme',
  F9: 'toggleaddr',
  F10: 'togglesidebar'
}

const CTRL_HOTKEYS = {
  f: 'find',
  p: 'print',
  '+': 'zoomin',
  '=': 'zoomin',
  '-': 'zoomout',
  '0': 'zoomreset'
}

ipcRenderer.on('mdt:set-keys', (_event, payload) => {
  if (payload && payload.combos) VIEW_KEY_COMBOS = payload.combos
})

window.addEventListener('keydown', (e) => {
  if (!e || e.defaultPrevented) return
  let action = ''
  if (VIEW_KEY_COMBOS) action = VIEW_KEY_COMBOS[comboOf(e)] || ''
  else if (e.ctrlKey || e.metaKey) {
    const key = e.code === 'NumpadAdd' || e.key === '=' ? '+' : e.code === 'NumpadSubtract' ? '-' : String(e.key || '').toLowerCase()
    if (e.altKey || (e.shiftKey && key !== '+')) return
    action = CTRL_HOTKEYS[key] || ''
  } else if (!e.altKey && !e.ctrlKey) {
    action = HOTKEYS[e.key] || ''
  }
  if (!action) return
  e.preventDefault()
  e.stopPropagation()
  try {
    ipcRenderer.sendToHost('mdt:hotkey', action)
  } catch (_) {}
}, true)

function boot() {
  applyTheme()
  watchClicks()
  reportPage()
  if (lastQuery) filterPenal(lastQuery)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}

if (typeof MutationObserver === 'function') {
  let pending = 0
  const observer = new MutationObserver(() => {
    if (pending) return
    pending = requestAnimationFrame(() => { pending = 0; applyTheme() })
  })
  const start = () => {
    if (document.body) observer.observe(document.body, { childList: true, subtree: true })
  }
  if (document.body) start()
  else document.addEventListener('DOMContentLoaded', start)
}

const NOISE_RES = [
  /now closed to further replies/i,
  /^edited\s.{0,60}\sby\s/i,
  /^\s*edited\s+(on\s+)?[a-z]+\s+\d{1,2}/i,
  /changed the title to/i,
  /\b(un)?(pinned|locked|featured|hid|archived|merged|moved)\s+this\s+topic\b/i
]

function isNoise(t) {
  for (let i = 0; i < NOISE_RES.length; i++) {
    if (NOISE_RES[i].test(t)) return true
  }
  return false
}

const OOC_RE = /\(\(\s*(?:[^()]|\([^()]*\))*?\s*\)\)/g

function scrubOoc() {
  const feed = document.getElementById('elPostFeed')
  if (!feed || typeof document.createTreeWalker !== 'function') return
  const walker = document.createTreeWalker(feed, NodeFilter.SHOW_TEXT, null)
  const hits = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    const value = node.nodeValue
    if (!value || value.indexOf('((') === -1) continue
    OOC_RE.lastIndex = 0
    if (!OOC_RE.test(value)) continue
    hits.push(node)
  }
  hits.forEach((node) => {
    const host = node.parentElement
    if (host && host.dataset && host.dataset.mdtOoc !== '1') {
      host.dataset.mdtOoc = '1'
      host.dataset.mdtOocRaw = host.innerHTML
    }
    OOC_RE.lastIndex = 0
    node.nodeValue = String(node.nodeValue)
      .replace(OOC_RE, '')
      .replace(/[ \t]{2,}/g, ' ')
  })
  document.querySelectorAll('[data-mdt-ooc="1"]').forEach((el) => {
    if (!el.style) return
    if (flatText(el)) {
      el.style.removeProperty('display')
      return
    }
    if (el.querySelector && el.querySelector('img, table, iframe, br + *')) return
    el.style.setProperty('display', 'none', 'important')
  })
}

function parseRgb(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str || '')
  if (!m) return null
  const parts = m[1].split(',').map((s) => parseFloat(s))
  if (parts.length < 3 || parts.some((v) => isNaN(v))) return null
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
}

function luminance(c) {
  return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255
}

function flatText(el) {
  return String((el && el.textContent) || '').replace(/\s+/g, ' ').trim()
}

const CELL_TAGS = { TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TD: 1, TH: 1 }

function paintText(p, mode) {
  const roots = []
  const feed = document.getElementById('elPostFeed')
  const header = document.querySelector('.ipsPageHeader')
  if (feed) roots.push(feed)
  if (header) roots.push(header)
  const dark = mode === 'aerodark' || mode === 'aerolapd'
  roots.forEach((root) => {
    const nodes = root.querySelectorAll('*')
    const limit = nodes.length > 8000 ? 8000 : nodes.length
    for (let i = 0; i < limit; i++) {
      const el = nodes[i]
      if (!el || !el.style || !el.dataset) continue
      if (el.dataset.mdtInk === '1') continue
      const tag = el.tagName
      if (tag === 'IMG' || tag === 'I' || tag === 'SVG' || tag === 'svg') continue
      el.dataset.mdtInk = '1'
      el.mdtPenalStyle = ['color','background-color','border-color'].map((prop) => [prop, el.style.getPropertyValue(prop), el.style.getPropertyPriority(prop)])
      const heading = el.closest('h1,h2,th')
      el.style.setProperty('color', tag === 'A' ? p.link : heading && p.headingInk ? p.headingInk : p.text, 'important')
      if (heading && p.headingInk) continue
      let bg = null
      try {
        bg = parseRgb(getComputedStyle(el).backgroundColor)
      } catch (_) {
        bg = null
      }
      if (!bg || bg.a < 0.08) continue
      const lum = luminance(bg)
      const clash = dark ? lum > 0.3 : lum < 0.7
      if (!clash) continue
      el.dataset.mdtBg = '1'
      el.style.setProperty('background-color', CELL_TAGS[tag] ? p.field : p.panel, 'important')
      el.style.setProperty('border-color', p.border, 'important')
    }
  })
}

function hideFooter() {
  const parts = [
    document.getElementById('ipsLayout_footer'),
    document.getElementById('elFooterLinks'),
    document.getElementById('elCopyright'),
    document.getElementById('elNavTheme'),
    document.getElementById('elNavTheme_menu')
  ]
  for (let i = 0; i < parts.length; i++) {
    const el = parts[i]
    if (!el || !el.style || !el.dataset) continue
    if (el.dataset.mdtGone === '1') continue
    el.dataset.mdtGone = '1'
    el.style.setProperty('display', 'none', 'important')
  }
}

function hideClosedNotice() {
  hideFooter()
  const nodes = document.querySelectorAll('div, p, section, li, span, h2, h3, strong')
  const limit = nodes.length > 5000 ? 5000 : nodes.length
  for (let i = 0; i < limit; i++) {
    const el = nodes[i]
    if (!el || !el.style || !el.dataset) continue
    if (el.dataset.mdtGone === '1') continue
    const t = flatText(el)
    if (!t || t.length > 200 || !isNoise(t)) continue
    if (el.querySelector && el.querySelector('div, p, section')) continue
    el.dataset.mdtGone = '1'
    el.style.setProperty('display', 'none', 'important')
  }
}

function restorePenal() {
  document.querySelectorAll('[data-mdt-penal-art], [data-mdt-penal-divider]').forEach((node) => { node.removeAttribute('data-mdt-penal-art'); node.removeAttribute('data-mdt-penal-divider') })
  document.querySelectorAll('[data-mdt-ooc="1"]').forEach((el) => {
    if (!el.dataset) return
    if (el.dataset.mdtOocRaw !== undefined) el.innerHTML = el.dataset.mdtOocRaw
    delete el.dataset.mdtOoc
    delete el.dataset.mdtOocRaw
    if (el.style) el.style.removeProperty('display')
  })
  document.querySelectorAll('[data-mdt-ink="1"]').forEach((el) => {
    if (!el.style || !el.dataset) return
    delete el.dataset.mdtInk
    if (el.mdtPenalStyle) {
      el.mdtPenalStyle.forEach(([prop,value,priority]) => { if (value) el.style.setProperty(prop,value,priority); else el.style.removeProperty(prop) })
      delete el.mdtPenalStyle
    } else el.style.removeProperty('color')
  })
  document.querySelectorAll('[data-mdt-gone="1"]').forEach((el) => {
    if (!el.style || !el.dataset) return
    delete el.dataset.mdtGone
    el.style.removeProperty('display')
  })
  document.querySelectorAll('[data-mdt-bg="1"]').forEach((el) => {
    if (!el.style || !el.dataset) return
    delete el.dataset.mdtBg
    if (el.mdtPenalStyle) el.mdtPenalStyle.filter(([prop]) => prop !== 'color').forEach(([prop,value,priority]) => { if (value) el.style.setProperty(prop,value,priority); else el.style.removeProperty(prop) })
  })
}
