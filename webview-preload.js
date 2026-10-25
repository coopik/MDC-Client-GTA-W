'use strict'

const { ipcRenderer, webFrame } = require('electron')
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

const STYLE_ID = 'mdt-classic-skin'
const skinCssCache = new Map()

function cachedSkinCss(key, build) {
  if (!skinCssCache.has(key)) skinCssCache.set(key,protectIconFonts(build()))
  return skinCssCache.get(key)
}

function protectIconFonts(css) {
  return css.replace(/([^{}]+)\{([^{}]*)\}/g,(rule,raw,body)=>{
    if(raw.trim().startsWith('@'))return rule
    const fonts=[]
    const rest=body.split(';').filter(declaration=>{
      if(/^\s*font(?:-family)?\s*:/i.test(declaration)&&!/Font Awesome|FontAwesome|Material Icons|Material Symbols|Glyphicons|bootstrap-icons|summernote/i.test(declaration)){fonts.push(declaration+';');return false}
      return true
    }).join(';')
    return fonts.length?raw+'{'+rest+'}\n'+cssSelectors(raw).map(selector=>guardSelector(selector,ICON_SEL)).join(',')+'{'+fonts.join('')+'}':rule
  })
}

const PAPER_SELECTOR = '[data-mdt-paper], [data-mdt-paper] *'
const WIDGET_SELECTOR = PAPER_SELECTOR + ', .bootstrap-select .dropdown-menu, .bootstrap-select .dropdown-menu *, #mugshotPreview, #mugshotPreview *, .cropper-container, .cropper-container *, [class^="cropper-"], [class*=" cropper-"], [class^="imgareaselect-"], .note-color .note-dropdown-menu, .note-color .note-dropdown-menu *, .note-color .dropdown-menu, .note-color .dropdown-menu *, .note-color-palette, .note-color-palette *'
const AUTHOR_COLOR_SELECTOR = '[data-mdt-author-color]:not([data-mdt-ink]), font[color], [data-mdt-author-color]:not([data-mdt-ink]) *, font[color] *, .note-editable *, [contenteditable="true"] *'
const AUTHOR_FONT_SELECTOR = 'font[face], font[face] *, [data-mdt-author-font], [data-mdt-author-font] *, .note-editable *, [contenteditable="true"] *'
const NATIVE_FORM_SELECTOR = '.modal[data-mdt-vanilla="1"] .modal-body, .modal[data-mdt-vanilla="1"] .modal-body *, html.mdt-form-page body .content, html.mdt-form-page body .content *'

function cssSelectors(value) {
  const selectors = []
  let start = 0
  let depth = 0
  let quote = ''
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (quote) {
      if (ch === quote && value[i - 1] !== '\\') quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (ch === ',' && depth === 0) { selectors.push(value.slice(start, i).trim()); start = i + 1 }
  }
  selectors.push(value.slice(start).trim())
  return selectors
}

function guardSelector(selector, excluded) {
  const guard = ':not(:where(' + excluded + '))'
  const index = selector.indexOf('::')
  return index < 0 ? selector + guard : selector.slice(0, index) + guard + selector.slice(index)
}

function protectContentCss(css) {
  const protectedCss = css.replace(/([^{}]+)\{([^{}]*)\}/g, (rule, raw, body) => {
    if (raw.trim().startsWith('@')) return rule
    const selectors = cssSelectors(raw).map((selector) => guardSelector(selector, WIDGET_SELECTOR))
    const colors = []
    const chromeColor = /data-notify|dataTables_length|_length|\.nav-tabs|\.nav-pills|\.note-toolbar|\.note-dropdown-menu|\.note-editor .*dropdown-menu|data-mdt-lookup|\.badge-light:has\(\[data-clipboard-target/.test(raw)
    const backgrounds = []
    const fonts = []
    const geometry = []
    const divider = cssSelectors(raw).every((selector) => /\bhr\s*$/.test(selector))
    const siteScrolls = /\.(?:modal(?:-body|-dialog|-content)?|dropdown-menu|bootstrap-select|note-editable|note-codable|note-editor|note-frame|note-editing-area)\b/.test(raw)
    const plain = body.split(';').filter((declaration) => {
      if (siteScrolls && /^\s*(?:max-height|overflow(?:-x|-y)?)\s*:/i.test(declaration)) return false
      if (/^\s*color\s*:/i.test(declaration)) { colors.push(declaration + ';'); return false }
      if (/^\s*background(?:-color|-image)?\s*:/i.test(declaration)) { backgrounds.push(declaration + ';'); return false }
      if (/^\s*font(?:-family)?\s*:/i.test(declaration)) { fonts.push(declaration + ';'); return false }
      if (/^\s*(?:display|position|inset(?:-\w+)?|top|right|bottom|left|float|clear|(?:min-|max-)?(?:width|height)|margin(?:-\w+)?|padding(?:-\w+)?|flex(?:-[\w-]+)?|grid(?:-[\w-]+)?|(?:row-|column-)?gap|align-\w+|justify-\w+|text-align|vertical-align|line-height|white-space|transform)\s*:/i.test(declaration)) { geometry.push(declaration + ';'); return false }
      return true
    }).join(';')
    return selectors.join(', ') + ' {' + plain + '}\n' +
      (fonts.length ? selectors.map((selector) => guardSelector(selector, AUTHOR_FONT_SELECTOR)).join(', ') + ' {' + fonts.join(' ') + '}\n' : '') +
      (geometry.length ? selectors.map((selector) => divider ? selector : guardSelector(selector, NATIVE_FORM_SELECTOR)).join(', ') + ' {' + geometry.join(' ') + '}\n' : '') +
      (backgrounds.length ? selectors.map((selector) => guardSelector(selector, '.note-editable *, [contenteditable="true"] *, .note-color-btn, .note-color-palette *, .note-current-color-button, .note-recent-color')).join(', ') + ' {' + backgrounds.join(' ') + '}\n' : '') +
      (colors.length ? selectors.map((selector) => chromeColor ? selector : guardSelector(selector, AUTHOR_COLOR_SELECTOR)).join(', ') + ' {' + colors.join(' ') + '}\n' : '')
  })
  return protectedCss
}

const ICON_SEL = [
  'i', 'svg', 'svg *', 'use', 'path',
  '.material-icons', '.material-icons-outlined', '.material-symbols-outlined',
  '.fa', '.fas', '.far', '.fal', '.fab', '.fad',
  '.fa-solid', '.fa-regular', '.fa-brands',
  '[class^="fa-"]', '[class*=" fa-"]',
  '.glyphicon', '[class^="glyphicon-"]',
  '.icon-bar', '.navbar-toggler-icon', '.card-icon', '.uploadIcon',
  '.bi', '[class^="bi-"]', '[class*=" bi-"]'
].join(', ')

const NOT_ICON = ':not(i):not(svg):not(use):not(path)' +
  ':not(.material-icons):not(.material-icons-outlined):not(.material-symbols-outlined)' +
  ':not(.fa):not(.fas):not(.far):not(.fal):not(.fab):not(.fad)' +
  ':not(.fa-solid):not(.fa-regular):not(.fa-brands)' +
  ':not([class^="fa-"]):not([class*=" fa-"])' +
  ':not(.glyphicon):not([class^="glyphicon-"])' +
  ':not(.icon-bar):not(.navbar-toggler-icon)' +
  ':not([class^="note-icon-"]):not([class*=" note-icon-"])' +
  ':not(.bi):not([class^="bi-"]):not([class*=" bi-"])'

const PANEL_SEL = [
  'html', 'body', '.wrapper', '.main-panel', '.content',
  '.card', '.card-dashboard', '.card-stats', '.card-header', '.card-footer',
  '.panel', '.box', '.well',
  '.modal-content', '.modal-header', '.modal-footer',
  '.swal2-popup', '.swal2-header', '.swal2-actions',
  '.dropdown-menu', '.list-group',
  '.toast', '.popover', '.tooltip-inner',
  '.navbar', '.navbar-absolute', '.navbar-wrapper',
  '.sidebar', '.sidebar-wrapper', '.sidebar-submenu'
].join(', ')

const FLAT_SEL = [
  'main', 'section', 'article', 'aside', 'header', 'footer', 'nav',
  '.container', '.container-fluid',
  '.row', '.col', '[class^="col-"]', '[class*=" col-"]',
  '.navbar-transparent', '.navbar-collapse', '.menu-collapsed',
  '.nav', '.nav-tabs', '.nav-pills', '.tab-content', '.tab-pane',
  '.card-body', '.panel-body', '.accordion',
  '.modal-dialog', '.modal-body', '.swal2-content',
  '.dropdown-item', '.list-group-item', '.toast-body',
  '.table', '.table-responsive', '.material-table', '.dataTables_wrapper',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'ul', 'ol', 'li', 'dl', 'form', '.form-group', '.input-group',
  '.breadcrumb', '.pagination', '.page-link'
].join(', ')

const PALETTES = {
  light: {
    panel: '#F0F0F0',
    panelAlt: '#ECE9D8',
    header: '#D4D0C8',
    border: '#A0A0A0',
    borderLite: '#C0C0C0',
    field: '#FFFFFF',
    fieldBorder: '#7F9DB9',
    text: '#000000',
    textMuted: '#505050',
    hover: '#DDECFB',
    sel: '#D6E5F5',
    selBorder: '#7F9DB9',
    zebra: '#F7F7F7',
    row: '#FFFFFF',
    link: '#0000CC',
    visited: '#551A8B',
    titlebar: '#0A246A',
    titlebarText: '#FFFFFF',
    btnFace: '#F0F0F0',
    btnHover: '#E4E4E4',
    btnActive: '#D8D8D8',
    scrollTrack: '#F0F0F0',
    scrollThumb: '#CDCDCD',
    scrollThumbHover: '#BDBDBD',
    chip: '#E4E4E4',
    chipBorder: '#808080',
    highlight: '#FFFFCC',
    danger: '#C00000',
    dangerText: '#FFFFFF',
    dangerSoft: '#FFE4E4',
    dangerInk: '#8B0000',
    warning: '#FFD700',
    warningText: '#000000',
    warningSoft: '#FFFFCC',
    warningInk: '#8A6D00',
    success: '#157A15',
    successText: '#FFFFFF',
    successSoft: '#E4F4E4',
    successInk: '#005000',
    info: '#CCE4FF',
    infoStrong: '#0A5A8A',
    primary: '#0A246A'
  },
  aero: {
    panel: '#F1F6FB',
    panelAlt: '#E6F0FA',
    header: '#D3E5F5',
    border: '#8CAFCF',
    borderLite: '#BBD3E8',
    field: '#FFFFFF',
    fieldBorder: '#7DA2C4',
    text: '#10222E',
    textMuted: '#44586B',
    hover: '#DCEBFB',
    sel: '#CBE3F8',
    selBorder: '#5A9BD5',
    zebra: '#F5F9FD',
    row: '#FFFFFF',
    link: '#0B4C8C',
    visited: '#5B3A97',
    titlebar: '#B8D6EE',
    titlebarText: '#0A2A44',
    btnFace: '#EAF3FB',
    btnHover: '#DAECFA',
    btnActive: '#C6E0F5',
    scrollTrack: '#EFF5FA',
    scrollThumb: '#B9D2E6',
    scrollThumbHover: '#9DBFDA',
    chip: '#E3EFFA',
    chipBorder: '#8CAFCF',
    highlight: '#FFF8C4',
    danger: '#C0392B',
    dangerText: '#FFFFFF',
    dangerSoft: '#FBE3E0',
    dangerInk: '#8C2318',
    warning: '#F0B400',
    warningText: '#000000',
    warningSoft: '#FFF6D8',
    warningInk: '#8A6A00',
    success: '#2E8B3D',
    successText: '#FFFFFF',
    successSoft: '#E3F5E6',
    successInk: '#1D6127',
    info: '#DCEBFB',
    infoStrong: '#1E6FA8',
    primary: '#2A6FA8'
  },
  aerodark: {
    panel: '#2B2B2B',
    panelAlt: '#323232',
    header: '#3C3C3C',
    border: '#565656',
    borderLite: '#454545',
    field: '#1E1E1E',
    fieldBorder: '#5A6E80',
    text: '#E4E4E4',
    textMuted: '#A8A8A8',
    hover: '#3A4B5C',
    sel: '#2A4056',
    selBorder: '#5A7EA8',
    zebra: '#262626',
    row: '#212121',
    link: '#7FB3FF',
    visited: '#C0A0E0',
    titlebar: '#14243F',
    titlebarText: '#FFFFFF',
    btnFace: '#3A3A3A',
    btnHover: '#464646',
    btnActive: '#505050',
    scrollTrack: '#2B2B2B',
    scrollThumb: '#565656',
    scrollThumbHover: '#666666',
    chip: '#3A3A3A',
    chipBorder: '#6A6A6A',
    highlight: '#4A4423',
    danger: '#B03030',
    dangerText: '#FFFFFF',
    dangerSoft: '#3E2020',
    dangerInk: '#FF9C9C',
    warning: '#C8A400',
    warningText: '#000000',
    warningSoft: '#3E3820',
    warningInk: '#E8CC60',
    success: '#2E7D32',
    successText: '#FFFFFF',
    successSoft: '#1E3320',
    successInk: '#8FD08F',
    info: '#24384A',
    infoStrong: '#1E6B94',
    primary: '#24406E'
  },
  aerolapd: {
    panel: '#0E2360',
    panelAlt: '#13307E',
    header: '#1B3F9E',
    border: '#5C86D6',
    borderLite: '#3A62B4',
    field: '#08174A',
    fieldBorder: '#7BA3E8',
    text: '#FFFFFF',
    textMuted: '#B9CBF2',
    hover: '#28579F',
    sel: '#1E56C8',
    selBorder: '#8FB6F5',
    zebra: '#122A6E',
    row: '#0E2360',
    link: '#9CC4FF',
    visited: '#C0B0F0',
    titlebar: '#0A1A4E',
    titlebarText: '#FFFFFF',
    btnFace: '#1B3F9E',
    btnHover: '#2A57C0',
    btnActive: '#0F2C78',
    scrollTrack: '#0B1C52',
    scrollThumb: '#33569E',
    scrollThumbHover: '#4870BC',
    chip: '#1B3F9E',
    chipBorder: '#5C86D6',
    highlight: '#C8A400',
    danger: '#D63A3A',
    dangerText: '#FFFFFF',
    dangerSoft: '#5A1B24',
    dangerInk: '#FF9C9C',
    warning: '#E0A100',
    warningText: '#000000',
    warningSoft: '#4A3A10',
    warningInk: '#FFD866',
    success: '#2E9E4A',
    successText: '#FFFFFF',
    successSoft: '#123E22',
    successInk: '#8FE0A0',
    info: '#153A86',
    infoStrong: '#2F7FD0',
    primary: '#1B3F9E'
  }
}


PALETTES.p1 = {
  panel: '#E6E6E6',
  panelAlt: '#F0F0F0',
  header: '#CFCFCF',
  border: '#6E6E6E',
  borderLite: '#BDBDBD',
  field: '#FFFFFF',
  fieldBorder: '#7A7A7A',
  text: '#111111',
  textMuted: '#555555',
  hover: '#E9E3CC',
  sel: '#DDD6B8',
  selBorder: '#8A8466',
  zebra: '#F1F1F1',
  row: '#FFFFFF',
  link: '#8B0000',
  visited: '#5A1A1A',
  titlebar: '#000000',
  titlebarText: '#FFFFFF',
  btnFace: '#E4E4E4',
  btnHover: '#D6D6D6',
  btnActive: '#C4C4C4',
  scrollTrack: '#E6E6E6',
  scrollThumb: '#A8A8A8',
  scrollThumbHover: '#8E8E8E',
  chip: '#E4E4E4',
  chipBorder: '#6E6E6E',
  highlight: '#FFF3B0',
  danger: '#B30000',
  dangerText: '#FFFFFF',
  dangerSoft: '#F7DADA',
  dangerInk: '#8B0000',
  warning: '#E0A100',
  warningText: '#000000',
  warningSoft: '#FFF3C4',
  warningInk: '#7A5A00',
  success: '#2E7D32',
  successText: '#FFFFFF',
  successSoft: '#E1F1E2',
  successInk: '#1B5E20',
  info: '#E4E8EE',
  infoStrong: '#1F4E79',
  primary: '#B30000'
}
PALETTES.p1dark = Object.assign({},PALETTES.p1,{
  panel:'#222529',panelAlt:'#2C3035',header:'#34383E',border:'#62666C',borderLite:'#42474E',
  field:'#1B1E22',fieldBorder:'#747A82',text:'#E8E7E1',textMuted:'#ADB1B7',hover:'#41464E',
  sel:'#514833',selBorder:'#B6A77D',zebra:'#292D32',row:'#24282D',link:'#E4CD8A',visited:'#C6B8DC',
  btnFace:'#383D44',btnHover:'#484F58',btnActive:'#2B3036',scrollTrack:'#25282D',scrollThumb:'#747A82',scrollThumbHover:'#969EA8',
  chip:'#343941',chipBorder:'#62666C',highlight:'#514833',danger:'#A52A2A',dangerSoft:'#472A2D',dangerInk:'#FFACAC',
  warning:'#D6A340',warningSoft:'#483E25',warningInk:'#F5D389',success:'#307348',successSoft:'#263E30',successInk:'#A5DBB4',
  info:'#344A60',infoStrong:'#426C95',primary:'#A52A2A'
})


const GLASS_STYLE_ID = 'mdt-glass-skin'

const GLASS = {
  aero: {
    hi: '#FBFDFF', mid: '#E4F0FA', lo: '#CFE4F6', ink: '#1B3A5C',
    border: '#9FBBD8', focus: '#3C7FB1', glow: 'rgba(60,127,177,0.60)',
    shade: 'rgba(22,58,96,0.24)', face: 'rgba(255,255,255,0.60)',
    pageHi: '#E9F1F8', pageLo: '#D4E3F1',
    panelHi: '#FFFFFF', panelLo: '#F3F7FB', panelBorder: '#B7CADE',
    hdrHi: '#FDFEFF', hdrMid: '#EEF6FD', hdrLo: '#DCEAF7', hdrInk: '#15385C',
    btnHi: '#FDFDFD', btnMid: '#F4F4F4', btnLo: '#E2E2E2',
    btnBorder: '#9A9A9A', btnInk: '#1A1A1A',
    hoverHi: '#F5FCFF', hoverMid: '#E4F5FD', hoverLo: '#C9E9F9',
    hoverBorder: '#3C7FB1',
    downHi: '#D3EDF9', downLo: '#EAF7FD',
    fieldBg: '#FFFFFF', fieldInk: '#111111', fieldBorder: '#9BA3AD',
    sel: '#CBE8F6', selBorder: '#26A0DA', rowAlt: '#F5F9FD',
    muted: '#5B7595', titleHi: '#FCFEFF', titleMid: '#E8F3FC', titleLo: '#CFE3F5',
    titleInk: '#0F3054', emboss: 'rgba(255,255,255,0.85)',
    menuBg: '#F2F2F2', menuBorder: '#A0A0A0',
    barHi: '#EFF6FC', barLo: '#DCE9F6',
    scrollTrack: '#F0F4F8', scrollThumbHi: '#F2F6FA', scrollThumbLo: '#CBD8E5',
    scrollBorder: '#9FB3C8', dark: 0
  },
  aerolapd: {
    hi: '#3A6FD0', mid: '#1F4AA6', lo: '#153A86', ink: '#FFFFFF',
    border: '#5C86D6', focus: '#8FB6F5', glow: 'rgba(130,180,255,0.55)',
    shade: 'rgba(4,16,44,0.45)', face: 'rgba(255,255,255,0.22)',
    pageHi: '#12306B', pageLo: '#0B2049',
    panelHi: '#24499A', panelLo: '#1B3B80', panelBorder: '#4E77CB',
    hdrHi: '#3E6FCB', hdrMid: '#28539F', hdrLo: '#1A3F86', hdrInk: '#FFFFFF',
    btnHi: '#4C79D0', btnMid: '#2F58AE', btnLo: '#1E3F8E',
    btnBorder: '#7FA6EE', btnInk: '#FFFFFF',
    hoverHi: '#5F8DE0', hoverMid: '#3A66C2', hoverLo: '#27509F',
    hoverBorder: '#9CC0FF',
    downHi: '#1B3F8C', downLo: '#2C57AE',
    fieldBg: '#FFFFFF', fieldInk: '#0E1F45', fieldBorder: '#6E8CC8',
    sel: '#2F5CBF', selBorder: '#7FA6EE', rowAlt: '#1F4189',
    muted: '#C2D3F5', titleHi: '#4676D2', titleMid: '#28539F', titleLo: '#17398A',
    titleInk: '#FFFFFF', emboss: 'rgba(255,255,255,0.35)',
    menuBg: '#1B3B80', menuBorder: '#4E77CB',
    barHi: '#2E5AB4', barLo: '#1B3F8C',
    scrollTrack: '#E7EEFA', scrollThumbHi: '#F3F7FE', scrollThumbLo: '#C3D4EF',
    scrollBorder: '#5C86D6', dark: 0
  },
  aerodark: {
    hi: '#4E4E4E', mid: '#363636', lo: '#282828', ink: '#F2F2F2',
    border: '#5F5F5F', focus: '#7FB3FF', glow: 'rgba(127,179,255,0.45)',
    shade: 'rgba(0,0,0,0.55)', face: 'rgba(255,255,255,0.14)',
    pageHi: '#2B2B2B', pageLo: '#1E1E1E',
    panelHi: '#3A3A3A', panelLo: '#2F2F2F', panelBorder: '#565656',
    hdrHi: '#4C4C4C', hdrMid: '#3C3C3C', hdrLo: '#2E2E2E', hdrInk: '#F0F0F0',
    btnHi: '#4A4A4A', btnMid: '#3E3E3E', btnLo: '#333333',
    btnBorder: '#6A6A6A', btnInk: '#F0F0F0',
    hoverHi: '#54626F', hoverMid: '#44525F', hoverLo: '#36424E',
    hoverBorder: '#7FB3FF',
    downHi: '#2C3A44', downLo: '#3A4654',
    fieldBg: '#252525', fieldInk: '#F2F2F2', fieldBorder: '#616161',
    sel: '#2F4A6B', selBorder: '#4F86C6', rowAlt: '#333333',
    muted: '#B4B4B4', titleHi: '#4E4E4E', titleMid: '#3A3A3A', titleLo: '#2A2A2A',
    titleInk: '#F5F5F5', emboss: 'rgba(255,255,255,0.10)',
    menuBg: '#333333', menuBorder: '#5F5F5F',
    barHi: '#3E3E3E', barLo: '#2C2C2C',
    scrollTrack: '#2A2A2A', scrollThumbHi: '#4E4E4E', scrollThumbLo: '#3A3A3A',
    scrollBorder: '#5F5F5F', dark: 1
  }
}

function buildGlassCss(g) {
  const emb = g.dark ? 'none' : `0 1px 0 ${g.emboss}`
  const gloss = g.dark
    ? 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.07) 49%, rgba(0,0,0,0.20) 50%, rgba(255,255,255,0.05) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.42) 49%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.34) 100%)'
  return protectContentCss(`
html.mdt-aero body {
  background-image: linear-gradient(180deg, ${g.pageHi} 0%, ${g.pageLo} 100%) !important;
  background-attachment: fixed !important;
  background-color: ${g.pageLo} !important;
  color: ${g.ink} !important;
  font-family: "Segoe UI", Tahoma, Geneva, sans-serif !important;
}

html.mdt-aero body .card, html.mdt-aero body .panel, html.mdt-aero body .card-profile,
html.mdt-aero body .card-profile-avatar, html.mdt-aero body .card-profile-elements,
html.mdt-aero body .card-stats {
  background-image: linear-gradient(180deg, ${g.panelHi} 0%, ${g.panelLo} 100%) !important;
  background-color: ${g.panelHi} !important;
  border: 1px solid ${g.panelBorder} !important;
  border-radius: 4px !important;
  box-shadow: 0 1px 3px ${g.shade}, inset 0 1px 0 ${g.emboss} !important;
  background-clip: padding-box !important;
}

html.mdt-aero body .card > .card-header, html.mdt-aero body .panel > .panel-heading,
html.mdt-aero body .card-header, html.mdt-aero body .card-header-index,
html.mdt-aero body .card-header-dark, html.mdt-aero body .panel-heading {
  background-image: linear-gradient(180deg, ${g.hdrHi} 0%, ${g.hdrMid} 52%, ${g.hdrLo} 100%) !important;
  background-color: ${g.hdrMid} !important;
  color: ${g.hdrInk} !important;
  border-bottom: 1px solid ${g.panelBorder} !important;
  box-shadow: inset 0 1px 0 ${g.emboss} !important;
  text-shadow: ${emb} !important;
  border-radius: 3px 3px 0 0 !important;
}

html.mdt-aero body .card > .card-body, html.mdt-aero body .panel > .panel-body,
html.mdt-aero body .card-profile .card-body, html.mdt-aero body .card-profile-avatar .card-body,
html.mdt-aero body .card-profile-elements .card-body {
  background: transparent !important;
  background-image: none !important;
  color: ${g.ink} !important;
}

html.mdt-aero body .card-profile, html.mdt-aero body .card-profile-avatar {
  box-shadow: 0 2px 6px ${g.shade}, inset 0 1px 0 ${g.emboss} !important;
}
html.mdt-aero body .card-profile .characterDetailsName,
html.mdt-aero body .card-profile #characterName {
  color: ${g.ink} !important;
  text-shadow: ${emb} !important;
}
html.mdt-aero body .card-profile .characterDetailsTitle {
  color: ${g.muted} !important;
}
html.mdt-aero body .card-profile .characterDetailsValue {
  color: ${g.ink} !important;
}
html.mdt-aero body .card-profile-avatar .card-img,
html.mdt-aero body .card-profile-avatar #charPicture {
  background: ${g.panelLo} !important;
  border-radius: 3px !important;
  overflow: hidden !important;
}

html.mdt-aero body .btn:not(.btn-primary):not(.btn-success):not(.btn-danger):not(.btn-warning):not(.btn-info):not(.btn-dark):not(.btn-collapse):not(.btn-actions), html.mdt-aero body button.btn:not(.btn-primary):not(.btn-success):not(.btn-danger):not(.btn-warning):not(.btn-info):not(.btn-dark):not(.btn-collapse):not(.btn-actions), html.mdt-aero body .note-btn {
  background-image: linear-gradient(180deg, ${g.btnHi} 0%, ${g.btnMid} 48%, ${g.btnLo} 100%) !important;
  background-color: ${g.btnMid} !important;
  border: 1px solid ${g.btnBorder} !important;
  border-radius: 3px !important;
  color: ${g.btnInk} !important;
  box-shadow: inset 0 1px 0 ${g.emboss} !important;
  text-shadow: ${emb} !important;
  background-clip: padding-box !important;
}
html.mdt-aero body .btn:not(.btn-primary):not(.btn-success):not(.btn-danger):not(.btn-warning):not(.btn-info):not(.btn-dark):not(.btn-collapse):not(.btn-actions):hover, html.mdt-aero body button.btn:not(.btn-primary):not(.btn-success):not(.btn-danger):not(.btn-warning):not(.btn-info):not(.btn-dark):not(.btn-collapse):not(.btn-actions):hover, html.mdt-aero body .note-btn:hover {
  background-image: linear-gradient(180deg, ${g.hoverHi} 0%, ${g.hoverMid} 48%, ${g.hoverLo} 100%) !important;
  border-color: ${g.hoverBorder} !important;
  box-shadow: inset 0 1px 0 ${g.emboss}, 0 0 4px ${g.glow} !important;
}
html.mdt-aero body .btn:not(.btn-primary):not(.btn-success):not(.btn-danger):not(.btn-warning):not(.btn-info):not(.btn-dark):not(.btn-collapse):not(.btn-actions):active, html.mdt-aero body .btn:not(.btn-primary):not(.btn-success):not(.btn-danger):not(.btn-warning):not(.btn-info):not(.btn-dark):not(.btn-collapse):not(.btn-actions).active, html.mdt-aero body button.btn:active {
  background-image: linear-gradient(180deg, ${g.downHi} 0%, ${g.downLo} 100%) !important;
  border-color: ${g.hoverBorder} !important;
  box-shadow: inset 0 2px 3px rgba(0,0,0,0.18) !important;
}
html.mdt-aero body .btn:not(.btn-primary):not(.btn-success):not(.btn-danger):not(.btn-warning):not(.btn-info):not(.btn-dark):not(.btn-collapse):not(.btn-actions):focus, html.mdt-aero body button.btn:not(.btn-primary):not(.btn-success):not(.btn-danger):not(.btn-warning):not(.btn-info):not(.btn-dark):not(.btn-collapse):not(.btn-actions):focus {
  outline: none !important;
  box-shadow: inset 0 1px 0 ${g.emboss}, 0 0 5px ${g.glow} !important;
}

html.mdt-aero body .btn-primary, html.mdt-aero body .btn-success, html.mdt-aero body .btn-danger,
html.mdt-aero body .btn-warning, html.mdt-aero body .btn-info, html.mdt-aero body .btn-secondary,
html.mdt-aero body .badge-primary, html.mdt-aero body .badge-success, html.mdt-aero body .badge-danger,
html.mdt-aero body .badge-warning, html.mdt-aero body .badge-info, html.mdt-aero body .badge-dark,
html.mdt-aero body .badge-secondary {
  background-image: ${gloss} !important;
  border-radius: 3px !important;
  text-shadow: 0 1px 1px rgba(0,0,0,0.28) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.35) !important;
}

html.mdt-aero body input.form-control, html.mdt-aero body select.form-control,
html.mdt-aero body textarea.form-control, html.mdt-aero body input[type="text"],
html.mdt-aero body input[type="search"], html.mdt-aero body input[type="number"],
html.mdt-aero body input[type="password"], html.mdt-aero body select, html.mdt-aero body textarea {
  background-image: none !important;
  background-color: ${g.fieldBg} !important;
  color: ${g.fieldInk} !important;
  border: 1px solid ${g.fieldBorder} !important;
  border-radius: 2px !important;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.14) !important;
}
html.mdt-aero body input.form-control:focus, html.mdt-aero body select.form-control:focus,
html.mdt-aero body textarea.form-control:focus, html.mdt-aero body input[type="text"]:focus,
html.mdt-aero body select:focus, html.mdt-aero body textarea:focus {
  border-color: ${g.focus} !important;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.10), 0 0 5px ${g.glow} !important;
  outline: none !important;
}

html.mdt-aero body .table thead th, html.mdt-aero body table thead th {
  background-image: linear-gradient(180deg, ${g.hdrHi} 0%, ${g.hdrMid} 55%, ${g.hdrLo} 100%) !important;
  color: ${g.hdrInk} !important;
  border-bottom: 1px solid ${g.panelBorder} !important;
  text-shadow: ${emb} !important;
}
html.mdt-aero body .table tbody tr:nth-child(even) > td {
  background-color: ${g.rowAlt} !important;
}
html.mdt-aero body .table tbody tr:hover > td {
  background-color: ${g.sel} !important;
}
html.mdt-aero body .table td, html.mdt-aero body .table th {
  border-color: ${g.panelBorder} !important;
  color: ${g.ink} !important;
}

html.mdt-aero body .modal-content, html.mdt-aero body .swal2-popup {
  background-image: linear-gradient(180deg, ${g.hi} 0%, ${g.mid} 46%, ${g.lo} 100%) !important;
  background-color: ${g.mid} !important;
  border: 1px solid ${g.border} !important;
  border-radius: 6px 6px 4px 4px !important;
  box-shadow: 0 14px 38px ${g.shade}, inset 0 0 0 1px ${g.face} !important;
  color: ${g.ink} !important;
  background-clip: padding-box !important;
}
html.mdt-aero body .modal-header, html.mdt-aero body .swal2-header {
  background-image: linear-gradient(180deg, ${g.titleHi} 0%, ${g.titleMid} 52%, ${g.titleLo} 100%) !important;
  color: ${g.titleInk} !important;
  border-bottom: 1px solid ${g.border} !important;
  border-radius: 5px 5px 0 0 !important;
  box-shadow: inset 0 1px 0 ${g.emboss} !important;
  text-shadow: ${emb} !important;
}
html.mdt-aero body .modal-title, html.mdt-aero body .modal-header h3, html.mdt-aero body .modal-header h4 {
  color: ${g.titleInk} !important;
  text-shadow: ${emb} !important;
}
html.mdt-aero body .modal-body, html.mdt-aero body .swal2-content {
  background: transparent !important;
  color: ${g.ink} !important;
}
html.mdt-aero body .modal-footer {
  background-image: linear-gradient(180deg, ${g.barHi} 0%, ${g.barLo} 100%) !important;
  border-top: 1px solid ${g.border} !important;
  border-radius: 0 0 3px 3px !important;
}

html.mdt-aero body .dropdown-menu {
  background-image: none !important;
  background-color: ${g.menuBg} !important;
  border: 1px solid ${g.menuBorder} !important;
  border-radius: 3px !important;
  box-shadow: 0 6px 16px ${g.shade} !important;
  color: ${g.ink} !important;
}
html.mdt-aero body .dropdown-item {
  color: ${g.ink} !important;
  border-radius: 2px !important;
}
html.mdt-aero body .dropdown-item:hover, html.mdt-aero body .dropdown-item:focus {
  background-image: linear-gradient(180deg, ${g.hoverHi} 0%, ${g.hoverLo} 100%) !important;
  border: 1px solid ${g.hoverBorder} !important;
  color: ${g.ink} !important;
}

html.mdt-aero body .nav-tabs .nav-link.active, html.mdt-aero body .nav-pills .nav-link.active {
  background-image: linear-gradient(180deg, ${g.hdrHi} 0%, ${g.hdrLo} 100%) !important;
  border: 1px solid ${g.panelBorder} !important;
  border-bottom-color: transparent !important;
  border-radius: 3px 3px 0 0 !important;
  color: ${g.hdrInk} !important;
}

html.mdt-aero body .progress {
  background-color: ${g.panelLo} !important;
  border: 1px solid ${g.panelBorder} !important;
  border-radius: 3px !important;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.18) !important;
}
html.mdt-aero body .progress-bar {
  background-image: linear-gradient(180deg, #A6E96A 0%, #6BC72E 48%, #4FA81C 100%) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.45) !important;
}

html.mdt-aero body .alert {
  background-image: linear-gradient(180deg, ${g.panelHi} 0%, ${g.panelLo} 100%) !important;
  border: 1px solid ${g.panelBorder} !important;
  border-radius: 3px !important;
  color: ${g.ink} !important;
  box-shadow: inset 0 1px 0 ${g.emboss} !important;
}

html.mdt-aero body ::-webkit-scrollbar {
  width: 17px !important;
  height: 17px !important;
}
html.mdt-aero body ::-webkit-scrollbar-track {
  background: ${g.scrollTrack} !important;
  border-left: 1px solid ${g.scrollBorder} !important;
}
html.mdt-aero body ::-webkit-scrollbar-thumb {
  background-image: linear-gradient(90deg, ${g.scrollThumbHi} 0%, ${g.scrollThumbLo} 100%) !important;
  border: 1px solid ${g.scrollBorder} !important;
  border-radius: 2px !important;
}
html.mdt-aero body ::-webkit-scrollbar-thumb:hover {
  background-image: linear-gradient(90deg, ${g.hoverHi} 0%, ${g.hoverLo} 100%) !important;
}

html.mdt-aero body hr {
  border-top: 1px solid ${g.panelBorder} !important;
  opacity: 0.6 !important;
}
html.mdt-aero body a {
  color: ${g.dark ? '#8FC0F5' : '#14508C'} !important;
}

html.mdt-aero body .btn-primary, html.mdt-aero body .btn-success,
html.mdt-aero body .btn-danger, html.mdt-aero body .btn-warning,
html.mdt-aero body .btn-info, html.mdt-aero body .btn-dark,
html.mdt-aero body .btn-actions {
  color: #FFFFFF !important;
  border: 1px solid rgba(0, 0, 0, 0.30) !important;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.38) !important;
}
html.mdt-aero body .btn-warning, html.mdt-aero body .btn-warning:hover {
  color: #2B2000 !important;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.45) !important;
}

html.mdt-aero body .btn-collapse {
  background-image: linear-gradient(180deg, ${g.btnHi} 0%, ${g.btnMid} 48%, ${g.btnLo} 100%) !important;
  background-color: ${g.btnMid} !important;
  border: 1px solid ${g.btnBorder} !important;
  border-radius: 2px !important;
  color: ${g.btnInk} !important;
  box-shadow: inset 0 1px 0 ${g.emboss} !important;
}
html.mdt-aero body .btn-collapse:hover {
  background-image: linear-gradient(180deg, ${g.hoverHi} 0%, ${g.hoverLo} 100%) !important;
  border-color: ${g.hoverBorder} !important;
}
html.mdt-aero body .btn-collapse i, html.mdt-aero body .btn-collapse .fas {
  color: ${g.btnInk} !important;
  font-size: 10px !important;
  line-height: 16px !important;
  vertical-align: middle !important;
}

html.mdt-aero body .card > .card-body:last-child,
html.mdt-aero body .panel > .panel-body:last-child {
  border-radius: 0 0 3px 3px !important;
}
html.mdt-aero body .card > .card-body, html.mdt-aero body .card-body > span,
html.mdt-aero body .card-body > div:not(.card):not(.panel) {
  background-color: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
html.mdt-aero body .card-body > *, html.mdt-aero body .card-body > span > *,
html.mdt-aero body .card-body .row {
  max-width: 100% !important;
  box-sizing: border-box !important;
}
html.mdt-aero body .card-body .table-responsive, html.mdt-aero body .card-body .table {
  border-radius: 0 0 3px 3px !important;
  overflow: visible !important;
}

html.mdt-aero body .card-profile > .card-body {
  padding: 10px 12px !important;
}
html.mdt-aero body .card-profile > .card-body > .row {
  background: transparent !important;
  background-image: none !important;
  border: 0 !important;
  box-shadow: none !important;
  margin: 0 !important;
  padding: 6px 4px !important;
}
html.mdt-aero body .card-profile-avatar {
  padding: 4px !important;
  background-image: linear-gradient(180deg, ${g.panelHi} 0%, ${g.panelLo} 100%) !important;
}
html.mdt-aero body .card-profile-avatar .card-img,
html.mdt-aero body .card-profile-avatar #charPicture {
  border: 1px solid ${g.panelBorder} !important;
  border-radius: 3px !important;
  background: ${g.panelLo} !important;
}

html.mdt-aero body .modal-body .card, html.mdt-aero body .modal-body .panel {
  box-shadow: none !important;
}
html.mdt-aero body .note-editor, html.mdt-aero body .note-frame,
html.mdt-aero body .note-editable, html.mdt-aero body .note-editing-area {
  background-color: ${g.fieldBg} !important;
  background-image: none !important;
  color: ${g.fieldInk} !important;
  border-color: ${g.fieldBorder} !important;
}
html.mdt-aero body .modal .note-editor,
html.mdt-aero body .modal .note-frame,
html.mdt-aero body .modal .note-editing-area,
html.mdt-aero body .modal .note-editable,
html.mdt-aero body .modal .note-codable,
html.mdt-aero body .modal .note-statusbar,
html.mdt-aero body .modal .note-editable p,
html.mdt-aero body .modal .note-editable div,
html.mdt-aero body .modal .note-editable span {
  background: ${g.fieldBg} !important;
  background-color: ${g.fieldBg} !important;
  background-image: none !important;
  color: ${g.fieldInk} !important;
}
html.mdt-aero body .modal .note-editable * {
  background-color: transparent !important;
  color: ${g.fieldInk} !important;
}
html.mdt-aero body .modal .note-placeholder {
  background: transparent !important;
  color: ${g.fieldInk} !important;
  opacity: 0.65 !important;
}
html.mdt-aero body .modal .chargeWrapper {
  background: ${g.fieldBg} !important;
  background-image: none !important;
  border: 1px solid ${g.fieldBorder} !important;
}
html.mdt-aero body .modal .chargeWrapper .bootstrap-select > .dropdown-toggle,
html.mdt-aero body .modal .chargeWrapper .form-control {
  background: ${g.fieldBg} !important;
  background-image: none !important;
  color: ${g.fieldInk} !important;
  border: 1px solid ${g.fieldBorder} !important;
}
html.mdt-aero body .note-toolbar, html.mdt-aero body .note-toolbar.card-header {
  background-image: linear-gradient(180deg, ${g.hdrHi} 0%, ${g.hdrLo} 100%) !important;
  border-bottom: 1px solid ${g.panelBorder} !important;
}
html.mdt-aero body .modal-body label, html.mdt-aero body .modal-body .col-form-label,
html.mdt-aero body .modal-body h5, html.mdt-aero body .modal-body h6 {
  color: ${g.ink} !important;
  text-shadow: ${emb} !important;
}
html.mdt-aero body .swal2-title, html.mdt-aero body .swal2-html-container {
  color: ${g.ink} !important;
}
html.mdt-aero body .modal-header .close, html.mdt-aero body .modal-content .close,
html.mdt-aero body .swal2-close {
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
  left: auto !important;
  bottom: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  width: 45px !important;
  height: auto !important;
  min-width: 0 !important;
  min-height: 21px !important;
  border: 1px solid #8C2318 !important;
  border-top: 0 !important;
  border-right: 0 !important;
  border-radius: 0 5px 0 4px !important;
  background-image: linear-gradient(180deg, #F0776B 0%, #D2402F 48%, #A9261A 100%) !important;
  background-color: #C0392B !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45) !important;
  color: #FFFFFF !important;
  opacity: 1 !important;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.45) !important;
  font-size: 13px !important;
  line-height: 19px !important;
  text-align: center !important;
  overflow: hidden !important;
  z-index: 6 !important;
}
html.mdt-aero body .modal-header .close:hover,
html.mdt-aero body .modal-content .close:hover,
html.mdt-aero body .swal2-close:hover {
  background-image: linear-gradient(180deg, #F79A90 0%, #DE5342 48%, #B92C1E 100%) !important;
}
html.mdt-aero body .modal-header .close i,
html.mdt-aero body .modal-content .close i,
html.mdt-aero body .modal-header .close span,
html.mdt-aero body .modal-content .close span {
  color: #FFFFFF !important;
  font-size: 12px !important;
  line-height: 19px !important;
  vertical-align: middle !important;
}
html.mdt-aero body .modal-header {
  position: relative !important;
  padding-right: 56px !important;
  padding-left: 56px !important;
}

html.mdt-aero body .card-body .row {
  margin-left: 0 !important;
  margin-right: 0 !important;
}
html.mdt-aero body .card-body .row > [class^="col-"],
html.mdt-aero body .card-body .row > [class*=" col-"],
html.mdt-aero body .card-body .row > .col {
  padding-left: 6px !important;
  padding-right: 6px !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  overflow-wrap: break-word !important;
}
html.mdt-aero body .card-body .style-list-no-style {
  margin: 0 !important;
  padding-left: 0 !important;
  list-style: none !important;
}
html.mdt-aero body .colourPreview {
  display: inline-block !important;
  width: 13px !important;
  height: 13px !important;
  border: 1px solid ${g.panelBorder} !important;
  border-radius: 2px !important;
  vertical-align: middle !important;
  margin-right: 4px !important;
  flex: none !important;
}
html.mdt-aero body .btn-actions-xs {
  padding: 1px 6px !important;
  line-height: 16px !important;
  font-size: 11px !important;
}

html.mdt-aero body .card.card-profile,
html.mdt-aero body .card.card-profile-avatar {
  background-image: linear-gradient(180deg, ${g.panelHi} 0%, ${g.panelLo} 100%) !important;
  background-color: ${g.panelHi} !important;
  border: 1px solid ${g.panelBorder} !important;
  border-radius: 4px !important;
  box-shadow: inset 0 1px 0 ${g.emboss}, 0 1px 2px ${g.shade} !important;
  background-clip: padding-box !important;
}
html.mdt-aero body .card.card-profile > .card-body,
html.mdt-aero body .card.card-profile > .card-body > .row,
html.mdt-aero body .card.card-profile .col-xl-6,
html.mdt-aero body .card.card-profile .characterDetailsName,
html.mdt-aero body .card.card-profile h3,
html.mdt-aero body .card.card-profile h5 {
  background: transparent !important;
  background-image: none !important;
  background-color: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}
html.mdt-aero body .card.card-profile .characterDetailsName,
html.mdt-aero body .card.card-profile .characterDetailsTitle,
html.mdt-aero body .card.card-profile .characterDetailsValue,
html.mdt-aero body .card.card-profile h3, html.mdt-aero body .card.card-profile h5 {
  color: ${g.ink} !important;
  text-shadow: ${emb} !important;
}

html.mdt-aero body .dropdown-menu {
  background-color: ${g.menuBg} !important;
  background-image: none !important;
  border: 1px solid ${g.menuBorder} !important;
  border-radius: 3px !important;
  box-shadow: 0 3px 8px ${g.shade} !important;
}
html.mdt-aero body .dropdown-menu .dropdown-item,
html.mdt-aero body .dropdown-menu a, html.mdt-aero body .dropdown-menu span,
html.mdt-aero body .dropdown-header, html.mdt-aero body .dropdown-menu li > a {
  color: ${g.ink} !important;
  background-color: transparent !important;
}
html.mdt-aero body .dropdown-menu .dropdown-item:hover,
html.mdt-aero body .dropdown-menu .dropdown-item:focus,
html.mdt-aero body .dropdown-menu li > a:hover {
  background-image: linear-gradient(180deg, ${g.hoverHi} 0%, ${g.hoverLo} 100%) !important;
  background-color: ${g.hoverMid} !important;
  color: ${g.hdrInk} !important;
}
html.mdt-aero body .dropdown-menu .dropdown-item.disabled,
html.mdt-aero body .dropdown-menu .dropdown-item:disabled {
  color: ${g.muted} !important;
  background-image: none !important;
}
html.mdt-aero body .dropdown-divider {
  border-top: 1px solid ${g.menuBorder} !important;
}

html.mdt-aero body img, html.mdt-aero body .personPhotograph,
html.mdt-aero body .warrantSealLogoLeft, html.mdt-aero body .warrantSealLogoRight,
html.mdt-aero body .characterFactionLogo, html.mdt-aero body .characterFactionLogo img {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}

html.mdt-aero body td .badge, html.mdt-aero body .badge {
  display: inline-block !important;
  max-width: 100% !important;
  white-space: normal !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;
  line-height: 1.35 !important;
  vertical-align: baseline !important;
  box-sizing: border-box !important;
}
html.mdt-aero body td .badge, html.mdt-aero body li .badge {
  text-align: left !important;
}
html.mdt-aero body td > ul, html.mdt-aero body td > ul > li {
  max-width: 100% !important;
  overflow: visible !important;
  white-space: normal !important;
  box-sizing: border-box !important;
}
html.mdt-aero body td > ul {
  margin: 0 !important;
  padding-left: 16px !important;
}
html.mdt-aero body .table td, html.mdt-aero body .table th {
  white-space: normal !important;
  overflow-wrap: break-word !important;
}


html.mdt-aero body .main-panel > .content { padding: 16px 18px !important; }
html.mdt-aero body .card > .card-header:not(.modal *), html.mdt-aero body .panel > .panel-heading:not(.modal *) {
  margin: 0 !important;
  padding: 6px 30px !important;
  min-height: 28px !important;
  line-height: 16px !important;
  background-image: linear-gradient(180deg, ${g.hdrHi}, ${g.hdrMid} 49%, ${g.hdrLo} 50%, ${g.hdrMid}) !important;
}
html.mdt-aero body .card > .card-header .card-title:not(.modal *), html.mdt-aero body .panel > .panel-heading .panel-title:not(.modal *) { color: ${g.hdrInk} !important; font-size: 11px !important; margin: 0 !important; }
html.mdt-aero body .card > .card-body:not(.modal *), html.mdt-aero body .panel > .panel-body:not(.modal *) { padding: 10px !important; }
html.mdt-aero body .table thead th:not(.modal *) { padding: 6px 8px !important; color: ${g.hdrInk} !important; }
html.mdt-aero body .table td:not(.modal *) { padding: 5px 8px !important; line-height: 16px !important; }
html.mdt-aero body .btn:focus-visible, html.mdt-aero body a:focus-visible { outline: 2px solid ${g.focus} !important; outline-offset: 2px !important; }
html.mdt-aero body .btn:disabled, html.mdt-aero body .btn.disabled { opacity: .5 !important; }

html.mdt-aero body .navbar .navbar-brand, html.mdt-aero body .navbar .navbar-brand *, html.mdt-aero body .navbar .navbar-wrapper { background: transparent !important; border-color: transparent !important; box-shadow: none !important; }
`)
}
function applyGlass() {
  const g = GLASS[themeNow()]
  const host = document.head || document.documentElement
  const root = document.documentElement
  let node = document.getElementById(GLASS_STYLE_ID)
  if (!g) {
    if (root && root.classList) root.classList.remove('mdt-aero')
    if (node && node.parentNode) node.parentNode.removeChild(node)
    return
  }
  if (root && root.classList) root.classList.add('mdt-aero')
  if (!node) {
    node = document.createElement('style')
    node.id = GLASS_STYLE_ID
    node.setAttribute('type', 'text/css')
  }
  const css = cachedSkinCss('glass:' + themeNow(), () => buildGlassCss(g))
  if (node.textContent !== css) node.textContent = css
  if (host && node.parentNode !== host) host.appendChild(node)
  else if (host && host.lastChild !== node) host.appendChild(node)
}


const P1_STYLE_ID = 'mdt-p1-skin'

function buildP1Css() {
  const lookup = ':is(input#character, input#plate, input)[data-mdt-lookup-field="1"]'
  const lookupAction = 'html.mdt-p1 body [data-mdt-lookup-action="1"]'
  return protectContentCss(`
html.mdt-p1 body, html.mdt-p1 .wrapper, html.mdt-p1 .main-panel, html.mdt-p1 .main-panel > .content {
  background-color: #DCDAD5 !important;
  background-image: none !important;
}
html.mdt-p1 body, html.mdt-p1 body *:where(${NOT_ICON}) {
  font-family: Tahoma, "Microsoft Sans Serif", sans-serif !important;
}
html.mdt-p1 body .card, html.mdt-p1 body .card-dashboard, html.mdt-p1 body .card-stats, html.mdt-p1 body .panel {
  border: 1px solid #5E5E5E !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background-color: #F1F0EC !important;
  background-image: none !important;
}
html.mdt-p1 body .card-header, html.mdt-p1 body .card-header-dark, html.mdt-p1 body .card-header-icon,
html.mdt-p1 body .panel-heading, html.mdt-p1 body .card-footer {
  background-color: #000000 !important;
  background-image: linear-gradient(#2A2A2A, #000000) !important;
  color: #FFFFFF !important;
  border: 0 !important;
  border-bottom: 1px solid #000000 !important;
  border-radius: 0 !important;
  font-size: 10px !important;
  font-weight: bold !important;
  letter-spacing: 0.4px !important;
  text-transform: uppercase !important;
  padding: 3px 8px !important;
}
html.mdt-p1 body .card-header *:not(.btn):not(button):not(input):not(select):not(:where(.btn *)), html.mdt-p1 body .panel-heading *:not(.btn):not(button):not(:where(.btn *)) {
  color: #FFFFFF !important;
}
html.mdt-p1 body .card-header a:not(.btn), html.mdt-p1 body .card-header a:not(.btn):hover { color: #FFFFFF !important; text-decoration: underline !important; }
html.mdt-p1 body .card-body, html.mdt-p1 body .panel-body {
  background-color: #F1F0EC !important;
  color: #111111 !important;
}
html.mdt-p1 body thead th, html.mdt-p1 body table > tbody > tr:first-child > th:first-child:last-child, html.mdt-p1 body th {
  background-color: #000000 !important;
  background-image: linear-gradient(#262626, #000000) !important;
  color: #FFFFFF !important;
  border: 0 !important;
  border-right: 1px solid #3A3A3A !important;
  font-size: 10px !important;
  font-weight: bold !important;
  letter-spacing: 0.2px !important;
  padding: 3px 6px !important;
}
html.mdt-p1 body th a, html.mdt-p1 body th * { color: #FFFFFF !important; }
html.mdt-p1 body td {
  font-size: 11px !important;
  padding: 2px 6px !important;
  border-color: #CFCFCF !important;
}
html.mdt-p1 body tbody tr > td { background-color: #FFFFFF !important; }
html.mdt-p1 body tbody tr:nth-child(even) > td { background-color: #F0F0F0 !important; }
html.mdt-p1 body tbody tr:hover > td { background-color: #E9E3CC !important; }
html.mdt-p1 body .table td a, html.mdt-p1 body td a { color: #8B0000 !important; font-weight: bold !important; text-decoration: none !important; }
html.mdt-p1 body td a:hover { text-decoration: underline !important; }
html.mdt-p1 body .btn:not(.btn-primary):not(.btn-danger):not(.btn-success):not(.btn-warning):not(.btn-info):not(.btn-collapse):not(.btn-actions):not(.close),
html.mdt-p1 body button.btn:not(.btn-primary):not(.btn-danger):not(.btn-success):not(.btn-warning):not(.btn-info):not(.btn-collapse):not(.btn-actions):not(.close) {
  background-color: #E4E4E4 !important;
  background-image: linear-gradient(#FDFDFD, #D6D6D6) !important;
  border: 1px solid #6E6E6E !important;
  border-radius: 2px !important;
  color: #111111 !important;
  box-shadow: none !important;
  text-transform: none !important;
  font-size: 11px !important;
  font-weight: normal !important;
}
html.mdt-p1 body .btn:not(.btn-primary):not(.btn-danger):not(.btn-success):not(.btn-warning):not(.btn-info):not(.btn-collapse):not(.btn-actions):not(.close):hover {
  background-image: linear-gradient(#FFFFFF, #E4E4E4) !important;
}
html.mdt-p1 body .btn-primary, html.mdt-p1 body .btn-danger, html.mdt-p1 body button.btn-primary, html.mdt-p1 body button.btn-danger {
  background-color: #B30000 !important;
  background-image: linear-gradient(#D61010, #8A0000) !important;
  border: 1px solid #5A0000 !important;
  border-radius: 2px !important;
  color: #FFFFFF !important;
  font-size: 11px !important;
  font-weight: bold !important;
  text-transform: none !important;
  box-shadow: none !important;
}
html.mdt-p1 body .btn-primary:hover, html.mdt-p1 body .btn-danger:hover {
  background-image: linear-gradient(#E82020, #A00000) !important;
}
html.mdt-p1 body .form-control, html.mdt-p1 body input[type="text"], html.mdt-p1 body input[type="search"],
html.mdt-p1 body input[type="number"], html.mdt-p1 body input[type="password"], html.mdt-p1 body input[type="email"],
html.mdt-p1 body input[type="date"], html.mdt-p1 body textarea, html.mdt-p1 body select {
  background-color: #FFFFFF !important;
  background-image: none !important;
  border: 1px solid #6E6E6E !important;
  border-radius: 0 !important;
  box-shadow: inset 1px 1px 1px rgba(0,0,0,0.12) !important;
  color: #111111 !important;
  font-size: 11px !important;
}
html.mdt-p1 body .form-control:focus, html.mdt-p1 body input:focus, html.mdt-p1 body textarea:focus, html.mdt-p1 body select:focus {
  border-color: #8B0000 !important;
  outline: none !important;
}
html.mdt-p1 body label, html.mdt-p1 body .bmd-label-floating, html.mdt-p1 body .control-label {
  color: #333333 !important;
  font-size: 10px !important;
  font-weight: bold !important;
  text-transform: uppercase !important;
  letter-spacing: 0.2px !important;
}
html.mdt-p1 body textarea, html.mdt-p1 body .note-editable, html.mdt-p1 body .note-codable {
  font-family: "Courier New", Consolas, monospace !important;
}
html.mdt-p1 body .modal-header {
  background-color: #000000 !important;
  background-image: linear-gradient(#2A2A2A, #000000) !important;
  border-radius: 0 !important;
}
html.mdt-p1 body .modal-header .modal-title, html.mdt-p1 body .modal-header > *:not(.close) { color: #FFFFFF !important; text-transform: uppercase !important; font-size: 11px !important; letter-spacing: 0.4px !important; }
html.mdt-p1 body .modal-content { border-radius: 0 !important; border: 1px solid #000000 !important; }
html.mdt-p1 body .nav-tabs .nav-link, html.mdt-p1 body .nav-pills .nav-link {
  background-color: #222222 !important;
  background-image: linear-gradient(#494949, #171717) !important;
  border-radius: 0 !important;
  color: #FFFFFF !important;
  font-weight: bold !important;
}
html.mdt-p1 body .nav-tabs .nav-link.active, html.mdt-p1 body .nav-pills .nav-link.active {
  background-color: #DDD7BE !important;
  background-image: linear-gradient(#F5F3E8, #DDD7BE) !important;
  color: #202020 !important;
}
html.mdt-p1 body .nav-tabs .nav-link:hover:not(.active), html.mdt-p1 body .nav-pills .nav-link:hover:not(.active) { background-image: linear-gradient(#606060, #292929) !important; }
html.mdt-p1 body .nav-tabs .nav-link:active, html.mdt-p1 body .nav-pills .nav-link:active { box-shadow: inset 0 1px 3px #090909 !important; }
html.mdt-p1 body .badge { border-radius: 0 !important; font-size: 10px !important; }
html.mdt-p1 body .navbar, html.mdt-p1 body .navbar-absolute {
  background-color: #1A1A1A !important;
  background-image: linear-gradient(#333333, #0A0A0A) !important;
  border-bottom: 1px solid #000000 !important;
}
html.mdt-p1 body .navbar a, html.mdt-p1 body .navbar .navbar-brand, html.mdt-p1 body .navbar .nav-link { color: #FFFFFF !important; }
html.mdt-p1 body ${lookup} {
  box-sizing: border-box !important;
  vertical-align: middle !important;
  height: 26px !important;
  min-height: 26px !important;
  padding: 3px 7px !important;
  border: 1px solid #8E8A7A !important;
  border-radius: 1px !important;
  background: #F8F7F2 !important;
  color: #202020 !important;
  -webkit-text-fill-color: #202020 !important;
  font: 12px Tahoma, "Microsoft Sans Serif", sans-serif !important;
  line-height: 16px !important;
  box-shadow: inset 1px 1px 2px rgba(0,0,0,.22), 0 1px 0 rgba(255,255,255,.16) !important;
}
html.mdt-p1 body ${lookup}::placeholder { font: 12px Tahoma, "Microsoft Sans Serif", sans-serif !important; line-height: 16px !important; color: #606060 !important; -webkit-text-fill-color: #606060 !important; opacity: 1 !important; }
html.mdt-p1 body ${lookup}:hover { border-color: #B8B6AA !important; }
html.mdt-p1 body ${lookup}:focus {
  outline: 1px solid #C3B47B !important;
  outline-offset: 0 !important;
  border-color: #8A7D4A !important;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.18), 0 0 3px rgba(222,207,149,.5) !important;
}
${lookupAction} {
  display: inline-flex !important;
  box-sizing: border-box !important;
  font-size: 11px !important;
  line-height: 16px !important;
  align-items: center !important;
  justify-content: center !important;
  width: 28px !important;
  min-width: 28px !important;
  max-width: 28px !important;
  flex: 0 0 28px !important;
  height: auto !important;
  max-height: none !important;
  min-height: 26px !important;
  margin: 0 0 0 3px !important;
  padding: 4px 5px !important;
  border: 1px solid #777777 !important;
  border-radius: 1px !important;
  background: linear-gradient(#FCFCFA, #D5D3CC) !important;
  color: #202020 !important;
  -webkit-text-fill-color: #202020 !important;
  box-shadow: inset 0 1px 0 #FFFFFF !important;
  vertical-align: middle !important;
  text-decoration: none !important;
  text-shadow: none !important;
}
${lookupAction} :is(i, span, svg):not(.ripple-container):not(.ripple) { position: static !important; inset: auto !important; transform: none !important; display: block !important; flex: 0 0 auto !important; text-align: center !important; width: 12px !important; min-width: 0 !important; padding: 0 !important; margin: 0 !important; color: #202020 !important; -webkit-text-fill-color: #202020 !important; font-size: 12px !important; line-height: 16px !important; }
${lookupAction} { gap: 0 !important; text-align: center !important; align-self: center !important; }
${lookupAction} .fa-search::before, ${lookupAction}.fa-search::before { position: static !important; inset: auto !important; transform: none !important; display: block !important; margin: 0 !important; padding: 0 !important; line-height: 16px !important; text-align: center !important; }
${lookupAction}:hover { background: linear-gradient(#FFFDF3, #E4DCBC) !important; border-color: #A69C74 !important; }
${lookupAction}:active { background: linear-gradient(#C8C1A7, #E8E2CE) !important; box-shadow: inset 0 1px 2px #99917A !important; }
${lookupAction}:focus-visible { outline: 1px solid #C3B47B !important; outline-offset: 1px !important; }

html.mdt-p1 body .sidebar, html.mdt-p1 body .sidebar-wrapper {
  background-color: #D9D9D9 !important;
  background-image: linear-gradient(#F4F4F4, #D2D2D2) !important;
  border-right: 1px solid #6E6E6E !important;
}
html.mdt-p1 body .sidebar .nav li a, html.mdt-p1 body .sidebar-wrapper .nav li > a {
  background: transparent !important;
  color: #111111 !important;
  border-bottom: 1px solid #BDBDBD !important;
  border-radius: 0 !important;
}
html.mdt-p1 body .sidebar .nav li.active > a, html.mdt-p1 body .sidebar-wrapper .nav li.active > a {
  background-color: #D9D9D9 !important;
  color: #111111 !important;
}
html.mdt-p1 body ::-webkit-scrollbar-thumb { background-color: #A8A8A8 !important; border-radius: 0 !important; }
html.mdt-p1 body ::-webkit-scrollbar-track { background-color: #DCDAD5 !important; }

html.mdt-p1 body .main-panel > .content:not(.modal *) { padding: 10px 12px !important; }
html.mdt-p1 body .main-panel > .content .card:not(.card-profile-avatar):not(.card-profile):not(.modal *) { margin-top: 12px !important; margin-bottom: 14px !important; }
html.mdt-p1 body .card > .card-header:not(.modal *), html.mdt-p1 body .panel > .panel-heading:not(.modal *) {
  margin: 0 !important;
  padding: 3px 26px !important;
  min-height: 22px !important;
  line-height: 16px !important;
  box-shadow: inset 0 1px 0 #525252 !important;
}
html.mdt-p1 body .card > .card-body:not(.modal *), html.mdt-p1 body .panel > .panel-body:not(.modal *) { padding: 7px 8px !important; }
html.mdt-p1 body .card > .card-header .card-title:not(.modal *), html.mdt-p1 body .panel > .panel-heading .panel-title:not(.modal *) { color: #FFFFFF !important; font-size: 11px !important; margin: 0 !important; }
html.mdt-p1 body .table thead th:not(.modal *) { padding: 3px 6px !important; }
html.mdt-p1 body .table td:not(.modal *) { padding: 3px 6px !important; line-height: 16px !important; }
html.mdt-p1 body .btn:active:not(.btn-collapse) { box-shadow: inset 0 2px 4px rgba(0,0,0,.3) !important; background-image: linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.05)) !important; }
html.mdt-p1 body .btn:focus-visible, html.mdt-p1 body a:focus-visible { outline: 2px solid #8B0000 !important; outline-offset: 2px !important; }
html.mdt-p1 body .btn:disabled, html.mdt-p1 body .btn.disabled { opacity: .5 !important; }
html.mdt-p1 body .modal-content { box-shadow: 0 12px 32px rgba(0,0,0,.35) !important; }
html.mdt-p1 body .modal .modal-header .close, html.mdt-p1 body .card-header .btn-collapse {
  background-color: #A30000 !important;
  background-image: linear-gradient(#D52A2A, #830000) !important;
  border: 1px solid #650000 !important;
  color: #FFFFFF !important;
  opacity: 1 !important;
  text-shadow: none !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.3) !important;
}
html.mdt-p1 body .modal .modal-header .close:hover, html.mdt-p1 body .card-header .btn-collapse:hover { background-image: linear-gradient(#EF4141, #A30000) !important; }
html.mdt-p1 body .modal .modal-header .close *, html.mdt-p1 body .card-header .btn-collapse * { color: #FFFFFF !important; }
html.mdt-p1 body .modal-footer { background: #E4E4E4 !important; border-top: 1px solid #AAAAAA !important; }
html.mdt-p1 body .dropdown-menu { background: #FAFAFA !important; border: 1px solid #777777 !important; box-shadow: 0 3px 10px rgba(0,0,0,.22) !important; }
html.mdt-p1 body .dropdown-item:hover, html.mdt-p1 body .dropdown-item:focus { background: #E9E3CC !important; color: #111111 !important; }
html.mdt-p1 body ::-webkit-scrollbar-thumb:hover { background-color: #858585 !important; }
html.mdt-p1 body { font-size: 11px !important; }
html.mdt-p1 body .note-editable, html.mdt-p1 body .note-codable { background: #F8F8F6 !important; color: #202020 !important; }
html.mdt-p1 body .navbar .navbar-brand, html.mdt-p1 body .navbar .navbar-brand *, html.mdt-p1 body .navbar .navbar-wrapper {
  background: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
  color: #FFFFFF !important;
}
html.mdt-p1 body .table td .btn:not(.modal *), html.mdt-p1 body .btn-actions:not(.modal *) {
  height: auto !important;
  max-height: none !important;
  min-height: 22px !important;
  padding: 2px 7px !important;
  line-height: 16px !important;
  border: 1px solid rgba(0,0,0,.45) !important;
  border-radius: 2px !important;
  background-image: linear-gradient(rgba(255,255,255,.25), rgba(0,0,0,.18)) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 1px 1px rgba(0,0,0,.15) !important;
  margin: 1px 2px 1px 0 !important;
}
html.mdt-p1 body .table td .btn:hover:not(.modal *) { filter: brightness(1.12) !important; }
html.mdt-p1 body .table td .btn:active:not(.modal *) { box-shadow: inset 0 1px 3px rgba(0,0,0,.5) !important; }
`)
}

function buildPatrolDarkCss() {
  const p=PALETTES.p1dark
  return protectContentCss(`
html.mdt-p1.mdt-p1dark { color-scheme: dark; }
html.mdt-p1.mdt-p1dark body, html.mdt-p1.mdt-p1dark .wrapper, html.mdt-p1.mdt-p1dark .main-panel, html.mdt-p1.mdt-p1dark .main-panel > .content { background-color: ${p.panel} !important; color: ${p.text} !important; }
html.mdt-p1.mdt-p1dark body :is(.card,.card-dashboard,.card-stats,.panel,.card-body,.panel-body,.modal-content,.modal-body) { background-color: ${p.panelAlt} !important; color: ${p.text} !important; border-color: ${p.border} !important; }
html.mdt-p1.mdt-p1dark body td { background-color: ${p.row} !important; color: ${p.text} !important; border-color: ${p.borderLite} !important; }
html.mdt-p1.mdt-p1dark body tbody tr > td { background-color: ${p.row} !important; }
html.mdt-p1.mdt-p1dark body tbody tr:nth-child(even) > td { background-color: ${p.zebra} !important; }
html.mdt-p1.mdt-p1dark body tbody tr:hover > td { background-color: ${p.hover} !important; }
html.mdt-p1.mdt-p1dark body :is(.table td a,td a) { color: ${p.link} !important; }
html.mdt-p1.mdt-p1dark body :is(.font-plate,.badge-light:has([data-clipboard-target^="#plate"])):not([data-mdt-plate]):not(:where([data-mdt-plate] *)) { color: ${p.link} !important; -webkit-text-fill-color: ${p.link} !important; background-color: ${p.chip} !important; border-color: ${p.border} !important; }
html.mdt-p1.mdt-p1dark body :is(label,.bmd-label-floating,.control-label) { color: ${p.textMuted} !important; }
html.mdt-p1.mdt-p1dark body :is(.form-control,input[type="text"],input[type="search"],input[type="number"],input[type="password"],input[type="email"],input[type="date"],textarea,select), html.mdt-p1.mdt-p1dark body :is(input#character,input#plate,input)[data-mdt-lookup-field="1"] { background: ${p.field} !important; color: ${p.text} !important; -webkit-text-fill-color: ${p.text} !important; border-color: ${p.fieldBorder} !important; }
html.mdt-p1.mdt-p1dark body :is(input,textarea)::placeholder { color: ${p.textMuted} !important; -webkit-text-fill-color: ${p.textMuted} !important; opacity: 1 !important; }
html.mdt-p1.mdt-p1dark body :is(input#character,input#plate,input)[data-mdt-lookup-field="1"]::placeholder { color: ${p.textMuted} !important; -webkit-text-fill-color: ${p.textMuted} !important; }
html.mdt-p1.mdt-p1dark body .btn:not(.btn-primary):not(.btn-danger):not(.btn-success):not(.btn-warning):not(.btn-info):not(.btn-collapse):not(.btn-actions):not(.close), html.mdt-p1.mdt-p1dark body [data-mdt-lookup-action="1"] { background: linear-gradient(#454B54,#2D3239) !important; color: ${p.text} !important; -webkit-text-fill-color: ${p.text} !important; border-color: ${p.border} !important; box-shadow: inset 0 1px 0 #ffffff18 !important; }
html.mdt-p1.mdt-p1dark body [data-mdt-lookup-action="1"] :is(i,span,svg):not(.ripple-container):not(.ripple) { color: ${p.text} !important; -webkit-text-fill-color: ${p.text} !important; }
html.mdt-p1.mdt-p1dark body .btn:not(.btn-primary):not(.btn-danger):not(.btn-success):not(.btn-warning):not(.btn-info):not(.btn-collapse):not(.close):hover, html.mdt-p1.mdt-p1dark body [data-mdt-lookup-action="1"]:hover { background: linear-gradient(#555D68,#3B424B) !important; }
html.mdt-p1.mdt-p1dark body :is(.btn-primary,.btn-danger) { background-color: ${p.danger} !important; color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }
html.mdt-p1.mdt-p1dark body :is(.note-editable,.note-codable) { background: ${p.field} !important; color: ${p.text} !important; }
html.mdt-p1.mdt-p1dark body :is(.modal-footer,.card-footer) { background-color: ${p.panel} !important; border-color: ${p.border} !important; }
html.mdt-p1.mdt-p1dark body .dropdown-menu { background: ${p.panelAlt} !important; border-color: ${p.border} !important; }
html.mdt-p1.mdt-p1dark body :is(.dropdown-item:hover,.dropdown-item:focus) { background: ${p.sel} !important; color: ${p.text} !important; }
html.mdt-p1.mdt-p1dark body :is(.sidebar,.sidebar-wrapper) { background-color: ${p.panelAlt} !important; }
html.mdt-p1.mdt-p1dark body :is(.sidebar .nav li.active>a,.sidebar-wrapper .nav li.active>a) { background-color: ${p.sel} !important; color: ${p.text} !important; }
html.mdt-p1.mdt-p1dark body ::-webkit-scrollbar-track { background-color: ${p.scrollTrack} !important; }
html.mdt-p1.mdt-p1dark body ::-webkit-scrollbar-thumb { background-color: ${p.scrollThumb} !important; border-color: ${p.border} !important; }
html.mdt-p1.mdt-p1dark body ::-webkit-scrollbar-thumb:hover { background-color: ${p.scrollThumbHover} !important; }
`)
}

function applyP1() {
  const on = themeNow() === 'p1' || themeNow() === 'p1dark'
  const host = document.head || document.documentElement
  const root = document.documentElement
  let node = document.getElementById(P1_STYLE_ID)
  if (root && root.classList) root.classList.toggle('mdt-p1dark',themeNow()==='p1dark')
  if (!on) {
    if (root && root.classList) root.classList.remove('mdt-p1')
    if (node && node.parentNode) node.parentNode.removeChild(node)
    return
  }
  if (root && root.classList) root.classList.add('mdt-p1')
  if (!node) {
    node = document.createElement('style')
    node.id = P1_STYLE_ID
    node.setAttribute('type', 'text/css')
  }
  const css = cachedSkinCss('p1:'+themeNow(),()=>buildP1Css()+(themeNow()==='p1dark'?buildPatrolDarkCss():''))
  if (node.textContent !== css) node.textContent = css
  if (host && node.parentNode !== host) host.appendChild(node)
  else if (host && host.lastChild !== node) host.appendChild(node)
}

const PLATE_STYLE_ID = 'mdt-plate-skin'
const PLATE_RE = /^[A-Z0-9][A-Z0-9 -]{1,10}$/

function buildPlateCss() {
  return `
html body [data-mdt-plate="1"] {
  position: relative !important;
  display: inline-block !important;
  background: #FFFFFF !important;
  background-image: linear-gradient(180deg, #FFFFFF 0%, #F4F6FA 100%) !important;
  border: 1px solid #C9D2E2 !important;
  border-radius: 10px !important;
  box-shadow: 0 2px 6px rgba(10, 20, 45, 0.30) !important;
  padding: 16px 30px 10px !important;
  min-width: 150px !important;
  text-align: center !important;
  overflow: visible !important;
}

html body [data-mdt-plate="1"],
html body [data-mdt-plate="1"] * {
  color: #1B2E8C !important;
  font-family: "Segoe UI", Tahoma, sans-serif !important;
  font-weight: 700 !important;
  font-size: 26px !important;
  line-height: 1.1 !important;
  letter-spacing: 1px !important;
  text-shadow: none !important;
}

html body [data-mdt-plate="1"]::before {
  content: "San Andreas";
  position: absolute !important;
  top: 3px !important;
  left: 0 !important;
  right: 0 !important;
  text-align: center !important;
  color: #E02B36 !important;
  font-family: Georgia, "Times New Roman", serif !important;
  font-style: italic !important;
  font-weight: 600 !important;
  font-size: 11px !important;
  letter-spacing: 0 !important;
  pointer-events: none !important;
}

html body [data-mdt-plate="1"]::after {
  content: "" !important;
  position: absolute !important;
  top: 6px !important;
  left: 8px !important;
  width: 18px !important;
  height: 7px !important;
  border-radius: 4px !important;
  background: #E8434C !important;
  box-shadow: 108px 0 0 #E8434C !important;
  pointer-events: none !important;
}

html body [data-mdt-plate="1"] [data-mdt-plate-cap="1"] { display: none !important; }
`
}

function applyPlateStyle() {
  const host = document.head || document.documentElement
  if (!host) return
  let node = document.getElementById(PLATE_STYLE_ID)
  if (!node) {
    node = document.createElement('style')
    node.id = PLATE_STYLE_ID
    node.setAttribute('type', 'text/css')
    node.textContent = cachedSkinCss('plate', buildPlateCss)
  }
  if (node.parentNode !== host) host.appendChild(node)
}

function isPlateRecordPage() {
  try {
    return /^\/dmv\/[^/]+/i.test(location.pathname)
  } catch (_) {
    return false
  }
}

function fixPlates() {
  if (!document.body) return
  if (themeNow() === 'off') {
    const old = document.getElementById(PLATE_STYLE_ID)
    if (old) old.remove()
    document.querySelectorAll('[data-mdt-plate]').forEach((node) => node.removeAttribute('data-mdt-plate'))
    return
  }
  if (!isPlateRecordPage()) {
    for (const old of document.querySelectorAll('[data-mdt-plate="1"]')) {
      old.removeAttribute('data-mdt-plate')
    }
    return
  }
  applyPlateStyle()
  let nodes = []
  try {
    nodes = document.querySelectorAll(
      '[class*="plate" i], [id*="plate" i], [name*="plate" i]'
    )
  } catch (_) {
    return
  }
  for (const el of nodes) {
    if (!el || el.getAttribute('data-mdt-plate') === '1') continue
    if (el.querySelector && el.querySelector('.font-plate, [id^="vehiclePlateText"]')) continue
    if (el.closest && el.closest('.badge:has(.font-plate)')) continue
    const tag = el.tagName
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' ||
        tag === 'OPTION' || tag === 'TABLE' || tag === 'TR' ||
        tag === 'THEAD' || tag === 'TBODY' || tag === 'FORM') continue
    if (el.querySelector('input, select, textarea, table, .btn')) continue
    const text = flatText(el)
    if (!text || text.length > 12) continue
    if (!PLATE_RE.test(text.toUpperCase())) continue
    if (text.toUpperCase() !== text) continue
    for (const kid of el.querySelectorAll('*')) {
      if (/san\s*andreas/i.test(flatText(kid))) kid.setAttribute('data-mdt-plate-cap', '1')
    }
    el.setAttribute('data-mdt-plate', '1')
  }
}

function buildCss(p) {
  return protectContentCss(`

:root, html, body {
  color-scheme: ${p === PALETTES.p1dark || p === PALETTES.aerodark || p === PALETTES.aerolapd ? 'dark' : 'light'} !important;
  --bs-body-bg: ${p.panel} !important;
  --bs-body-color: ${p.text} !important;
  --bs-card-bg: ${p.panel} !important;
  --bs-border-color: ${p.border} !important;
  --bs-border-radius: 0 !important;
  --bs-link-color: ${p.link} !important;
}

*, *::before, *::after {
  border-radius: 0 !important;
  box-shadow: none !important;
  text-shadow: none !important;
  backdrop-filter: none !important;
  letter-spacing: normal !important;
}

a, .nav-link, .badge, .card-header, .page-link, th, td, .list-group-item {
  transition: none !important;
  animation: none !important;
}

.collapsing { transition: height 0.2s linear !important; }
.modal.fade { transition: opacity 0.12s linear !important; }
.modal.fade .modal-dialog { transition: transform 0.2s ease-out !important; }
.modal-backdrop, .modal-backdrop.fade { transition: opacity 0.12s linear !important; }

html, body {
  background: ${p.panel} !important;
  color: ${p.text} !important;
  font-size: 12px !important;
  line-height: 1.35 !important;
}

body, body *:where(${NOT_ICON}) {
  font-family: "Segoe UI", Tahoma, "MS Shell Dlg 2", sans-serif !important;
}

.main-panel { overflow-x: hidden !important; }
.sidebar, .sidebar-wrapper { overflow-x: hidden !important; }

${PANEL_SEL} {
  background-image: none !important;
  background-color: ${p.panel} !important;
}

${FLAT_SEL} {
  background-image: none !important;
  background-color: transparent !important;
}

html body .bg-dark, html body .bg-black, html body .bg-secondary, html body .bg-body,
html body .bg-light, html body .bg-white,
html body .card-header-dark, html body .badge-dark, html body .navbar-transparent,
html body [class*="bg-dark"], html body .dark, html body .theme-dark {
  background-color: ${p.panel} !important;
  background-image: none !important;
  color: ${p.text} !important;
  border-color: ${p.border} !important;
}

html body .sidebar::before, html body .sidebar::after,
html body .sidebar-wrapper::before, html body .sidebar-wrapper::after,
html body .sidebar-submenu::before, html body .sidebar-submenu::after,
html body .card-header::before, html body .card-header::after {
  background-color: ${p.panel} !important;
  background-image: none !important;
  opacity: 1 !important;
  box-shadow: none !important;
}

html body, html body p, html body span, html body div, html body li, html body dt, html body dd,
html body label, html body small, html body strong, html body b, html body em, html body u,
html body td, html body th, html body caption, html body h1, html body h2, html body h3,
html body h4, html body h5, html body h6, html body .h1, html body .h2, html body .h3,
html body .h4, html body .h5, html body .h6, html body .card-title, html body .card-category,
html body .stats, html body .description, html body .modal-title,
html body .text-white, html body .text-light, html body .text-body, html body .text-reset,
html body .text-dark, html body .text-black {
  color: ${p.text} !important;
}

html body .text-muted, html body .text-secondary, html body .opacity-50, html body .opacity-75 {
  color: ${p.textMuted} !important;
  opacity: 1 !important;
}

.card, .card-dashboard, .card-stats, .panel, .box, .well,
.dropdown-menu, .list-group-item, .swal2-popup {
  border: 1px solid ${p.border} !important;
  margin-bottom: 6px !important;
}

.card-header, .card-header-dark, .card-header-icon, .panel-heading,
.card-footer, .swal2-header {
  background-color: ${p.header} !important;
  color: ${p.text} !important;
  border-bottom: 1px solid ${p.border} !important;
  font-weight: bold !important;
  font-size: 12px !important;
  padding: 3px 6px !important;
  min-height: 0 !important;
}

html body .card-header, html body .panel-heading, html body .card > .card-header {
  position: relative !important;
}
html body .card-title {
  position: static !important;
}
html body .card-header .btn-collapse, html body .card-title .btn-collapse,
html body .panel-heading .btn-collapse {
  position: absolute !important;
  top: 50% !important;
  right: 6px !important;
  left: auto !important;
  bottom: auto !important;
  transform: translateY(-50%) !important;
  margin: 0 !important;
  width: 20px !important;
  height: 18px !important;
  min-width: 0 !important;
  min-height: 0 !important;
  padding: 0 !important;
  line-height: 16px !important;
  font-size: 11px !important;
  overflow: hidden !important;
  box-shadow: none !important;
  z-index: 3 !important;
}
html body .card > .card-header, html body .panel > .panel-heading {
  padding-left: 30px !important;
  padding-right: 30px !important;
  min-height: 22px !important;
  line-height: 16px !important;
  overflow: visible !important;
}
html body .card, html body .panel {
  background-color: ${p.panel} !important;
  border: 1px solid ${p.border} !important;
  border-radius: 4px !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12) !important;
  background-clip: padding-box !important;
}
html body .card-profile, html body .card-profile-avatar,
html body .card-profile-elements {
  background-color: ${p.panel} !important;
  background-image: none !important;
  border: 1px solid ${p.border} !important;
  border-radius: 4px !important;
}
html body .card-profile .card-body, html body .card-profile-avatar .card-body,
html body .card-profile-elements .card-body {
  background: transparent !important;
  background-image: none !important;
}
html body .card-body > .table-responsive, html body .card-body .table {
  max-width: 100% !important;
}
html body img.warrantSealLogoLeft, html body img.warrantSealLogoRight {
  height: 92px !important;
  width: auto !important;
  max-width: none !important;
}
html body .card-header:has(.btn-collapse),
html body .panel-heading:has(.btn-collapse),
html body .card-header:has(.close),
html body .panel-heading:has(.close) {
  padding-left: 26px !important;
  padding-right: 26px !important;
  text-align: center !important;
}
html body .card-header:has(.btn-collapse) > .card-title,
html body .card-header:has(.btn-collapse) > h1,
html body .card-header:has(.btn-collapse) > h2,
html body .card-header:has(.btn-collapse) > h3,
html body .card-header:has(.btn-collapse) > h4,
html body .card-header:has(.btn-collapse) > h5,
html body .card-header:has(.btn-collapse) > span,
html body .card-header:has(.btn-collapse) > a,
html body .panel-heading:has(.btn-collapse) > .panel-title {
  display: block !important;
  width: 100% !important;
  text-align: center !important;
  margin: 0 auto !important;
  float: none !important;
}
html body .card-header .btn-collapse,
html body .panel-heading .btn-collapse,
html body .card-header > .close,
html body .panel-heading > .close {
  position: absolute !important;
  right: 4px !important;
  top: 50% !important;
  left: auto !important;
  bottom: auto !important;
  transform: translateY(-50%) !important;
  margin: 0 !important;
  z-index: 3 !important;
}

.card-body, .panel-body { padding: 6px 8px !important; }

html body .card-profile, html body .card-profile-avatar {
  position: relative !important;
  background: ${p.panel} !important;
  border: 1px solid ${p.border} !important;
  box-shadow: none !important;
  overflow: visible !important;
}
html body .card-profile-avatar {
  padding: 3px !important;
  background: ${p.field} !important;
}
html body .card-profile-avatar .card-img,
html body .card-profile-avatar img {
  border-radius: 0 !important;
  display: block !important;
  max-width: 100% !important;
}
html body .card-img, html body #charPicture {
  position: relative !important;
  display: block !important;
  overflow: hidden !important;
  line-height: 0 !important;
}
html body .card-img img, html body img.personPhotograph {
  display: block !important;
  max-width: 100% !important;
  height: auto !important;
  margin: 0 auto !important;
}
html body .card-img-overlay {
  position: absolute !important;
  top: 2px !important;
  right: 2px !important;
  bottom: auto !important;
  left: auto !important;
  width: auto !important;
  height: auto !important;
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  border: 0 !important;
  line-height: 1 !important;
  text-align: right !important;
  pointer-events: auto !important;
  z-index: 3 !important;
}
html body .card-img-overlay br {
  display: block !important;
  line-height: 2px !important;
}
html body .card-img-overlay > a {
  display: inline-block !important;
  float: none !important;
  position: static !important;
  margin: 0 0 2px 0 !important;
  padding: 2px !important;
  width: 18px !important;
  height: 18px !important;
  background: rgba(255, 255, 255, 0.82) !important;
  border: 1px solid ${p.border} !important;
  text-align: center !important;
  line-height: 12px !important;
  box-sizing: border-box !important;
}
html body .card-img-overlay > a:hover {
  background: ${p.hover} !important;
}
html body .card-img-overlay .uploadIcon,
html body .card-img-overlay i {
  font-size: 11px !important;
  line-height: 12px !important;
  width: 12px !important;
  height: 12px !important;
  margin: 0 !important;
  vertical-align: top !important;
}
html body .card hr, html body .panel hr {
  border: 0 !important;
  border-top: 1px solid ${p.borderLite} !important;
  margin: 6px 0 !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  height: 0 !important;
  min-height: 0 !important;
  box-sizing: border-box !important;
  flex: 0 1 100% !important;
  float: none !important;
  position: static !important;
  transform: none !important;
  background: transparent !important;
  box-shadow: none !important;
  opacity: 1 !important;
}
.card-title { font-size: 12px !important; font-weight: bold !important; margin: 2px 0 !important; }

.card-icon {
  background-image: none !important;
  border: 1px solid ${p.border} !important;
  padding: 6px !important;
  margin: 0 6px 0 0 !important;
}
.card-header-primary .card-icon { background-color: ${p.primary} !important; }
.card-header-info .card-icon { background-color: ${p.infoStrong} !important; }
.card-header-success .card-icon { background-color: ${p.success} !important; }
.card-header-warning .card-icon { background-color: #B8860B !important; }
.card-header-danger .card-icon { background-color: ${p.danger} !important; }
.card-header-dark .card-icon { background-color: #404040 !important; }
.card-icon i, .card-icon .material-icons, .card-icon svg { color: #FFFFFF !important; }

.card-stats, .card-dashboard {
  background-color: ${p.panel} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: hidden !important;
  margin-top: 14px !important;
}

.bootstrap-select:not(.form-control) {
  margin: 1px !important;
  vertical-align: middle !important;
}
html body .note-editable * {
  background-image: none !important;
}
html body .bootstrap-select .dropdown-menu {
  max-height: 340px !important;
  min-width: 260px !important;
  overflow: hidden !important;
  z-index: 2000 !important;
}
html body .bootstrap-select .dropdown-menu > .inner,
html body .bootstrap-select .dropdown-menu > ul.inner,
html body .modal .dropdown-menu > .inner {
  max-height: 300px !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
}
html body .bootstrap-select .dropdown-menu > .inner ul,
html body .bootstrap-select .dropdown-menu > .inner > ul.inner {
  max-height: none !important;
  overflow: visible !important;
  margin: 0 !important;
}
html body .bootstrap-select .dropdown-menu li,
html body .bootstrap-select .dropdown-menu li a,
html body .bootstrap-select .dropdown-menu .dropdown-item {
  min-height: 20px !important;
  height: auto !important;
  padding: 3px 8px !important;
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  line-height: 15px !important;
}
.bootstrap-select > .dropdown-toggle {
  height: 22px !important;
  min-height: 22px !important;
  max-height: 22px !important;
  line-height: 18px !important;
  padding: 0 18px 0 6px !important;
  margin: 0 !important;
  vertical-align: middle !important;
  border-radius: 0 !important;
}
.bootstrap-select > .dropdown-toggle .filter-option,
.bootstrap-select > .dropdown-toggle .filter-option-inner,
.bootstrap-select > .dropdown-toggle .filter-option-inner-inner {
  height: 18px !important;
  line-height: 18px !important;
  overflow: hidden !important;
}

html body .leaflet-control-search {
  position: relative !important;
  overflow: visible !important;
  z-index: 1400 !important;
}
html body .leaflet-control-search .search-tooltip,
html body .leaflet-control-search ul,
html body ul.search-tooltip,
html body .search-tooltip {
  position: absolute !important;
  top: 100% !important;
  bottom: auto !important;
  left: 0 !important;
  right: auto !important;
  margin: 2px 0 0 0 !important;
  padding: 0 !important;
  width: 252px !important;
  max-height: 220px !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  background: ${p.panel} !important;
  background-color: ${p.panel} !important;
  background-image: none !important;
  color: ${p.text} !important;
  border: 1px solid ${p.border} !important;
  border-radius: 0 !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35) !important;
  opacity: 1 !important;
  z-index: 1500 !important;
  list-style: none !important;
}
html body .leaflet-control-search .search-tip,
html body .search-tooltip > li,
html body .search-tip {
  display: block !important;
  margin: 0 !important;
  padding: 4px 8px !important;
  background: ${p.panelAlt} !important;
  background-color: ${p.panelAlt} !important;
  background-image: none !important;
  color: ${p.text} !important;
  border: none !important;
  border-bottom: 1px solid ${p.borderLite} !important;
  border-radius: 0 !important;
  font-size: 11px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  cursor: pointer !important;
}
html body .search-tip:hover,
html body .search-tip-select {
  background: ${p.sel} !important;
  background-color: ${p.sel} !important;
}

html body .note-editor,
html body .note-frame,
html body .note-editing-area,
html body .note-editable,
html body .note-codable,
html body .note-statusbar {
  background: ${p.field} !important;
  background-color: ${p.field} !important;
  background-image: none !important;
  color: ${p.text} !important;
  border-radius: 0 !important;
}
html body .note-placeholder {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  color: ${p.textMuted} !important;
  opacity: 1 !important;
  pointer-events: none !important;
}
html body input::placeholder,
html body textarea::placeholder,
html body .form-control::placeholder {
  color: ${p.textMuted} !important;
  opacity: 1 !important;
  background: transparent !important;
}
html body .note-editor,
html body .note-frame {
  border: 1px solid ${p.fieldBorder} !important;
}
html body .note-editing-area,
html body .note-editable,
html body .note-codable,
html body .note-statusbar {
  border: none !important;
}
html body .note-editable * {
  background-color: transparent !important;
}
html body .note-editor,
html body .note-frame,
html body .note-editing-area,
html body .note-editable,
html body .note-codable,
html body .note-placeholder,
html body .note-editable p,
html body .note-editable div,
html body .note-editable li {
  text-align: left !important;
}
html body .note-editable [align="center"],
html body .note-editable [style*="text-align: center"],
html body .note-editable .text-center {
  text-align: center !important;
}
html body .modal .modal-body .form-group:has(.note-editor),
html body .modal .modal-body .bmd-form-group:has(.note-editor),
html body .modal .modal-body [class*="col-"]:has(> .form-group > .note-editor),
html body .modal .modal-body [class*="col-"]:has(> .note-editor) {
  align-items: stretch !important;
  text-align: left !important;
}
html body .note-toolbar,
html body .note-toolbar.card-header {
  background: ${p.header} !important;
  background-color: ${p.header} !important;
  background-image: none !important;
  border-bottom: 1px solid ${p.border} !important;
  border-radius: 0 !important;
}

html.mdt-form-page body .card,
html.mdt-form-page body .card-header,
html.mdt-form-page body .card-body,
html.mdt-form-page body .card-footer,
html.mdt-form-page body .form-control,
html.mdt-form-page body .btn,
html.mdt-form-page body .dropdown-menu,
html.mdt-form-page body .dropdown-toggle,
html.mdt-form-page body .input-group-text,
html.mdt-form-page body .alert,
html.mdt-form-page body .note-editor,
html.mdt-form-page body .note-frame {
  border-radius: 0 !important;
}
html.mdt-form-page body .card {
  border: 1px solid ${p.border} !important;
  overflow: visible !important;
  background-clip: border-box !important;
}
html.mdt-form-page body .card-header {
  border-top: none !important;
  border-right: none !important;
  border-left: none !important;
  border-bottom: 1px solid ${p.border} !important;
  margin: 0 !important;
}

html body .btn-dark, html body .btn.btn-dark,
html body .btn-secondary, html body .btn.btn-secondary,
html body .btn-inverse, html body .btn.btn-inverse,
html body .btn-outline-dark, html body .btn.btn-outline-dark,
html body .btn-default, html body .btn.btn-default {
  background-color: ${p.btnFace} !important;
  background-image: none !important;
  color: ${p.text} !important;
  border: 1px solid ${p.border} !important;
}
html body .btn-dark *, html body .btn-secondary *,
html body .btn-inverse *, html body .btn-default * { color: ${p.text} !important; }
html body .btn-dark:hover, html body .btn-secondary:hover,
html body .btn-inverse:hover, html body .btn-default:hover { background-color: ${p.btnHover} !important; }

html body [class*="search"]:not(input):not(button):not(a):not(.btn):not(.form-control):not(table):not(thead):not(tbody):not(tr):not(td):not(th):not(.search-tooltip):not(.search-tip):not(.search-tip-select):not([data-mdt-tip]):not([data-mdt-tip-row]) {
  background-image: none !important;
  box-shadow: none !important;
  border: none !important;
  background: transparent !important;
}
html body .search-bar, html body .search-box, html body .searchbox,
html body .search-wrapper, html body .search-container, html body .search-panel,
html body .map-search, html body .leaflet-control-search, html body .leaflet-control-search form {
  background-color: ${p.panel} !important;
  color: ${p.text} !important;
  border: 1px solid ${p.border} !important;
  padding: 2px !important;
}

html body [data-mdt-frow="1"] {
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  gap: 3px 6px !important;
  margin: 0 !important;
  padding: 2px 0 !important;
  width: 100% !important;
  max-width: 100% !important;
}
html body [data-mdt-fcell="1"] {
  display: inline-flex !important;
  align-items: center !important;
  flex: 0 0 auto !important;
  float: none !important;
  position: static !important;
  top: auto !important;
  width: auto !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
  vertical-align: middle !important;
}
html body [data-mdt-fcell="1"] input:not([type="checkbox"]):not([type="radio"]),
html body [data-mdt-fcell="1"] select,
html body [data-mdt-fcell="1"] .form-control,
html body [data-mdt-fcell="1"] .bootstrap-select,
html body [data-mdt-fcell="1"] .bootstrap-select > .dropdown-toggle {
  height: 22px !important;
  min-height: 22px !important;
  max-height: 22px !important;
  margin: 0 !important;
}
html body [data-mdt-fcell="1"] .btn,
html body [data-mdt-fcell="1"] button.btn,
html body [data-mdt-fcell="1"] a.btn,
html body [data-mdt-frow="1"] > .btn,
html body [data-mdt-frow="1"] > button.btn,
html body [data-mdt-frow="1"] > a.btn {
  height: 22px !important;
  min-height: 22px !important;
  max-height: 22px !important;
  padding: 0 8px !important;
  margin: 0 !important;
  font-size: 12px !important;
  line-height: 16px !important;
  font-weight: normal !important;
  align-self: center !important;
  flex: 0 0 auto !important;
}
html body [data-mdt-frow="1"] label,
html body [data-mdt-frow="1"] .form-check,
html body [data-mdt-frow="1"] .checkbox {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  margin: 0 !important;
  padding: 0 !important;
  white-space: nowrap !important;
  font-size: 12px !important;
}

#map {
  background-color: #0FA8D2 !important;
  width: 100% !important;
  min-height: 380px !important;
  border: 1px solid ${p.border} !important;
  overflow: hidden !important;
}
.leaflet-container {
  background-color: #0FA8D2 !important;
  border: 1px solid ${p.border} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: hidden !important;
  width: 100% !important;
  min-height: 380px !important;
  max-height: none !important;
  font-family: inherit !important;
}
.leaflet-pane, .leaflet-pane *, .leaflet-tile, .leaflet-tile-container,
.leaflet-marker-icon, .leaflet-marker-shadow, .leaflet-image-layer,
.leaflet-zoom-box, .leaflet-overlay-pane svg {
  background: none !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  max-width: none !important;
  max-height: none !important;
  overflow: visible !important;
}
.leaflet-popup-content-wrapper, .leaflet-popup-tip {
  background-color: ${p.panel} !important;
  color: ${p.text} !important;
  border: 1px solid ${p.border} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
.leaflet-popup-content { margin: 6px 8px !important; color: ${p.text} !important; }
.leaflet-control-container, .leaflet-top, .leaflet-bottom, .leaflet-control {
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  max-height: none !important;
  overflow: visible !important;
}
.leaflet-control-layers, .leaflet-control-zoom, .leaflet-bar {
  background-color: ${p.panel} !important;
  border: 1px solid ${p.border} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  max-height: none !important;
  height: auto !important;
  overflow: visible !important;
}
.leaflet-control-layers-expanded {
  width: auto !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  padding: 6px 8px !important;
  color: ${p.text} !important;
}
.leaflet-control-layers-list {
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}
.leaflet-control-layers label {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  margin: 0 0 2px 0 !important;
  padding: 0 !important;
  white-space: nowrap !important;
  font-size: 12px !important;
  line-height: 16px !important;
  color: ${p.text} !important;
}
.leaflet-control-layers-separator { border-top: 1px solid ${p.border} !important; margin: 4px 0 !important; }
.leaflet-control-layers input[type="checkbox"],
.leaflet-control-layers input[type="radio"] {
  margin: 0 !important;
  height: auto !important;
  min-height: 0 !important;
}
.leaflet-bar a, .leaflet-control-zoom a {
  background-color: ${p.btnFace} !important;
  color: ${p.text} !important;
  border: 1px solid ${p.border} !important;
  border-radius: 0 !important;
  width: 20px !important;
  height: 20px !important;
  line-height: 18px !important;
  font-size: 14px !important;
  padding: 0 !important;
}
.leaflet-bar a:hover, .leaflet-control-zoom a:hover { background-color: ${p.btnHover} !important; }
.leaflet-control-attribution {
  background-color: ${p.panel} !important;
  color: ${p.textMuted} !important;
  border: 1px solid ${p.border} !important;
  border-right: none !important;
  border-bottom: none !important;
  border-radius: 0 !important;
  padding: 0 5px !important;
  font-size: 10px !important;
  line-height: 14px !important;
}
.leaflet-control-attribution a { color: ${p.link} !important; }
.card-stats .card-header, .card-stats .card-header-icon,
.card-dashboard .card-header, .card-dashboard .card-header-icon {
  background-color: ${p.panel} !important;
  border: none !important;
  border-bottom: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 10px !important;
  padding: 10px 10px 10px 10px !important;
  overflow: hidden !important;
  text-align: left !important;
}
.card-stats .card-icon, .card-dashboard .card-icon {
  float: none !important;
  position: static !important;
  top: auto !important;
  width: 42px !important;
  height: 42px !important;
  min-width: 42px !important;
  flex: 0 0 42px !important;
  align-self: center !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
.card-stats .card-header > *:not(.card-icon),
.card-stats .card-header-icon > *:not(.card-icon),
.card-dashboard .card-header > *:not(.card-icon),
.card-dashboard .card-header-icon > *:not(.card-icon) {
  flex: 0 1 auto !important;
  min-width: 0 !important;
  margin: 0 !important;
  text-align: left !important;
}
.card-stats .card-icon i, .card-stats .card-icon .material-icons,
.card-dashboard .card-icon i, .card-dashboard .card-icon .material-icons {
  font-size: 22px !important;
  line-height: 1 !important;
  margin: 0 !important;
}
.card-stats .card-category, .card-stats .card-title,
.card-stats h3, .card-stats h4, .card-stats p,
.card-dashboard .card-category, .card-dashboard .card-title {
  margin: 0 !important;
  padding: 0 !important;
  text-align: left !important;
  white-space: nowrap !important;
  color: ${p.text} !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.card-stats .card-title, .card-dashboard .card-title {
  font-size: 13px !important;
  font-weight: bold !important;
}
.card-stats .card-footer, .card-dashboard .card-footer {
  background-color: ${p.panelAlt} !important;
  border-top: 1px solid ${p.border} !important;
  margin: 0 !important;
  padding: 2px 6px !important;
}

.tab-content {
  background-color: ${p.panel} !important;
  border: 1px solid ${p.border} !important;
  border-top: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  margin: 0 0 6px 0 !important;
  padding: 10px !important;
  overflow: visible !important;
}
.tab-content > .tab-pane {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

html.mdt-lookup .tab-content form {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 6px !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}
html.mdt-lookup .tab-content form .row,
html.mdt-lookup .tab-content form .form-row,
html.mdt-lookup .tab-content form [class*="col-"],
html.mdt-lookup .tab-content form fieldset,
html.mdt-lookup .tab-content form > div:not(.form-group):not(.bmd-form-group):not(.input-group) {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 6px !important;
  width: 100% !important;
  max-width: none !important;
  margin: 0 auto !important;
  padding: 0 !important;
  float: none !important;
}
html.mdt-lookup .tab-content form .form-group,
html.mdt-lookup .tab-content form .bmd-form-group,
html.mdt-lookup .tab-content form .input-group {
  width: 320px !important;
  max-width: 320px !important;
  min-width: 0 !important;
  margin: 0 auto !important;
  padding: 0 !important;
  float: none !important;
  flex: 0 0 auto !important;
  align-self: center !important;
}
html.mdt-lookup .tab-content form .btn,
html.mdt-lookup .tab-content form button[type="submit"],
html.mdt-lookup .tab-content form input[type="submit"] {
  order: 99 !important;
  width: 320px !important;
  max-width: 320px !important;
  align-self: center !important;
  margin: 8px auto 0 auto !important;
}

h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6 {
  font-weight: bold !important;
  margin: 4px 0 !important;
}
h1, .h1 { font-size: 16px !important; }
h2, .h2 { font-size: 15px !important; }
h3, .h3 { font-size: 14px !important; }
h4, .h4 { font-size: 13px !important; }
h5, h6, .h5, .h6 { font-size: 12px !important; }

.navbar, .navbar-absolute, .navbar-transparent {
  border-bottom: 1px solid ${p.border} !important;
  min-height: 0 !important;
  padding: 2px 6px !important;
}

.progress, .progress-striped, [class*="progress"] {
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
  height: auto !important;
  min-height: 14px !important;
  margin: 0 !important;
  padding: 0 !important;
}
.progress-bar {
  background-image: none !important;
  color: ${p.text} !important;
  font-size: 11px !important;
  height: auto !important;
  min-height: 14px !important;
  line-height: 14px !important;
}

.card:has(> .progress), .card:has(> .card-body > .progress),
.card-body:has(> .progress:only-child),
.card:has(> .alert), .card:has(> .card-body > .alert:only-child),
.card:has(> .bg-danger), .card:has(> .card-body > .bg-danger:only-child) {
  background-color: transparent !important;
  border: none !important;
  margin-bottom: 4px !important;
}
.card-body:has(> .alert:only-child), .card-body:has(> .bg-danger:only-child),
.card-body:has(> .progress:only-child) {
  background-color: transparent !important;
  padding: 0 !important;
}

.alert {
  border-radius: 0 !important;
  border: 1px solid ${p.border} !important;
  padding: 3px 8px !important;
  margin: 0 0 4px 0 !important;
  font-size: 12px !important;
}
html body .alert.bg-danger, html body .alert-danger.text-center,
html body .bg-danger.text-center {
  background-color: ${p.danger} !important;
  border: 1px solid ${p.danger} !important;
  color: #FFFFFF !important;
  font-weight: bold !important;
  letter-spacing: 1px !important;
}
html body .alert.bg-danger *, html body .bg-danger.text-center * { color: #FFFFFF !important; }

.sidebar, .sidebar-wrapper {
  border-right: 1px solid ${p.border} !important;
  padding: 2px !important;
}

html body .sidebar, html body .sidebar *, html body .sidebar-wrapper, html body .sidebar-wrapper *,
html body .sidebar-submenu, html body .sidebar-submenu *,
html body .menu-collapsed, html body .menu-collapsed *,
html body .collapse.sidebar-submenu, html body .collapse.sidebar-submenu.bg-dark,
html body .collapse.show.sidebar-submenu, html body .collapse.show.sidebar-submenu.bg-dark {
  background-color: ${p.panel} !important;
  background-image: none !important;
  color: ${p.text} !important;
}

html body .sidebar i, html body .sidebar svg, html body .sidebar .material-icons,
html body .sidebar-submenu i, html body .sidebar-submenu svg {
  background-color: transparent !important;
  background-image: none !important;
  width: auto !important;
  height: auto !important;
}

html body .sidebar-submenu {
  border: none !important;
  border-left: 1px solid ${p.border} !important;
  margin: 0 2px 2px 18px !important;
  padding: 1px 0 !important;
}

html body .sidebar .nav-link, html body .sidebar-submenu .nav-link,
html body .dropdown-item {
  color: ${p.text} !important;
  background-color: transparent !important;
  text-decoration: none !important;
  padding: 2px 8px !important;
  border: 1px solid transparent !important;
  font-size: 12px !important;
  min-height: 0 !important;
  margin: 0 !important;
  opacity: 1 !important;
}
html body .sidebar-submenu .nav-link {
  border: none !important;
  padding-left: 14px !important;
}
html body .sidebar .nav-link p, html body .sidebar-submenu .nav-link p {
  color: ${p.text} !important;
  margin: 0 !important;
  font-size: 12px !important;
}

html body .dropdown-item:hover {
  background-color: ${p.hover} !important;
}
html body .sidebar .nav-link:hover, html body .sidebar-submenu .nav-link:hover,
html body .sidebar .nav-link:focus, html body .sidebar-submenu .nav-link:focus,
html body .sidebar .nav-link:hover *, html body .sidebar-submenu .nav-link:hover *,
html body .sidebar .nav-link:focus *, html body .sidebar-submenu .nav-link:focus *,
html body .sidebar .nav-link:hover i, html body .sidebar .nav-link:hover p,
html body .sidebar .nav-link:hover span {
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}
html body .sidebar .nav-link:hover, html body .sidebar .nav-link:hover *,
html body .sidebar-submenu .nav-link:hover, html body .sidebar-submenu .nav-link:hover *,
html body .sidebar .nav-link:focus, html body .sidebar .nav-link:focus *,
html body .dropdown-item:hover, html body .dropdown-item:hover * {
  color: ${p.text} !important;
  text-decoration: none !important;
}

html body .sidebar .nav-item.active > .nav-link, html body .sidebar .nav-link.active,
html body .sidebar-submenu .nav-link.active, html body .dropdown-item.active {
  background-color: ${p.sel} !important;
  color: ${p.text} !important;
  border: 1px solid ${p.selBorder} !important;
  font-weight: bold !important;
}
html body .sidebar .nav-item.active > .nav-link *, html body .sidebar .nav-link.active *,
html body .sidebar-submenu .nav-link.active * {
  color: ${p.text} !important;
  background-color: transparent !important;
}
html body .sidebar-submenu .nav-link.active { border: none !important; }

.sidebarFactionLogo, .sidebarFactionLogo img { background: transparent !important; }

.nav-tabs, .nav-pills {
  border-bottom: 1px solid ${p.border} !important;
  padding: 0 !important;
  margin: 0 0 6px 0 !important;
}
.nav-tabs .nav-link, .nav-pills .nav-link {
  background-color: ${p.header} !important;
  color: ${p.text} !important;
  border: 1px solid ${p.border} !important;
  border-bottom: none !important;
  padding: 2px 12px !important;
  margin: 0 2px 0 0 !important;
  font-size: 12px !important;
  text-transform: none !important;
  min-height: 0 !important;
}
.nav-tabs .nav-link.active, .nav-pills .nav-link.active {
  background-color: ${p.panel} !important;
  font-weight: bold !important;
  border-bottom: 1px solid ${p.panel} !important;
}
.nav-tabs .nav-link *, .nav-pills .nav-link * { color: inherit !important; }

table, .table, .table-bordered, .material-table {
  background-color: ${p.row} !important;
  border: 1px solid ${p.border} !important;
  border-collapse: collapse !important;
  width: 100% !important;
  font-size: 12px !important;
  margin-bottom: 6px !important;
}

th, td, .table > :not(caption) > * > * {
  background-color: ${p.row} !important;
  color: ${p.text} !important;
  border: 1px solid ${p.borderLite} !important;
  padding: 2px 5px !important;
  vertical-align: middle !important;
}

thead th, th {
  background-color: ${p.header} !important;
  font-weight: bold !important;
  white-space: nowrap !important;
}

tbody tr:nth-child(even) > td { background-color: ${p.zebra} !important; }
tbody tr:hover > td { background-color: ${p.hover} !important; }

.fa, .fas, .far, .fal, .fab, .fad,
.fa-solid, .fa-regular, .fa-brands,
[class^="fa-"], [class*=" fa-"] {
  font-family: "Font Awesome 5 Free", "Font Awesome 5 Pro", "Font Awesome 5 Brands",
    "Font Awesome 6 Free", "Font Awesome 6 Brands", "FontAwesome" !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: auto !important;
  line-height: 1 !important;
  background-image: revert !important;
}

.fa, .fas, .fa-solid { font-weight: 900 !important; }
.far, .fa-regular, .fal, .fab, .fa-brands { font-weight: 400 !important; }

.material-icons, .material-icons-outlined, .material-symbols-outlined {
  font-family: "Material Icons", "Material Icons Outlined", "Material Symbols Outlined" !important;
  font-weight: normal !important;
  font-style: normal !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  word-wrap: normal !important;
  white-space: nowrap !important;
  direction: ltr !important;
  font-feature-settings: "liga" !important;
  -webkit-font-feature-settings: "liga" !important;
  -webkit-font-smoothing: antialiased !important;
  text-rendering: optimizeLegibility !important;
  line-height: 1 !important;
}

${ICON_SEL} { color: inherit !important; }
svg { fill: currentColor !important; }
.icon-bar, .navbar-toggler-icon { background-image: revert !important; }
.uploadIcon { cursor: pointer !important; color: ${p.link} !important; }
img { filter: none !important; }

button:not(.note-color-btn), .btn:not(.note-color-btn), input[type="button"], input[type="submit"], input[type="reset"] {
  background-color: ${p.btnFace} !important;
  background-image: none !important;
  color: ${p.text} !important;
  border: 1px solid ${p.border} !important;
  box-sizing: border-box !important;
  height: 22px !important;
  min-height: 22px !important;
  max-height: 22px !important;
  line-height: 18px !important;
  padding: 0 10px !important;
  margin: 1px !important;
  font-size: 12px !important;
  font-weight: normal !important;
  text-transform: none !important;
  width: auto !important;
  vertical-align: middle !important;
}
button:hover, .btn:hover { background-color: ${p.btnHover} !important; }
button:active, .btn:active { background-color: ${p.btnActive} !important; }
button i, .btn i, button .material-icons, .btn .material-icons {
  color: inherit !important;
  font-size: 12px !important;
  vertical-align: middle !important;
  background-color: transparent !important;
}

.btn.px-5, .btn.px-4, .btn.p-1, .btn.btn-lg, .btn.btn-block, .btn-group.d-block {
  padding: 0 10px !important;
  width: auto !important;
  display: inline-block !important;
}
.btn-group, .btn-group.d-block, .btn-group.mt-0 {
  display: inline-flex !important;
  vertical-align: middle !important;
  margin: 1px !important;
}

.close, .btn.close, button.close,
.btn-collapse, .btn.btn-collapse, .btn.btn-collapse.btn-primary,
.remove_button, .btn.btn-sm, .btn-xs {
  height: 17px !important;
  min-height: 17px !important;
  max-height: 17px !important;
  line-height: 14px !important;
  padding: 0 4px !important;
  min-width: 17px !important;
  font-size: 11px !important;
  opacity: 1 !important;
  float: none !important;
  background-color: ${p.btnFace} !important;
  color: ${p.text} !important;
  border: 1px solid ${p.border} !important;
}
.close span, .btn.close span, .close i, .btn-collapse i {
  font-size: 11px !important;
  line-height: 14px !important;
  color: ${p.text} !important;
}

input:not([type="file"]):not([type="checkbox"]):not([type="radio"]),
select, textarea, .form-control, .form-select,
.input-group-text, .input-group-addon, .bootstrap-select .dropdown-toggle {
  background-color: ${p.field} !important;
  background-image: none !important;
  color: ${p.text} !important;
  border: 1px solid ${p.fieldBorder} !important;
  box-sizing: border-box !important;
  height: 22px !important;
  min-height: 22px !important;
  line-height: 18px !important;
  padding: 0 4px !important;
  margin: 1px !important;
  font-size: 12px !important;
  vertical-align: middle !important;
}
textarea, textarea.form-control { height: auto !important; min-height: 44px !important; padding: 2px 4px !important; }
.input-group-text, .input-group-addon { background-color: ${p.header} !important; border-color: ${p.border} !important; }
.input-group { display: inline-flex !important; align-items: center !important; width: auto !important; margin: 1px !important; }
.input-group .form-control { margin: 0 !important; }
input::placeholder, textarea::placeholder { color: ${p.textMuted} !important; }

.bmd-form-group, .form-group.bmd-form-group { padding-top: 0 !important; margin: 0 !important; }
.bmd-label-floating, .bmd-label-static, .form-control ~ .bmd-label-static {
  position: static !important;
  color: ${p.text} !important;
  font-size: 12px !important;
  transform: none !important;
}

.modal-dialog {
  margin: 24px auto !important;
  max-width: min(960px, calc(100vw - 32px)) !important;
}
.modal-content {
  background-color: ${p.panel} !important;
  border: 1px solid ${p.border} !important;
  display: flex !important;
  flex-direction: column !important;
  max-height: calc(100vh - 48px) !important;
  overflow: hidden !important;
}
.modal-header, .modal-footer { flex: 0 0 auto !important; }
.modal-body {
  flex: 1 1 auto !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  min-height: 0 !important;
}
.modal-body > *, .modal-body .row, .modal-body [class*="col-"] {
  max-width: 100% !important;
}
.modal-header {
  background-color: ${p.titlebar} !important;
  border-bottom: 1px solid ${p.border} !important;
  padding: 3px 6px !important;
  min-height: 0 !important;
}
.modal-header, .modal-header .modal-title, .modal-header .modal-title *,
.modal-header > *:not(.close) { color: ${p.titlebarText} !important; }

.modal-content { position: relative !important; }
.modal-header { position: relative !important; padding-right: 28px !important; }
.modal-header .close, .modal-header button.close,
.modal-content > .close, .modal-content > button.close {
  position: absolute !important;
  top: 2px !important;
  right: 3px !important;
  margin: 0 !important;
  float: none !important;
  z-index: 5 !important;
  color: ${p === PALETTES.aerodark || p === PALETTES.aerolapd ? '#FF6B6B' : '#C00000'} !important;
  background-color: ${p.btnFace} !important;
  border: 1px solid ${p.border} !important;
  font-weight: bold !important;
  text-shadow: none !important;
}
.modal-header .close span, .modal-header button.close span,
.modal-header .close i, .modal-content > .close span, .modal-content > .close i {
  color: ${p === PALETTES.aerodark || p === PALETTES.aerolapd ? '#FF6B6B' : '#C00000'} !important;
  font-weight: bold !important;
}
.modal-body { background-color: ${p.panel} !important; padding: 8px !important; }

.modal-body select, .modal-body .form-control, .modal-body .custom-select,
.modal-body input:not([type="file"]):not([type="checkbox"]):not([type="radio"]),
.modal-body .bootstrap-select > .dropdown-toggle, .modal-body .input-group-text {
  height: 21px !important;
  min-height: 21px !important;
  max-height: 21px !important;
  line-height: 19px !important;
  padding: 0 6px !important;
  font-size: 12px !important;
  box-sizing: border-box !important;
  vertical-align: middle !important;
  margin: 1px 2px 1px 0 !important;
  float: none !important;
  border-radius: 0 !important;
}
.modal-body .btn { margin: 1px 2px 1px 0 !important; }

html body .btn, html body button.btn, html body a.btn, html body .btn-group > .btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
  height: auto !important;
  min-height: 21px !important;
  max-height: none !important;
  padding: 2px 8px !important;
  line-height: 15px !important;
  font-size: 12px !important;
  white-space: nowrap !important;
  vertical-align: middle !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  border-radius: 0 !important;
}
html body .btn > i, html body .btn > span, html body .btn > svg,
html body .btn > .material-icons, html body .btn > b, html body .btn > small {
  position: static !important;
  flex: 0 0 auto !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 15px !important;
  vertical-align: middle !important;
}
html body .btn .caret, html body .dropdown-toggle .caret,
html body .btn::after, html body .dropdown-toggle::after {
  position: static !important;
  float: none !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  left: auto !important;
  transform: none !important;
  margin: 0 0 0 2px !important;
  flex: 0 0 auto !important;
}
html body .btn-group, html body .btn-group-vertical {
  overflow: visible !important;
}
html body .dropdown-menu { z-index: 1600 !important; }
html body .ps__rail-x, html body .ps__rail-y,
html body .ps__thumb-x, html body .ps__thumb-y {
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
}
.modal-body .btn i, .modal-body .btn .material-icons, .modal-body .btn svg {
  font-size: 12px !important;
  line-height: 19px !important;
  vertical-align: middle !important;
  margin: 0 2px 0 0 !important;
}
.modal-body .row, .modal-body .form-row, .modal-body .form-inline,
.modal-body .input-group, .modal-body .btn-group {
  align-items: center !important;
  row-gap: 2px !important;
}
.modal-body .position-absolute:not(.btn-collapse):not(.close) {
  position: static !important;
  float: none !important;
}
.modal-body .card-header {
  min-height: 23px !important;
}
html body .modal[data-mdt-vanilla="1"] .btn {
  display: inline-block !important;
  min-height: 0 !important;
  white-space: nowrap !important;
  vertical-align: middle !important;
}
html body .modal[data-mdt-vanilla="1"] .btn > i,
html body .modal[data-mdt-vanilla="1"] .btn > span,
html body .modal[data-mdt-vanilla="1"] .btn > b,
html body .modal[data-mdt-vanilla="1"] .btn > small,
html body .modal[data-mdt-vanilla="1"] .btn > .material-icons {
  position: static !important;
  flex: none !important;
}
html body .modal[data-mdt-vanilla="1"] .row,
html body .modal[data-mdt-vanilla="1"] .form-row,
html body .modal[data-mdt-vanilla="1"] .form-inline,
html body .modal[data-mdt-vanilla="1"] .input-group,
html body .modal[data-mdt-vanilla="1"] .btn-group {
  align-items: initial !important;
  row-gap: 0 !important;
}
html body .modal[data-mdt-vanilla="1"] .position-absolute:not(.btn-collapse):not(.close) {
  position: absolute !important;
  float: none !important;
}
html body .modal[data-mdt-vanilla="1"] .card-header {
  min-height: 0 !important;
}
.modal-body .badge, .modal-body .badge-danger, .modal-body .badge-primary {
  display: inline-block !important;
  line-height: 15px !important;
  padding: 0 5px !important;
  vertical-align: middle !important;
}
.modal-footer {
  background-color: ${p.panel} !important;
  border-top: 1px solid ${p.border} !important;
  padding: 4px 6px !important;
}
.modal-backdrop, .modal-backdrop.show { background-color: #000000 !important; }

.modal:not([data-mdt-vanilla="1"]) .modal-body .card,
.modal:not([data-mdt-vanilla="1"]) .modal-body .card-body {
  overflow: visible !important;
  max-width: 100% !important;
  margin: 0 0 4px 0 !important;
  padding: 2px !important;
}
.modal[data-mdt-vanilla="1"] .modal-body .card,
.modal[data-mdt-vanilla="1"] .modal-body .card-body {
  max-width: 100% !important;
}
.modal-body select, .modal-body .dropdown-toggle { max-width: 100% !important; }
.modal:not([data-mdt-vanilla="1"]) .modal-body .bootstrap-select {
  max-width: 100% !important;
  width: auto !important;
}

.note-editor, .note-editor.note-frame, .note-frame, .summernote, .CodeMirror {
  background-color: ${p.field} !important;
  border: 1px solid ${p.fieldBorder} !important;
  margin: 0 0 4px 0 !important;
  max-width: 100% !important;
}
.note-toolbar, .note-toolbar.panel-heading, .note-editor .panel-heading {
  background-color: ${p.header} !important;
  background-image: none !important;
  border-bottom: 1px solid ${p.border} !important;
  color: ${p.text} !important;
  padding: 2px !important;
}
.note-editing-area, .note-editable, .note-codable {
  background-color: ${p.field} !important;
  background-image: none !important;
  color: ${p.text} !important;
}
.note-editable *, .note-editable p, .note-editable span, .note-editable div {
  background-color: transparent !important;
  color: ${p.text} !important;
}
.note-editable, .note-codable {
  min-height: 120px !important;
  max-height: 260px !important;
  overflow-y: auto !important;
  padding: 4px 6px !important;
}
.note-placeholder {
  color: ${p.textMuted} !important;
  background: transparent !important;
  background-color: transparent !important;
  opacity: 1 !important;
}
.note-statusbar, .note-resizebar {
  background-color: ${p.header} !important;
  border-top: 1px solid ${p.border} !important;
}
.note-btn:not(.note-color-btn), .note-editor .btn:not(.note-color-btn) { background-color: ${p.btnFace} !important; color: ${p.text} !important; border: 1px solid ${p.border} !important; }
html body .note-editor .note-color .note-dropdown-menu,
html body .note-editor .note-dropdown-menu:has(.note-color-palette) {
  min-width: 336px !important;
  width: auto !important;
  max-height: none !important;
  white-space: nowrap !important;
  overflow: visible !important;
}
html body .note-editor .note-color-btn[data-mdt-swatch] {
  background-image: none !important;
}
html body .note-editor input[type="color"] {
  -webkit-appearance: auto !important;
  appearance: auto !important;
  width: 100% !important;
  height: 20px !important;
  min-height: 20px !important;
  max-height: 20px !important;
  padding: 0 !important;
  background: none !important;
}

html body .note-editor .note-toolbar,
html body .note-toolbar.card-header {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 2px !important;
  width: auto !important;
  min-height: 0 !important;
  height: auto !important;
  margin: 0 !important;
  padding: 3px !important;
  position: static !important;
  text-align: left !important;
  overflow: visible !important;
}
html body .note-toolbar .note-btn-group,
html body .note-toolbar .btn-group {
  display: inline-flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  gap: 1px !important;
  width: auto !important;
  max-width: none !important;
  min-height: 0 !important;
  margin: 0 2px 0 0 !important;
  padding: 0 !important;
  float: none !important;
  clear: none !important;
  position: relative !important;
  vertical-align: middle !important;
}
html body .note-toolbar .note-btn,
html body .note-toolbar .btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-sizing: border-box !important;
  width: auto !important;
  min-width: 24px !important;
  height: 22px !important;
  min-height: 22px !important;
  margin: 0 !important;
  padding: 0 5px !important;
  float: none !important;
  font-size: 11px !important;
  line-height: 20px !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
html body .note-toolbar .note-btn > i,
html body .note-toolbar .note-btn > span {
  display: inline-block !important;
  margin: 0 !important;
  color: ${p.text} !important;
  font-size: 11px !important;
  line-height: 20px !important;
}
html body .note-editor .note-toolbar .note-btn-group > button.note-btn,
html body .note-editor .note-toolbar .btn-group > button.btn {
  background: linear-gradient(${p.panelAlt}, ${p.btnFace}) !important;
  border-color: ${p.border} !important;
  color: ${p.text} !important;
  -webkit-text-fill-color: ${p.text} !important;
  text-shadow: none !important;
  opacity: 1 !important;
  box-shadow: inset 0 1px 0 ${p.field} !important;
}
html body .note-editor .note-toolbar .note-btn-group > button.note-btn:hover,
html body .note-editor .note-toolbar .btn-group > button.btn:hover {
  background: ${p.btnHover} !important;
  border-color: ${p.fieldBorder} !important;
}
html body .note-editor .note-toolbar .note-btn-group > button.note-btn:is(.active, :active, [aria-pressed="true"]),
html body .note-editor .note-toolbar .btn-group > button.btn:is(.active, :active, [aria-pressed="true"]) {
  background: ${p.btnActive} !important;
  box-shadow: inset 0 1px 3px rgba(0,0,0,.3) !important;
}
html body .note-editor .note-toolbar .note-btn-group > button.note-btn:focus-visible,
html body .note-editor .note-toolbar .btn-group > button.btn:focus-visible { outline: 1px solid ${p.fieldBorder} !important; outline-offset: 1px !important; }
html body .note-editor .note-toolbar .note-btn-group > button.note-btn > :is(i, span):not(.note-recent-color),
html body .note-editor .note-toolbar .btn-group > button.btn > :is(i, span):not(.note-recent-color) {
  color: ${p.text} !important;
  -webkit-text-fill-color: ${p.text} !important;
  text-shadow: none !important;
}
html body .note-editor .note-toolbar button:disabled { opacity: .5 !important; }
html body .note-toolbar .note-current-fontname {
  max-width: 96px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
html body .note-editor .note-dropdown-menu {
  display: none;
  position: absolute !important;
  top: 100% !important;
  left: 0 !important;
  box-sizing: border-box !important;
  min-width: 150px !important;
  max-height: 260px !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  margin: 0 !important;
  padding: 3px !important;
  background-color: ${p.panel} !important;
  border: 1px solid ${p.border} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  z-index: 2100 !important;
}
html body .note-editor .note-btn-group.open > .note-dropdown-menu,
html body .note-editor .note-dropdown-menu.show {
  display: block !important;
}
html body .note-editor .note-dropdown-menu > .dropdown-item {
  display: block !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 2px 6px !important;
  color: ${p.text} !important;
  font-size: 11px !important;
  line-height: 16px !important;
  white-space: nowrap !important;
}
html body .note-editor .note-dropdown-menu > .dropdown-item:hover {
  background-color: ${p.sel} !important;
  color: #FFFFFF !important;
}
html body .note-editor .note-dropdown-menu > .dropdown-item * {
  color: inherit !important;
  margin: 0 !important;
}
html body .note-editor .note-dropdown-menu .note-palette {
  display: inline-block !important;
  width: 150px !important;
  margin: 0 2px 0 0 !important;
  padding: 2px !important;
  vertical-align: top !important;
}
html body .note-editor .note-palette-title {
  margin: 0 0 2px 0 !important;
  padding: 0 !important;
  color: ${p.text} !important;
  font-size: 10px !important;
  font-weight: bold !important;
  text-align: center !important;
}
html body .note-editor .note-color-palette {
  display: block !important;
  margin: 2px 0 !important;
}
html body .note-editor .note-color-row {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  gap: 1px !important;
  height: auto !important;
  margin: 0 0 1px 0 !important;
}
html body .note-editor .note-color-btn {
  display: block !important;
  box-sizing: border-box !important;
  width: 16px !important;
  height: 16px !important;
  min-width: 16px !important;
  margin: 0 !important;
  padding: 0 !important;
  background-image: none !important;
  border: 1px solid ${p.border} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
html body .note-editor .note-color-reset,
html body .note-editor .note-color-select {
  display: block !important;
  width: 100% !important;
  height: 20px !important;
  margin: 2px 0 !important;
  padding: 0 4px !important;
  background-color: ${p.btnFace} !important;
  color: ${p.text} !important;
  border: 1px solid ${p.border} !important;
  font-size: 10px !important;
  line-height: 18px !important;
}
html body .note-editor .note-holder-custom { display: none !important; }
html body .note-editor .note-dimension-picker { position: relative !important; }
html body .note-editor.note-frame .note-editing-area,
html body .note-editor.note-frame .note-editing-area > .note-editable,
html body .note-editor.note-frame .note-editing-area > .note-codable {
  background-color: ${p.field} !important;
  color: ${p.text} !important;
}

html.mdt-lookup .tab-content .tab-pane > .row,
html.mdt-lookup .tab-content .tab-pane .row.justify-content-center {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}
html.mdt-lookup .tab-content .tab-pane .row > [class*="col-"] {
  box-sizing: border-box !important;
  flex: 0 0 320px !important;
  width: 320px !important;
  max-width: 320px !important;
  margin: 0 auto !important;
  padding: 0 !important;
  text-align: center !important;
}
html.mdt-lookup .tab-content .tab-pane .form-group,
html.mdt-lookup .tab-content .tab-pane .bmd-form-group {
  width: 100% !important;
  margin: 0 0 6px 0 !important;
  padding: 0 !important;
}
html.mdt-lookup .tab-content .tab-pane .input-group {
  display: flex !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  width: 100% !important;
  margin: 0 !important;
}
html.mdt-lookup .tab-content .tab-pane .input-group > .form-control {
  flex: 1 1 auto !important;
  width: auto !important;
  min-width: 0 !important;
  margin: 0 !important;
}
html.mdt-lookup .tab-content .tab-pane .input-group-prepend,
html.mdt-lookup .tab-content .tab-pane .input-group-text {
  flex: 0 0 auto !important;
  margin: 0 !important;
}
html.mdt-lookup .tab-content .tab-pane .btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 auto !important;
  float: none !important;
}

.card-license {
  background-color: ${p.panel} !important;
  border: 1px solid ${p.border} !important;
  padding: 4px 6px !important;
  margin: 0 0 4px 0 !important;
  overflow: visible !important;
}
.card-license span[name="licenseStatus"] {
  display: block !important;
  width: 100% !important;
  box-sizing: border-box !important;
  text-align: center !important;
  padding: 1px 4px !important;
  margin: 2px 0 !important;
}
.card-license .card-footer, .card-license .card-body > div:last-child,
.card-license > div:last-child {
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
  background-color: transparent !important;
  border: none !important;
  padding: 2px 0 0 0 !important;
  margin: 0 !important;
  text-align: center !important;
}
.card-license .btn, .card-license .btn-group, .card-license .dropdown,
.card-license .dropup, .card-license button {
  position: static !important;
  float: none !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  left: auto !important;
  transform: none !important;
  margin: 0 !important;
  vertical-align: middle !important;
}
.card-license .btn-group, .card-license .dropdown, .card-license .dropup {
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  width: auto !important;
  max-width: none !important;
  flex: 0 0 auto !important;
}
.card-license .btn-block, .card-license .d-block, .card-license .btn.btn-block,
.card-license .btn.d-block, .card-license .w-100 {
  display: inline-flex !important;
  width: auto !important;
  max-width: none !important;
}

html body .dataTables_length, html body div[id$="_length"] {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  margin: 2px 0 !important;
  padding: 0 !important;
  float: none !important;
}
html body .dataTables_length label, html body div[id$="_length"] label {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  margin: 0 !important;
  padding: 0 !important;
  font-weight: normal !important;
  font-size: 12px !important;
  white-space: nowrap !important;
}
html body .dataTables_length select, html body div[id$="_length"] select,
html body select[name$="_length"], html body .dataTables_length .custom-select,
html body .dataTables_length .form-control, html body .dataTables_length .bmd-form-group {
  display: inline-block !important;
  box-sizing: border-box !important;
  width: auto !important;
  min-width: 46px !important;
  max-width: 72px !important;
  height: 21px !important;
  min-height: 21px !important;
  max-height: 21px !important;
  line-height: 19px !important;
  padding: 0 4px !important;
  margin: 0 2px !important;
  font-size: 12px !important;
  text-align: left !important;
  vertical-align: middle !important;
  background-color: ${p.field} !important;
  color: ${p.text} !important;
  border: 1px solid ${p.fieldBorder} !important;
}
html body .dataTables_length .bmd-form-group { border: none !important; padding: 0 !important; }

html body .modal .modal-body [data-mdt-crow="1"] select,
html body .modal .modal-body [data-mdt-crow="1"] .form-control,
html body .modal .modal-body [data-mdt-crow="1"] .bootstrap-select > .dropdown-toggle,
html body .modal .modal-body [data-mdt-crow="1"] .btn,
html body .modal .modal-body [data-mdt-crow="1"] button {
  height: 21px !important;
  min-height: 21px !important;
  max-height: 21px !important;
  line-height: 19px !important;
  margin: 0 !important;
  padding: 0 6px !important;
  font-size: 12px !important;
  box-sizing: border-box !important;
  vertical-align: middle !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}
html body .modal .modal-body [data-mdt-crow="1"] .btn > i,
html body .modal .modal-body [data-mdt-crow="1"] .btn > span,
html body .modal .modal-body [data-mdt-crow="1"] .btn > .material-icons {
  position: static !important;
  margin: 0 !important;
  line-height: 19px !important;
  font-size: 12px !important;
}
html body .modal .modal-body [data-mdt-crow="1"] .bootstrap-select,
html body .modal .modal-body [data-mdt-crow="1"] select {
  width: 100% !important;
  min-width: 90px !important;
}
html body .modal .modal-body [data-mdt-crow="1"] .bootstrap-select > .dropdown-toggle {
  width: 100% !important;
  min-width: 90px !important;
  text-align: left !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
html body .modal .modal-body [data-mdt-cbtn="1"] .btn,
html body .modal .modal-body [data-mdt-cbtn="1"] button {
  height: 21px !important;
  min-height: 21px !important;
  max-height: 21px !important;
  min-width: 24px !important;
  padding: 0 5px !important;
  margin: 0 !important;
  line-height: 19px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.ps-scrollbar-x-rail, .ps-scrollbar-y-rail,
.ps-scrollbar-x, .ps-scrollbar-y {
  display: none !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
}
html body .main-panel.ps-container::-webkit-scrollbar { width: 8px !important; height: 8px !important; }
.main-panel.ps-container {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  scrollbar-gutter: stable;
}
.ps-container, .modal-scroll {
  overflow-x: hidden !important;
  overflow-y: auto !important;
  -ms-overflow-style: auto !important;
}

html body .modal .modal-content {
  display: flex !important;
  flex-direction: column !important;
  max-height: calc(100vh - 36px) !important;
}
html body .modal .modal-body {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  max-height: none !important;
}

html body .modal .modal-body .form-group.row.col-12 {
  display: grid !important;
  grid-template-columns: minmax(0, 5fr) minmax(0, 3fr) minmax(0, 3fr) 28px !important;
  gap: 5px !important;
  align-items: center !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 0 5px 0 !important;
  padding: 0 !important;
  float: none !important;
}
html body .modal .modal-body .form-group.row.col-12 > .input-group {
  display: flex !important;
  flex-wrap: nowrap !important;
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}
html body .modal .modal-body .form-group.row.col-12 .input-group-prepend {
  flex: 0 0 auto !important;
  margin: 0 !important;
}
html body .modal .modal-body .form-group.row.col-12 .input-group-text {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 24px !important;
  min-width: 24px !important;
  padding: 0 5px !important;
  margin: 0 !important;
  border-radius: 0 !important;
}
html body .modal .modal-body .form-group.row.col-12 .bootstrap-select {
  flex: 1 1 auto !important;
  width: auto !important;
  min-width: 0 !important;
  height: 24px !important;
  margin: 0 !important;
  padding: 0 !important;
  float: none !important;
}
html body .modal .modal-body .form-group.row.col-12 .bootstrap-select > .btn,
html body .modal .modal-body .form-group.row.col-12 .btn-charge {
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
  height: 24px !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 16px 0 6px !important;
  font-size: 11px !important;
  text-align: left !important;
  overflow: hidden !important;
}
html body .modal .modal-body .form-group.row.col-12 .filter-option,
html body .modal .modal-body .form-group.row.col-12 .filter-option-inner,
html body .modal .modal-body .form-group.row.col-12 .filter-option-inner-inner {
  overflow: hidden !important;
  white-space: nowrap !important;
  text-overflow: ellipsis !important;
  text-align: left !important;
}
html body .modal .modal-body .form-group.row.col-12 > .col-1 {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: auto !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
  flex: 0 0 auto !important;
}
html body .modal .modal-body .remove_button {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 26px !important;
  height: 24px !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}
html body .modal .modal-body .remove_button i {
  margin: 0 !important;
  font-size: 12px !important;
}

html body .modal .modal-body .chargeWrapper {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  justify-content: flex-start !important;
  gap: 0 !important;
  width: 100% !important;
  margin: 0 0 6px 0 !important;
  position: relative !important;
  float: none !important;
  clear: both !important;
  z-index: 1 !important;
  height: auto !important;
  min-height: 34px !important;
  max-height: none !important;
  overflow: visible !important;
  border: 1px solid ${p.border} !important;
  background-color: ${p.panelAlt} !important;
  padding: 5px !important;
}
html body .modal .modal-body .chargeWrapper + * {
  clear: both !important;
  position: relative !important;
}
html body .modal .modal-body .chargeWrapper > * {
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 100% !important;
  flex: 0 0 auto !important;
  margin: 0 0 4px 0 !important;
}
html body .modal .modal-body .chargeWrapper > *:last-child {
  margin-bottom: 0 !important;
}
html body .modal .modal-body .chargeWrapper .row,
html body .modal .modal-body .chargeWrapper .input-group,
html body .modal .modal-body .chargeWrapper .form-group,
html body .modal .modal-body .chargeWrapper .bmd-form-group {
  display: flex !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  gap: 4px !important;
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}
html body .modal .modal-body .chargeWrapper .bootstrap-select,
html body .modal .modal-body .chargeWrapper .form-control,
html body .modal .modal-body .chargeWrapper select {
  flex: 1 1 0 !important;
  min-width: 0 !important;
  width: auto !important;
  margin: 0 !important;
}
html body .modal .modal-body .chargeWrapper .btn,
html body .modal .modal-body .chargeWrapper .remove_button,
html body .modal .modal-body .chargeWrapper .input-group-addon,
html body .modal .modal-body .chargeWrapper .input-group-append,
html body .modal .modal-body .chargeWrapper .input-group-prepend {
  flex: 0 0 auto !important;
  width: auto !important;
  max-width: none !important;
  margin: 0 !important;
}

html body .mdt-grip {
  position: absolute !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 16px !important;
  height: 16px !important;
  padding: 0 !important;
  margin: 0 !important;
  cursor: nwse-resize !important;
  touch-action: none !important;
  user-select: none !important;
  z-index: 12 !important;
  background-image: linear-gradient(135deg, transparent 0 42%, ${p.border} 42% 52%, transparent 52% 66%, ${p.border} 66% 76%, transparent 76%) !important;
  opacity: 0 !important;
}
html body .mdt-grip:hover, html body .mdt-grip[data-mdt-resizing="1"] { opacity: 1 !important; }
html body .modal-content,
html body .swal2-popup {
  position: relative !important;
}

html body .modal .modal-body .input-group-addon:has(> .form-group.row),
html body .modal .modal-body .input-group-addon:has(> .form-group.bmd-form-group),
html body .modal .modal-body .input-group-addon:has(> .input-group) {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  justify-content: flex-start !important;
  gap: 0 !important;
  width: 100% !important;
  margin: 0 0 6px 0 !important;
  position: relative !important;
  float: none !important;
  clear: both !important;
  height: auto !important;
  min-height: 34px !important;
  max-height: 190px !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  border: 1px solid ${p.border} !important;
  background-color: ${p.panelAlt} !important;
  padding: 5px !important;
}
html body .modal .modal-body .input-group-addon:has(> .form-group.row) > *,
html body .modal .modal-body .input-group-addon:has(> .form-group.bmd-form-group) > *,
html body .modal .modal-body .input-group-addon:has(> .input-group) > * {
  width: 100% !important;
  max-width: 100% !important;
  flex: 0 0 auto !important;
  margin: 0 0 4px 0 !important;
}

html body .modal .modal-body > .row > [class*="col-"] > .form-group,
html body .modal .modal-body > .row > [class*="col-"] > .bmd-form-group {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 4px !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: center !important;
}
html body .modal .modal-body > .row > [class*="col-"] > .form-group > h6,
html body .modal .modal-body > .row > [class*="col-"] > .bmd-form-group > h6 {
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: center !important;
  font-size: 11px !important;
  font-weight: bold !important;
}
html body .modal .modal-body > .row > [class*="col-"] .btn-group:not(.note-btn-group) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  float: none !important;
}
html body .modal .modal-body > .row > [class*="col-"] .btn-group:not(.note-btn-group) > .btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 24px !important;
  min-height: 24px !important;
  margin: 0 !important;
  padding: 0 12px !important;
  font-size: 11px !important;
  line-height: 22px !important;
}
html body .modal .modal-body > .row > [class*="col-"] .form-control:not(.note-editable),
html body .modal .modal-body > .row > [class*="col-"] .input-group {
  margin: 0 auto !important;
}

html body .modal .modal-body .note-toolbar {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 2px !important;
  width: auto !important;
  min-height: 0 !important;
  height: auto !important;
  margin: 0 !important;
  padding: 3px !important;
  position: static !important;
  text-align: left !important;
}
html body .modal .modal-body .note-toolbar .note-btn-group,
html body .modal .modal-body .note-toolbar .btn-group {
  display: inline-flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 1px !important;
  width: auto !important;
  max-width: none !important;
  min-height: 0 !important;
  margin: 0 2px 0 0 !important;
  padding: 0 !important;
  float: none !important;
  clear: none !important;
  position: relative !important;
}
html body .modal .modal-body .note-toolbar .note-btn,
html body .modal .modal-body .note-toolbar .btn-group > .btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: auto !important;
  min-width: 24px !important;
  height: 22px !important;
  min-height: 22px !important;
  margin: 0 !important;
  padding: 0 5px !important;
  font-size: 11px !important;
  line-height: 20px !important;
}

html body .modal .modal-body .input-group-addon:not(.chargeWrapper):not(:has(> .form-group.row)):not(:has(> .form-group.bmd-form-group)):not(:has(> .input-group)) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  margin: 0 0 4px 0 !important;
  padding: 0 !important;
}
html body .modal .modal-body .input-group-addon:not(.chargeWrapper) > .btn {
  display: inline-flex !important;
  align-items: center !important;
  width: auto !important;
  min-width: 0 !important;
  height: 24px !important;
  margin: 0 !important;
  padding: 0 12px !important;
}

html body .card.card-stats,
html body .card.card-dashboard {
  overflow: hidden !important;
  margin: 6px 0 !important;
}
html body .card.card-stats .card-header.card-header-icon,
html body .card.card-stats .card-header,
html body .card.card-dashboard .card-header.card-header-icon {
  position: relative !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 9px !important;
  margin: 0 !important;
  padding: 7px 10px !important;
  overflow: hidden !important;
}
html body .card.card-stats .card-header .card-icon,
html body .card.card-stats .card-header-icon .card-icon,
html body .card.card-dashboard .card-header .card-icon {
  position: static !important;
  float: none !important;
  transform: none !important;
  top: auto !important;
  left: auto !important;
  right: auto !important;
  bottom: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  width: 34px !important;
  height: 34px !important;
  min-width: 34px !important;
  max-width: 34px !important;
  flex: 0 0 34px !important;
  align-self: center !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
html body .card.card-stats .card-header .card-icon i,
html body .card.card-dashboard .card-header .card-icon i {
  font-size: 18px !important;
  line-height: 55px !important;
  margin: 0 !important;
}
html body .card.card-stats .card-header .card-title,
html body .card.card-stats .card-header h4 {
  flex: 0 0 auto !important;
  margin: 0 !important;
  padding: 0 !important;
  font-size: 13px !important;
  font-weight: bold !important;
  text-align: left !important;
}
html body .card.card-stats .card-header h6,
html body .card.card-stats .card-header h6.text-dark {
  flex: 0 1 auto !important;
  margin: 0 !important;
  padding: 0 !important;
  font-size: 11px !important;
  text-align: left !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  color: ${p.text} !important;
}

html body .leaflet-control-search {
  display: inline-flex !important;
  align-items: center !important;
  width: auto !important;
  margin: 8px !important;
  padding: 0 !important;
  background-color: ${p.panel} !important;
  border: 1px solid ${p.border} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
}
html body .leaflet-control-search > label.search-input {
  display: none !important;
}
html body .leaflet-control-search input.search-input {
  display: block !important;
  box-sizing: border-box !important;
  height: 22px !important;
  width: 230px !important;
  min-width: 0 !important;
  max-width: 230px !important;
  flex: 0 0 230px !important;
  margin: 0 !important;
  padding: 0 6px !important;
  background-color: ${p.field} !important;
  background-image: none !important;
  color: ${p.text} !important;
  border: none !important;
  border-right: 1px solid ${p.border} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  font-size: 11px !important;
  line-height: 22px !important;
}
html body .leaflet-control-search input.search-input::placeholder {
  color: ${p.textMuted} !important;
}
html body .leaflet-control-search a.search-button,
html body .leaflet-control-search a.search-cancel {
  display: flex !important;
  justify-content: center !important;
  box-sizing: border-box !important;
  width: 22px !important;
  height: 22px !important;
  min-width: 22px !important;
  flex: 0 0 22px !important;
  margin: 0 !important;
  padding: 0 !important;
  background-color: ${p.btnFace} !important;
  background-position: center center !important;
  background-repeat: no-repeat !important;
  background-size: 14px 14px !important;
  color: ${p.text} !important;
  border: none !important;
  border-left: 1px solid ${p.border} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  font-size: 12px !important;
  line-height: 22px !important;
  text-decoration: none !important;
}
html body .leaflet-control-search a.search-cancel span {
  display: block !important;
  margin: 0 !important;
}
html body .leaflet-control-search a.search-button:hover,
html body .leaflet-control-search a.search-cancel:hover {
  background-color: ${p.btnHover} !important;
}
html body .leaflet-control-search .search-tooltip {
  width: 246px !important;
  max-height: 220px !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow-y: auto !important;
  background-color: ${p.panel} !important;
  border: 1px solid ${p.border} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
html body .leaflet-control-search .search-tip {
  margin: 0 !important;
  padding: 3px 6px !important;
  background-color: ${p.panelAlt} !important;
  color: ${p.text} !important;
  border: none !important;
  border-bottom: 1px solid ${p.borderLite} !important;
  border-radius: 0 !important;
  font-size: 11px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
html body .leaflet-control-search .search-tip:hover,
html body .leaflet-control-search .search-tip-select {
  background-color: ${p.sel} !important;
  color: #FFFFFF !important;
}
html body .leaflet-control-search .search-alert {
  margin: 0 !important;
  padding: 2px 6px !important;
  background-color: ${p.dangerSoft} !important;
  color: ${p.dangerInk} !important;
  border-radius: 0 !important;
  font-size: 11px !important;
}

html body .dropdown-menu.dropdown-menu-scroll {
  display: block !important;
  box-sizing: border-box !important;
  min-width: 280px !important;
  max-width: 520px !important;
  max-height: 320px !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  margin: 0 !important;
  padding: 3px !important;
  background-color: ${p.panel} !important;
  border: 1px solid ${p.border} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  z-index: 2000 !important;
}
html body .dropdown-menu.dropdown-menu-scroll > .dropdown-item {
  display: flex !important;
  align-items: center !important;
  box-sizing: border-box !important;
  width: 100% !important;
  min-height: 20px !important;
  margin: 0 0 1px 0 !important;
  padding: 2px 6px !important;
  background-color: transparent !important;
  color: ${p.text} !important;
  border: none !important;
  border-radius: 0 !important;
  font-size: 11px !important;
  line-height: 16px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
html body .dropdown-menu.dropdown-menu-scroll > .dropdown-item:hover,
html body .dropdown-menu.dropdown-menu-scroll > .dropdown-item:focus,
html body .dropdown-menu.dropdown-menu-scroll > .dropdown-item.active {
  background-color: ${p.sel} !important;
  color: #FFFFFF !important;
}
html body .dropdown-menu.dropdown-menu-scroll > .dropdown-item > .badge {
  display: inline-block !important;
  width: auto !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 1px 8px !important;
  border-radius: 8px !important;
  font-size: 10px !important;
  line-height: 14px !important;
  white-space: nowrap !important;
}

input[type="file"] { all: revert !important; }

h3.characterDetailsName { font-size: 14px !important; font-weight: bold !important; }
.characterDetailsTitle, h4.characterDetailsTitle {
  background: transparent !important;
  border: 0 !important;
  color: ${p.text} !important;
  font-size: 11px !important;
  font-weight: bold !important;
  padding: 0 !important;
  margin: 0 !important;
}
.characterDetailsValue { font-size: 12px !important; color: ${p.text} !important; }

#cautionCodes .badge, .card-license span[name="licenseStatus"] {
  background-color: ${p.highlight} !important;
  border: 1px solid ${p.chipBorder} !important;
  color: ${p.text} !important;
}
#cautionCodes, #cautionCodes *, #cautionCodes .badge, #cautionCodes .badge * {
  color: ${p.text} !important;
}
#cautionCodes .btn, #cautionCodes button, #cautionCodes .close {
  height: 17px !important;
  min-height: 17px !important;
  max-height: 17px !important;
  min-width: 17px !important;
  padding: 0 4px !important;
  line-height: 14px !important;
  font-size: 11px !important;
  margin: 0 0 0 3px !important;
}

a { color: ${p.link} !important; text-decoration: underline !important; }
a:visited { color: ${p.visited} !important; }
.nav-link, .sidebar a, .dropdown-item, .navbar-brand, .btn, .close { text-decoration: none !important; }

.badge, .label, .tag {
  border: 1px solid ${p.chipBorder} !important;
  background-color: ${p.chip} !important;
  background-image: none !important;
  color: ${p.text} !important;
  font-size: 11px !important;
  font-weight: normal !important;
  padding: 0 4px !important;
  vertical-align: baseline !important;
}

html body .badge {
  display: inline-block !important;
  max-width: 100% !important;
  white-space: normal !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;
  line-height: 1.35 !important;
  vertical-align: baseline !important;
  box-sizing: border-box !important;
}
html body td .badge, html body li .badge {
  text-align: left !important;
}
html body td > ul, html body td > ul > li, html body td, html body th {
  max-width: 100% !important;
  overflow: visible !important;
  white-space: normal !important;
  overflow-wrap: break-word !important;
  box-sizing: border-box !important;
}
html body .table-responsive, html body .card-body .table {
  overflow-x: visible !important;
}

html body .alert:not([data-notify]), html body .alert-with-icon:not([data-notify]) {
  overflow: visible !important;
  display: flex !important;
  align-items: flex-start !important;
  gap: 6px !important;
}
html body .alert > i, html body .alert > .fa, html body .alert > .fas,
html body .alert > [class^="fa-"], html body .alert > [class*=" fa-"],
html body .alert i.material-icons, html body .alert-with-icon > i {
  position: static !important;
  top: auto !important;
  left: auto !important;
  flex: none !important;
  width: 14px !important;
  height: 14px !important;
  max-width: 14px !important;
  max-height: 14px !important;
  font-size: 13px !important;
  line-height: 15px !important;
  margin: 1px 4px 0 0 !important;
  padding: 0 !important;
  overflow: visible !important;
  vertical-align: top !important;
}
html body .alert > span, html body .alert > div, html body .alert > b {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  overflow-wrap: break-word !important;
}
html body .alert .close, html body .alert button.close {
  flex: none !important;
  margin-left: auto !important;
}

html body .badge-danger, html body .bg-danger, html body .btn-danger, html body .btn.btn-danger {
  background-color: ${p.danger} !important; color: ${p.dangerText} !important;
  border: 1px solid ${p.danger} !important; font-weight: bold !important;
}
html body .badge-danger *, html body .btn-danger * { color: ${p.dangerText} !important; }
.alert-danger { background-color: ${p.dangerSoft} !important; color: ${p.dangerInk} !important; border: 1px solid ${p.danger} !important; }
html body .text-danger, html body .text-danger * { color: ${p.dangerInk} !important; }

html body .badge-warning, html body .bg-warning, html body .btn-warning, html body .btn.btn-warning {
  background-color: ${p.warning} !important; color: ${p.warningText} !important;
  border: 1px solid ${p.warning} !important; font-weight: bold !important;
}
html body .badge-warning *, html body .btn-warning * { color: ${p.warningText} !important; }
.alert-warning { background-color: ${p.warningSoft} !important; color: ${p.warningInk} !important; border: 1px solid ${p.warning} !important; }
html body .text-warning, html body .text-warning * { color: ${p.warningInk} !important; }

html body .badge-success, html body .bg-success, html body .btn-success, html body .btn.btn-success {
  background-color: ${p.success} !important; color: ${p.successText} !important;
  border: 1px solid ${p.success} !important; font-weight: bold !important;
}
html body .badge-success *, html body .btn-success * { color: ${p.successText} !important; }
html body .badge > h6, html body .badge > p, html body .badge > div,
html body .badge > h1, html body .badge > h2, html body .badge > h3,
html body .badge > h4, html body .badge > h5 {
  display: inline-block !important;
  margin: 0 !important;
  padding: 0 !important;
  vertical-align: baseline !important;
  font-size: inherit !important;
  line-height: inherit !important;
  font-weight: inherit !important;
}
html body #warrant > .row, html body #warrantReason > .row {
  display: flex !important;
  flex-wrap: nowrap !important;
  align-items: flex-start !important;
}
html body #warrant .col-md-3, html body #warrantReason .col-md-3 {
  flex: 0 0 25% !important; max-width: 25% !important;
}
html body #warrant .col-md-4, html body #warrantReason .col-md-4 {
  flex: 0 0 33.333333% !important; max-width: 33.333333% !important;
}
html body #warrant .col-md-6, html body #warrantReason .col-md-6 {
  flex: 0 0 50% !important; max-width: 50% !important;
}
html body #warrant .col-md-8, html body #warrantReason .col-md-8 {
  flex: 0 0 66.666667% !important; max-width: 66.666667% !important;
}
html body #warrant .col-md-9, html body #warrantReason .col-md-9 {
  flex: 0 0 75% !important; max-width: 75% !important;
}
html body #warrant .text-right, html body #warrantReason .text-right {
  text-align: right !important;
}
html body textarea.summernote,
html body .summernote,
html body *:has(> .note-editor) > textarea,
html body .note-editor + textarea {
  display: none !important;
}
html body .note-editor textarea.note-codable,
html body .note-frame textarea.note-codable,
html body .note-editing-area > .note-codable {
  display: none !important;
}
html body .note-frame.codeview .note-codable,
html body .note-editor.codeview .note-codable {
  display: block !important;
}
html body .note-frame.codeview .note-editable,
html body .note-editor.codeview .note-editable {
  display: none !important;
}
html body .badge:has(.font-plate),
html body .badge:has([id^="vehiclePlateText"]),
html body .badge:has([id^="plateText"]) {
  background: #FFFFFF !important;
  background-image: none !important;
  background-color: #FFFFFF !important;
  color: #1A1D64 !important;
  border: none !important;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.25) !important;
  border-radius: 6px !important;
  padding: 4px 12px 6px !important;
  display: inline-block !important;
  text-align: center !important;
}
html body .badge:has(.font-plate) [id^="vehiclePlateText"],
html body .badge:has(.font-plate) [id^="plateText"],
html body .badge:has([id^="vehiclePlateText"]) [id^="vehiclePlateText"],
html body .badge:has([id^="plateText"]) [id^="plateText"] {
  color: #1A1D64 !important;
  font-size: 22px !important;
  font-weight: 700 !important;
  letter-spacing: 1px !important;
  display: block !important;
  line-height: 1.1 !important;
}
html body .badge:has(.font-plate) .font-plate,
html body .badge:has(.font-plate) .text-danger,
html body .badge:has(.font-plate) b,
html body .badge:has([id^="vehiclePlateText"]) .font-plate,
html body .badge:has([id^="vehiclePlateText"]) .text-danger,
html body .badge:has([id^="plateText"]) .font-plate,
html body .badge:has([id^="plateText"]) .text-danger {
  color: #D22B2B !important;
  background: transparent !important;
}
html body .badge:has(.font-plate) .badge-danger,
html body .badge:has([id^="vehiclePlateText"]) .badge-danger,
html body .badge:has([id^="plateText"]) .badge-danger {
  background-color: #D22B2B !important;
  border-color: #D22B2B !important;
  color: #D22B2B !important;
  min-width: 12px !important;
  min-height: 6px !important;
}
html body .badge:has(.font-plate) .font-plate,
html body .badge:has([id^="vehiclePlateText"]) .font-plate {
  font-size: 10px !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
}
html body .badge:has(.font-plate) > div,
html body .badge:has([id^="vehiclePlateText"]) > div {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  background: transparent !important;
  line-height: 1 !important;
}
html body .bg-white, html body .card.bg-white, html body .modal-content.bg-white,
html body .bg-light, html body .card.bg-light, html body .card-body.bg-white,
html body .card-header.bg-white, html body .jumbotron.bg-white {
  background-color: ${p.panel} !important;
  background-image: none !important;
  color: ${p.text} !important;
  border-color: ${p.fieldBorder} !important;
}
html body .bg-white > *:not(.badge):not(.btn):not(input):not(select):not(textarea),
html body .bg-light > *:not(.badge):not(.btn):not(input):not(select):not(textarea) {
  color: ${p.text} !important;
}
.alert-success { background-color: ${p.successSoft} !important; color: ${p.successInk} !important; border: 1px solid ${p.success} !important; }

html body div[data-notify="container"], html body .alert[data-notify] {
  --notice-edge: ${p.infoStrong};
  --notice-fill: ${p.info};
  --notice-ink: ${p.text};
  padding: 12px 40px 12px 48px !important;
  min-height: 58px !important;
  max-width: min(420px, calc(100vw - 32px)) !important;
  border: 1px solid var(--notice-edge) !important;
  border-left: 4px solid var(--notice-edge) !important;
  border-radius: 3px !important;
  background: var(--notice-fill) !important;
  color: var(--notice-ink) !important;
  box-shadow: 0 4px 14px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.6) !important;
  z-index: 3000 !important;
}
html body div[data-notify="container"].alert-success, html body .alert[data-notify].alert-success { --notice-edge: ${p.success}; --notice-fill: ${p.successSoft}; --notice-ink: ${p.successInk}; }
html body div[data-notify="container"].alert-danger, html body .alert[data-notify].alert-danger { --notice-edge: ${p.danger}; --notice-fill: ${p.dangerSoft}; --notice-ink: ${p.dangerInk}; }
html body div[data-notify="container"].alert-warning, html body .alert[data-notify].alert-warning { --notice-edge: ${p.warning}; --notice-fill: ${p.warningSoft}; --notice-ink: ${p.warningInk}; }
html body div[data-notify="container"]::before, html body div[data-notify="container"]::after, html body .alert[data-notify]::before, html body .alert[data-notify]::after { content: none !important; }
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="icon"] {
  position: absolute !important; left: 12px !important; top: 50% !important; transform: translateY(-50%) !important;
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  width: 23px !important; height: 23px !important; max-width: 23px !important; max-height: 23px !important; min-width: 0 !important; min-height: 0 !important;
  margin: 0 !important; padding: 0 !important; font-size: 15px !important; line-height: 1 !important;
  border: 1px solid var(--notice-edge) !important; border-radius: 50% !important;
  color: var(--notice-edge) !important; background: transparent !important;
}
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="icon"]::before {
  position: static !important; inset: auto !important; transform: none !important;
  display: block !important; flex: 0 0 auto !important; margin: 0 !important; padding: 0 !important; line-height: 1 !important; text-align: center !important;
}
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="icon"]:is(.fa-exclamation-circle, .fa-exclamation-triangle, .fa-exclamation)::before {
  content: '' !important; width: 15px !important; height: 15px !important;
  background: currentColor !important;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 15 15'%3E%3Crect x='6.25' y='1' width='2.5' height='8' rx='1'/%3E%3Ccircle cx='7.5' cy='12.5' r='1.5'/%3E%3C/svg%3E") center / 15px 15px no-repeat !important;
}
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="title"] { display: block !important; color: var(--notice-ink) !important; font-size: 11px !important; font-weight: bold !important; line-height: 16px !important; margin: 0 0 2px !important; }
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="message"] { display: block !important; color: var(--notice-ink) !important; font-size: 11px !important; line-height: 16px !important; margin: 0 !important; overflow-wrap: anywhere !important; }
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="dismiss"] {
  position: absolute !important; top: 50% !important; right: 8px !important; transform: translateY(-50%) !important;
  width: 22px !important; min-width: 22px !important; min-height: 22px !important; height: auto !important;
  border: 1px solid var(--notice-edge) !important; border-radius: 2px !important; background: transparent !important;
  color: var(--notice-ink) !important; margin: 0 !important; padding: 0 !important; opacity: .8 !important;
}
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="dismiss"]:hover { opacity: 1 !important; box-shadow: inset 0 0 0 1px var(--notice-edge) !important; }
html body .text-success, html body .text-success * { color: ${p.successInk} !important; }

html body .badge-primary, html body .bg-primary,
html body .btn-primary:not(.btn-collapse), html body .btn.btn-primary:not(.btn-collapse) {
  background-color: ${p.primary} !important; color: #FFFFFF !important; border: 1px solid ${p.primary} !important;
}
html body .badge-primary *, html body .btn-primary:not(.btn-collapse) * { color: #FFFFFF !important; }
html body .badge-info, html body .bg-info { background-color: ${p.info} !important; color: ${p.text} !important; border: 1px solid ${p.fieldBorder} !important; }
html body .btn-info, html body .btn.btn-info { background-color: ${p.infoStrong} !important; color: #FFFFFF !important; border: 1px solid ${p.infoStrong} !important; }
html body .btn-info * { color: #FFFFFF !important; }

::-webkit-scrollbar { width: 8px; height: 8px; }
html body .main-panel, html body .modal, html body .modal-body, html body .table-responsive { scrollbar-gutter: stable; }
::-webkit-scrollbar-track { background: ${p.scrollTrack}; }
::-webkit-scrollbar-thumb { background: ${p.scrollThumb}; border: 1px solid ${p.border}; }
::-webkit-scrollbar-thumb:hover { background: ${p.scrollThumbHover}; }
::-webkit-scrollbar-corner { background: ${p.scrollTrack}; }
html.mdt-drag body .modal-header, html.mdt-drag body .swal2-header { touch-action: none !important; cursor: move !important; user-select: none !important; }
html.mdt-drag body .modal.show .modal-dialog[data-mdt-dragging="1"], html.mdt-drag body .modal.in .modal-dialog[data-mdt-dragging="1"], html.mdt-drag body .swal2-popup[data-mdt-dragging="1"] { transition: transform 0s linear !important; will-change: transform !important; }
html body .main-panel .card:not(.modal *) > .card-body > .row,
html body .main-panel .card:not(.modal *) > .row { margin-left: 0 !important; margin-right: 0 !important; min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important; }
html body .main-panel .card:not(.modal *) .leaflet-container, html body .main-panel .card:not(.modal *) #map { box-sizing: border-box !important; max-width: 100% !important; }
html body .dataTables_wrapper :is(.dataTables_length, [id$="_length"]) :is(select, option, .dropdown-toggle, .filter-option, .filter-option-inner-inner) {
  color: ${p.text} !important; -webkit-text-fill-color: ${p.text} !important; background-color: ${p.field} !important; opacity: 1 !important;
}
html body .dataTables_wrapper :is(.dataTables_length, [id$="_length"]) select { appearance: auto !important; background-image: none !important; padding-right: 3px !important; }
html body .card-header :is(.nav-tabs, .nav-pills) .nav-link, html body .card-header :is(.nav-tabs, .nav-pills) .nav-link * { color: ${p.text} !important; -webkit-text-fill-color: ${p.text} !important; }
html.mdt-p1 body .card-header :is(.nav-tabs, .nav-pills) .nav-link, html.mdt-p1 body .card-header :is(.nav-tabs, .nav-pills) .nav-link * { color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }
html.mdt-p1 body .card-header :is(.nav-tabs, .nav-pills) .nav-link.active, html.mdt-p1 body .card-header :is(.nav-tabs, .nav-pills) .nav-link.active * { color: #202020 !important; -webkit-text-fill-color: #202020 !important; }
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="icon"],
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="icon"] *,
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="icon"]::before,
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="icon"]::after { color: var(--notice-edge) !important; -webkit-text-fill-color: var(--notice-edge) !important; }
html.mdt-workspace body .modal.show, html.mdt-workspace body .modal.in, html.mdt-workspace body .modal-dialog { pointer-events: none !important; }
html.mdt-workspace body .modal-content { pointer-events: auto !important; }
html.mdt-workspace body .swal2-container { z-index: 2900 !important; }
html.mdt-workspace body .modal-backdrop, html body .modal-backdrop[data-mdt-workspace-backdrop] { pointer-events: none !important; opacity: 0 !important; }
html body .modal .modal-header .close, html body .modal .modal-content > .close, html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="dismiss"] { font-size: 0 !important; line-height: 1 !important; }
html body .modal .modal-header .close *, html body .modal .modal-content > .close *, html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="dismiss"] * { visibility: hidden !important; }
html body .modal .modal-header .close::before, html body .modal .modal-header .close::after,
html body .modal .modal-content > .close::before, html body .modal .modal-content > .close::after,
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="dismiss"]::before, html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="dismiss"]::after {
  content: '' !important; display: block !important; position: absolute !important;
  inset: 50% auto auto 50% !important; width: 10px !important; height: 2px !important; margin: 0 !important;
  background: currentColor !important; transform: translate(-50%,-50%) rotate(45deg) !important; pointer-events: none !important;
}
html body .modal .modal-header .close::after, html body .modal .modal-content > .close::after, html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="dismiss"]::after { transform: translate(-50%,-50%) rotate(-45deg) !important; }

`)
}

const SKINS = ['p1', 'p1dark', 'aero', 'aerolapd', 'aerodark', 'off']
let theme = 'p1'

function isMdcHost() {
  try {
    return /(^|\.)mdc\.gta\.world$/i.test(location.hostname)
  } catch (_) {
    return false
  }
}

function themeNow() {
  return isMdcHost() ? theme : 'off'
}

function paletteNow() {
  return PALETTES[themeNow()] || PALETTES.light
}

function styleEl() {
  let el = document.getElementById(STYLE_ID)
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
  }
  return el
}

function buildControlCss(p) {
  const glass = GLASS[themeNow()]
  const menuInk = glass ? glass.hdrInk : p.text
  const menuHighlight = glass ? glass.sel : p.sel
  const fieldInk = glass ? glass.fieldInk : p.text
  const fieldFace = glass ? glass.fieldBg : p.field
  return `
html[class] body :is(.card-header,.panel-heading,.search-bar,.search-panel,.search-container,form.form-inline):has(input.form-control):not(:where(.modal *,.note-editor *)) :is(input.form-control,select.form-control,.btn:not(.btn-collapse):not(.dropdown-item):not(.nav-link)) {
  box-sizing: border-box !important; min-height: 26px !important; margin-top: 0 !important; margin-bottom: 0 !important;
  padding: 3px 7px !important; font: 12px/18px Arial, sans-serif !important; vertical-align: middle !important;
  border-width: 1px !important; border-style: solid !important; border-color: ${glass ? glass.fieldBorder : p.fieldBorder} !important;
}
html[class] body :is(.card-header,.panel-heading,.search-bar,.search-panel,.search-container,form.form-inline):has(input.form-control):not(:where(.modal *,.note-editor *)) :is(input.form-control,select.form-control) { height: 26px !important; }

html[class] body :is(.card-header,.panel-heading) .btn:not(:where(.btn-collapse,.nav-link,.dropdown-item,.dropdown-menu *,.note-toolbar *,.note-editor *)) {
  display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 4px !important;
  min-height: 26px !important; height: auto !important; max-height: none !important; padding: 3px 9px !important;
  font: 12px/18px Arial, sans-serif !important; letter-spacing: normal !important; text-transform: none !important;
  background: linear-gradient(${GLASS[themeNow()]?.btnHi || p.panelAlt},${GLASS[themeNow()]?.btnLo || p.btnFace}) !important;
  border: 1px solid ${GLASS[themeNow()]?.btnBorder || p.border} !important; color: ${GLASS[themeNow()]?.btnInk || p.text} !important;
  -webkit-text-fill-color: ${GLASS[themeNow()]?.btnInk || p.text} !important; opacity: 1 !important; text-shadow: none !important; box-shadow: none !important;
}
html[class] body :is(.card-header,.panel-heading) .btn:not(:where(.btn-collapse,.nav-link,.dropdown-item,.dropdown-menu *,.note-toolbar *,.note-editor *)):hover { background: ${GLASS[themeNow()]?.hoverLo || p.btnHover} !important; }
html[class] body :is(.card-header,.panel-heading) .btn:not(:where(.btn-collapse,.nav-link,.dropdown-item,.dropdown-menu *,.note-toolbar *,.note-editor *)):active { background: ${GLASS[themeNow()]?.downHi || p.btnActive} !important; box-shadow: inset 0 1px 3px #0005 !important; }
html[class] body :is(.card-header,.panel-heading) .btn:is(.btn-primary,.btn-danger):not(.btn-collapse) { background: ${p.danger} !important; color: #FFF !important; -webkit-text-fill-color: #FFF !important; }
html[class] body :is(.card-header,.panel-heading) .btn:is(.btn-primary,.btn-danger):not(.btn-collapse):hover { filter: brightness(1.15); }
html[class] body :is(.card-header,.panel-heading) .btn:is(.btn-primary,.btn-danger):not(.btn-collapse):active { filter: brightness(.85); }
html[class] body :is(.card-header,.panel-heading) .btn:not(:where(.btn-collapse,.nav-link,.dropdown-item,.dropdown-menu *,.note-toolbar *,.note-editor *)) *:not(:where(.ripple-container,.ripple-container *)) { color: inherit !important; -webkit-text-fill-color: inherit !important; opacity: 1 !important; text-shadow: none !important; }

html body :is(.card-header,.panel-heading) .btn .ripple-container .ripple-decorator { border-radius: 50% !important; }

html body .note-modal.modal > .modal-dialog > .modal-content > .modal-header { position: relative !important; display: flex !important; align-items: center !important; min-height: 30px !important; padding: 6px 44px 6px 10px !important; }
html body .note-modal.modal .modal-body { padding: 12px !important; }
html body .note-modal.modal .modal-body .form-group { margin: 0 0 10px !important; padding: 0 !important; }
html body .note-modal.modal .modal-body .note-form-label { position: static !important; display: block !important; transform: none !important; margin: 0 0 5px !important; line-height: 17px !important; font-size: 12px !important; color: ${p.text} !important; }
html body .note-modal.modal .modal-body input.form-control:not([type="file"]) { width: 100% !important; height: 30px !important; min-height: 30px !important; padding: 4px 7px !important; margin: 0 !important; background: ${GLASS[themeNow()]?.fieldBg || p.field} !important; color: ${GLASS[themeNow()]?.fieldInk || p.text} !important; -webkit-text-fill-color: ${GLASS[themeNow()]?.fieldInk || p.text} !important; border: 1px solid ${p.fieldBorder} !important; box-shadow: none !important; font: 12px/20px Arial, sans-serif !important; }
html body .note-modal.modal .modal-body input.form-control:focus { border-color: ${p.fieldBorder} !important; outline: 1px solid ${p.fieldBorder} !important; outline-offset: 1px !important; background-image: none !important; }
html body .note-modal.modal .modal-footer { display: flex !important; justify-content: flex-end !important; align-items: center !important; gap: 8px !important; margin: 0 !important; padding: 8px 12px !important; }
html body .note-modal.modal .modal-footer .note-btn.btn-primary { width: auto !important; height: auto !important; min-height: 28px !important; max-height: none !important; padding: 3px 12px !important; margin: 0 !important; font: bold 12px/20px Arial, sans-serif !important; opacity: 1 !important; background: ${p.danger} !important; border: 1px solid ${p.danger} !important; color: ${p.dangerText} !important; -webkit-text-fill-color: ${p.dangerText} !important; box-shadow: none !important; }
html body .note-modal.modal .modal-footer .note-btn.btn-primary:not(:disabled):hover { filter: brightness(1.15); }
html body .note-modal.modal .modal-footer .note-btn.btn-primary:not(:disabled):active { filter: brightness(.85); }
html body .note-modal.modal .modal-footer .note-btn.btn-primary:disabled { background: ${p.btnFace} !important; border-color: ${p.border} !important; color: ${p.textMuted} !important; -webkit-text-fill-color: ${p.textMuted} !important; cursor: default !important; filter: none !important; }
html body .note-modal.modal .modal-header .close::before, html body .note-modal.modal .modal-header .close::after { content: '' !important; display: block !important; position: absolute !important; left: 50% !important; top: 50% !important; width: 10px !important; height: 2px !important; margin: 0 !important; background: #FFF !important; transform: translate(-50%,-50%) rotate(45deg) !important; pointer-events: none !important; }
html body .note-modal.modal .modal-header .close::after { transform: translate(-50%,-50%) rotate(-45deg) !important; }

html body .card > .card-header .btn-collapse, html body .panel > .panel-heading .btn-collapse {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 18px !important;
  height: auto !important;
  min-width: 18px !important;
  min-height: 16px !important;
  max-height: none !important;
  padding: 0 !important;
  font-size: 12px !important;
  line-height: 1 !important;
}
html body .card > .card-header .btn-collapse[data-mdt-collapse], html body .panel > .panel-heading .btn-collapse[data-mdt-collapse] { font-size: 0 !important; }
html body .btn-collapse[data-mdt-collapse] > * { visibility: hidden !important; }
html body .btn-collapse[data-mdt-collapse]::before, html body .btn-collapse[data-mdt-collapse]::after {
  content: '' !important;
  position: absolute !important;
  inset: 50% auto auto 50% !important;
  transform: translate(-50%, -50%) !important;
  width: 8px !important;
  height: 2px !important;
  margin: 0 !important;
  background: currentColor !important;
  pointer-events: none !important;
}
html body .btn-collapse[data-mdt-collapse="plus"]::after { width: 2px !important; height: 8px !important; }
html body .btn-collapse[data-mdt-collapse="minus"]::after { display: none !important; }
html body .card > .card-header .btn-collapse > *, html body .panel > .panel-heading .btn-collapse > * {
  position: static !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1 !important;
  transform: none !important;
}
html[class] body table.table:has(> thead):not(:where([data-mdt-paper], [data-mdt-paper] *)) > tbody > tr > :is(th,td) {
  background-color: ${p.row} !important; background-image: none !important; color: ${p.text} !important;
  font-size: 12px !important; font-weight: normal !important; letter-spacing: normal !important;
  white-space: normal !important; overflow-wrap: anywhere !important; padding: 6px 8px !important;
  border: 1px solid ${p.borderLite} !important; vertical-align: middle !important;
}
html[class] body table.table:has(> thead):not(:where([data-mdt-paper], [data-mdt-paper] *)) > tbody > tr:nth-child(even) > :is(th,td) { background-color: ${p.zebra} !important; }
html[class] body table.table:has(> thead):not(:where([data-mdt-paper], [data-mdt-paper] *)) > tbody > tr > th :not(:where(.badge,.badge *,[class*="text-"],[class*="text-"] *,a,.btn,.btn *)) { color: inherit !important; }
html body #warrant > .row > .text-right:has(> .badge) { display: flex !important; flex-direction: column !important; align-items: flex-end !important; gap: 4px !important; }
html body #warrant > .row > .text-right:has(> .badge) > br { display: none !important; }
html body #warrant > .row > .text-right > .badge { width: 90px !important; min-width: 0 !important; max-width: 100% !important; padding: 3px 7px !important; margin: 0 !important; font-size: 11px !important; line-height: 15px !important; text-align: center !important; }
html body #warrant > .row > .text-right > .badge > * { font: inherit !important; margin: 0 !important; padding: 0 !important; }
html body #PostArrestTable { table-layout: fixed !important; width: 100% !important; }
html body #PostArrestTable > thead > tr > th { white-space: normal !important; overflow-wrap: anywhere !important; padding: 6px 8px !important; }
html body #PostArrestTable > thead > tr > th:first-child { width: 7% !important; }
html body #PostArrestTable > thead > tr > th:nth-child(2) { width: 20% !important; }
html body #PostArrestTable > thead > tr > th:nth-child(3) { width: 17% !important; }
html body #PostArrestTable > thead > tr > th:nth-child(4) { width: 30% !important; }
html body #PostArrestTable > thead > tr > th:nth-child(n+5) { width: 13% !important; }

html body .dropdown-menu:not(:where(.note-editor *, .bootstrap-select *)) .dropdown-item {
  display: flex !important; align-items: center !important; justify-content: flex-start !important;
  text-align: left !important; margin: 0 !important; padding: 3px 8px !important; min-height: 22px !important; border: 0 !important;
  box-sizing: border-box !important; line-height: 16px !important;
}
html body .dropdown-menu:not(:where(.note-editor *, .bootstrap-select *)) .dropdown-item .badge,
html body .dropdown-menu:not(:where(.note-editor *, .bootstrap-select *)) .dropdown-item .badge * {
  font-size: 10px !important; font-weight: normal !important; line-height: 14px !important;
  letter-spacing: 0 !important; text-transform: none !important; text-align: left !important;
}
html body .dropdown-menu:not(:where(.note-editor *, .bootstrap-select *)) .dropdown-item .badge {
  display: inline-block !important; width: auto !important; min-width: 0 !important; margin: 0 !important;
  padding: 1px 4px !important; border-radius: 0 !important; flex: 0 0 auto !important; border-width: 1px !important; border-style: solid !important; box-sizing: border-box !important;
}
html body .dropdown-menu:not(:where(.note-editor *, .bootstrap-select *)) .dropdown-item .badge :is(h1,h2,h3,h4,h5,h6,p) { margin: 0 !important; padding: 0 !important; }
html body .dropdown-menu:not(:where(.note-editor *, .bootstrap-select *)) .dropdown-item :is(h1,h2,h3,h4,h5,h6,p) { margin: 0 !important; padding: 0 !important; font-size: 10px !important; font-weight: normal !important; line-height: 14px !important; }
html body .dropdown-menu:not(:where(.note-editor *, .bootstrap-select *)) .dropdown-item .badge { background-image: none !important; text-shadow: none !important; box-shadow: none !important; }
html body .dropdown-menu:not(:where(.note-editor *, .bootstrap-select *)) .dropdown-item :is(.badge-danger,.badge-primary) { background-color: ${p.danger} !important; color: ${p.dangerText} !important; -webkit-text-fill-color: ${p.dangerText} !important; }
html body .dropdown-menu:not(:where(.note-editor *, .bootstrap-select *)) .dropdown-item .badge-warning { background-color: ${p.warning} !important; color: ${p.warningText} !important; -webkit-text-fill-color: ${p.warningText} !important; }
html body .dropdown-menu:not(:where(.note-editor *, .bootstrap-select *)) .dropdown-item :is(.badge-dark,.badge-secondary) { background-color: ${p.panelAlt} !important; color: ${p.text} !important; -webkit-text-fill-color: ${p.text} !important; }
html body .dropdown-menu:not(:where(.note-editor *, .bootstrap-select *)) .dropdown-item .badge-success { background-color: ${p.success} !important; color: ${p.successText} !important; -webkit-text-fill-color: ${p.successText} !important; }
html body .dropdown-menu:not(:where(.note-editor *, .bootstrap-select *)) .dropdown-item .badge * { color: inherit !important; -webkit-text-fill-color: inherit !important; }


html body .note-editor .note-toolbar > :is(.note-btn-group,.btn-group) { display: inline-flex !important; align-items: center !important; gap: 1px !important; margin: 0 3px 0 0 !important; padding: 0 !important; vertical-align: middle !important; }
html body .note-editor .note-toolbar :is(.note-btn-group,.btn-group) > button.note-btn:not(:where(.dropdown-menu *, .note-dropdown-menu *)) {
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  box-sizing: border-box !important; width: auto !important; min-width: 26px !important; height: auto !important; min-height: 26px !important; max-height: none !important;
  padding: 1px 5px !important; margin: 0 !important; font-size: 11px !important; line-height: 20px !important; vertical-align: middle !important;
}
html body .note-editor .note-toolbar button.note-btn > i { font-size: 12px !important; line-height: 20px !important; margin: 0 !important; }
html body .note-editor .note-toolbar .note-current-fontname { font-size: 11px !important; line-height: 20px !important; }
html body .note-editor .note-toolbar button.dropdown-toggle {
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  box-sizing: border-box !important; min-width: 24px !important; width: auto !important;
  padding: 1px 5px !important; gap: 4px !important; transform: none !important;
}
html body .note-editor .note-toolbar button.dropdown-toggle::after {
  position: static !important; inset: auto !important; float: none !important;
  transform: none !important; margin: 0 !important; flex: 0 0 auto !important;
}
html body .modal[data-mdt-minimized] { visibility: hidden !important; pointer-events: none !important; }
html body .modal .modal-content .modal-header > button.mdt-minimize {
  position: absolute !important; right: 68px !important; top: 50% !important; transform: translateY(-50%) !important;
  width: 28px !important; min-width: 28px !important; height: 22px !important; min-height: 22px !important;
  margin: 0 !important; padding: 0 !important; border: 1px solid ${p.border} !important; border-radius: 2px !important;
  box-sizing: border-box !important; background: ${p.btnFace} !important; color: ${p.text} !important; cursor: pointer !important;
}
html body .modal-header > .mdt-minimize::before { content: '' !important; position: absolute !important; width: 10px !important; height: 2px !important; left: 50% !important; top: 65% !important; transform: translate(-50%,-50%) !important; background: currentColor !important; }
html body .modal .modal-content .modal-header > .mdt-minimize:hover { background: ${p.btnHover} !important; }
html body .modal .modal-content .modal-header > .mdt-minimize:active { background: ${p.btnActive} !important; box-shadow: inset 0 1px 3px #0005 !important; }
html body .modal-header .modal-title:has(.close) { position: static !important; }
html body .modal-header:has(> .mdt-maximize) { padding-right: 108px !important; min-height: 30px !important; }
html body .modal .modal-content .modal-header :is(button.mdt-maximize, .close) {
  position: absolute !important; top: 50% !important; transform: translateY(-50%) !important;
  width: 28px !important; min-width: 28px !important; height: 22px !important; min-height: 22px !important;
  padding: 0 !important; margin: 0 !important; box-sizing: border-box !important;
  border: 1px solid ${p.border} !important; border-radius: 2px !important;
  font-size: 0 !important; line-height: 1 !important; cursor: pointer !important;
}
html body .modal .modal-content .modal-header > button.mdt-maximize { right: 36px !important; background: ${p.btnFace} !important; color: ${p.text} !important; }
html body .modal .modal-content .modal-header .close { right: 4px !important; background: #B72720 !important; color: #FFFFFF !important; opacity: 1 !important; }
html body .modal .modal-content .modal-header > button.mdt-maximize:hover { background: ${p.btnHover} !important; }
html body .modal .modal-content .modal-header .close:hover { background: #DF352B !important; }
html body .modal .modal-content .modal-header > button.mdt-maximize:active { background: ${p.btnActive} !important; box-shadow: inset 0 1px 3px #0005 !important; }
html body .modal .modal-content .modal-header .close:active { background: #8E1915 !important; box-shadow: inset 0 1px 3px #0005 !important; }
html body .modal-header > .mdt-maximize::before {
  content: '' !important; display: block !important; width: 12px !important; height: 10px !important;
  margin: 0 !important; position: absolute !important; left: 50% !important; top: 50% !important;
  transform: translate(-50%,-50%) !important; box-sizing: border-box !important; border: 1px solid currentColor !important; border-top-width: 3px !important;
}
html body [data-mdt-maximized] .mdt-maximize::before { width: 10px !important; height: 8px !important; transform: translate(calc(-50% - 2px),calc(-50% + 2px)) !important; background: ${p.btnFace} !important; z-index: 1 !important; }
html body [data-mdt-maximized] .mdt-maximize::after { content: '' !important; position: absolute !important; width: 10px !important; height: 8px !important; left: 50% !important; top: 50% !important; transform: translate(calc(-50% + 1px),calc(-50% - 1px)) !important; box-sizing: border-box !important; border: 1px solid currentColor !important; border-top-width: 3px !important; }
@media screen {
html body .modal-header:has(> .mdt-maximize) { display: flex !important; align-items: center !important; }
html body .modal-header:has(> .mdt-maximize) .modal-title { margin: 0 !important; align-self: center !important; line-height: 18px !important; min-width: 0 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
}
html body [data-mdt-maximized] .mdt-grip { display: none !important; }
html.mdt-form-page body .content .btn:not(:where(.modal *, .note-editor *, .btn-block, .btn-fab, .btn-just-icon, .card-header *, [data-mdt-paper] *, .bootstrap-select *)) {
  height: auto !important; min-height: 24px !important; padding: 3px 8px !important;
  width: auto !important; min-width: 0 !important; line-height: 16px !important; font-size: 12px !important;
}
html[class].mdt-form-page body .content .btn.btn-primary:not(:where(.modal *, .note-editor *, .dropdown-menu *, .bootstrap-select *, [data-mdt-paper] *)) { background: linear-gradient(${glass?.btnHi || p.danger},${glass?.btnLo || p.danger}) !important; border: 1px solid ${glass?.btnBorder || p.danger} !important; color: ${glass?.btnInk || p.dangerText} !important; -webkit-text-fill-color: ${glass?.btnInk || p.dangerText} !important; }
html[class].mdt-form-page body .content .btn.btn-primary:not(:where(.modal *, .note-editor *, .dropdown-menu *, .bootstrap-select *, [data-mdt-paper] *)):hover { background: linear-gradient(${glass?.hoverHi || p.danger},${glass?.hoverLo || p.danger}) !important; filter: brightness(1.08); }
html[class].mdt-form-page body .content .btn.btn-primary:not(:where(.modal *, .note-editor *, .dropdown-menu *, .bootstrap-select *, [data-mdt-paper] *)):active { background: linear-gradient(${glass?.downHi || p.danger},${glass?.downLo || p.danger}) !important; box-shadow: inset 0 1px 3px #0005 !important; }
html[class].mdt-form-page body .content .badge:not(:where(.modal *, .note-editor *, .dropdown-menu *, [data-mdt-paper] *, table *)) { padding: 2px 6px !important; font-size: 11px !important; line-height: 16px !important; background-image: none !important; border-radius: ${glass?2:0}px !important; }
html[class].mdt-form-page body .content .badge:not([class*="badge-"]):not(:where(.modal *, .note-editor *, .dropdown-menu *, [data-mdt-paper] *, table *)) { background-color: ${glass?.panelLo || p.chip} !important; border: 1px solid ${glass?.panelBorder || p.chipBorder} !important; color: ${glass?.ink || p.text} !important; }
html body [data-mdt-lookup-action="1"] {
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  position: relative !important; box-sizing: border-box !important; padding: 0 !important;
  width: 28px !important; min-width: 28px !important; max-width: 28px !important;
  height: 30px !important; flex: 0 0 28px !important; vertical-align: middle !important;
}
html body [data-mdt-lookup-action="1"] > :is(h4, h3) {
  display: flex !important; align-items: center !important; justify-content: center !important;
  flex: 0 0 auto !important; width: auto !important; height: auto !important;
  min-height: 0 !important; margin: 0 !important; padding: 0 !important;
  position: static !important; transform: none !important; line-height: 1 !important;
}
html body [data-mdt-lookup-action="1"] :is(i, .fa, .material-icons),
html body [data-mdt-lookup-action="1"].fa::before {
  position: static !important; inset: auto !important; transform: none !important;
  display: block !important; width: 1em !important; height: auto !important;
  margin: 0 !important; padding: 0 !important; line-height: 1 !important; text-align: center !important;
}
html body [data-mdt-lookup-action="1"] .fa::before {
  position: static !important; inset: auto !important; transform: none !important;
  display: block !important; width: 100% !important; margin: 0 !important; line-height: 1 !important;
}
html body .note-editor .note-toolbar :is(.dropdown-menu, .note-dropdown-menu):not(:has(.note-color-palette)) {
  background: ${p.panel} !important; color: ${p.text} !important;
  border: 1px solid ${p.border} !important; text-shadow: none !important;
  text-transform: none !important; letter-spacing: normal !important;
}
html body .note-editor .note-toolbar :is(.dropdown-menu, .note-dropdown-menu):not(:has(.note-color-palette)) :is(a, button.dropdown-item, li, span, i) {
  color: ${p.text} !important; -webkit-text-fill-color: ${p.text} !important;
  background-color: transparent !important; text-shadow: none !important;
  text-transform: none !important; letter-spacing: normal !important; text-decoration: none !important;
}
html body .note-editor .note-toolbar :is(.dropdown-menu, .note-dropdown-menu) :is(a, button.dropdown-item):is(:hover, :focus, .active) {
  background: ${p.sel} !important; color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important;
}
html body .note-editor .note-toolbar :is(.dropdown-menu, .note-dropdown-menu) :is(a, button.dropdown-item):is(:hover, :focus, .active) * {
  color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important;
}
html body .modal[data-mdt-vanilla="1"] .modal-body .btn:not(:where(.note-editor *, .btn-collapse, .btn-just-icon, .btn-fab, .close, [data-mdt-paper] *)) {
  box-sizing: border-box !important; width: auto !important; min-width: 0 !important; max-width: 100% !important;
  height: auto !important; min-height: 28px !important; padding: 3px 10px !important;
  font-size: 12px !important; line-height: 20px !important;
}
html body .modal[data-mdt-vanilla="1"] .modal-body .input-group > .bootstrap-select.form-control {
  background: transparent !important; border: 0 !important; box-shadow: none !important;
  padding: 0 !important; margin: 0 !important; height: 30px !important; min-height: 30px !important;
}
html body .modal[data-mdt-vanilla="1"] .modal-body .input-group > .bootstrap-select > .dropdown-toggle {
  width: 100% !important; height: auto !important; min-height: 30px !important; margin: 0 !important;
  padding: 4px 8px !important; line-height: 20px !important; border-radius: 0 !important;
}
html body .modal[data-mdt-vanilla="1"] .modal-body .input-group:has(> .bootstrap-select) > .input-group-prepend {
  margin: 0 -1px 0 0 !important; padding: 0 !important;
}
html body .modal[data-mdt-vanilla="1"] .modal-body .input-group:has(> .bootstrap-select) .input-group-text {
  box-sizing: border-box !important; height: 30px !important; min-height: 30px !important; margin: 0 !important;
  padding: 4px 8px !important; line-height: 20px !important; border-radius: 0 !important;
}
html body .modal[data-mdt-vanilla="1"] .modal-body .chargeWrapper .remove_button {
  box-sizing: border-box !important; width: 28px !important; min-width: 0 !important; max-width: 100% !important;
  height: auto !important; min-height: 30px !important; padding: 0 !important; margin: 0 !important; line-height: 28px !important;
}
html body .modal[data-mdt-vanilla="1"] .modal-body .bootstrap-select > .dropdown-toggle :is(.filter-option, .filter-option-inner, .filter-option-inner-inner) {
  background: transparent !important; border: 0 !important; box-shadow: none !important;
  color: inherit !important; -webkit-text-fill-color: inherit !important;
}
html body .modal[data-mdt-native-form="1"] .modal-body .row {
  display: flex !important; flex-wrap: wrap !important; align-items: flex-start !important;
}
html body .modal[data-mdt-native-form="1"] .modal-body .row > [class*="col-"] { min-width: 0 !important; }
html body .modal[data-mdt-native-form="1"] .modal-body .input-group {
  display: flex !important; flex-wrap: nowrap !important; align-items: flex-start !important;
}
html body .modal[data-mdt-native-form="1"] .modal-body .input-group > .form-control { min-width: 0 !important; flex: 1 1 0 !important; width: 1% !important; }
html body .modal[data-mdt-native-form="1"] .modal-body .input-group > :is(.input-group-addon, .input-group-prepend, .input-group-append) { flex: 0 0 auto !important; }
html body .modal[data-mdt-native-form="1"] textarea[data-mdt-src-hidden="1"] { display: none !important; }
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="icon"] { box-sizing: border-box !important; }
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="icon"]::before { align-self: center !important; }
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="icon"][data-mdt-notice-mark="1"] > * { display: none !important; }
html body :is(div[data-notify="container"], .alert[data-notify]) [data-notify="icon"][data-mdt-notice-mark="1"]::before {
  content: '' !important; position: static !important; inset: auto !important; transform: none !important;
  display: block !important; flex: 0 0 15px !important; width: 15px !important; height: 15px !important;
  margin: 0 !important; padding: 0 !important; background: currentColor !important;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 15 15'%3E%3Crect x='6.25' y='1' width='2.5' height='8' rx='1'/%3E%3Ccircle cx='7.5' cy='12.5' r='1.5'/%3E%3C/svg%3E") center / 15px 15px no-repeat !important;
}
html body .modal[data-mdt-native-form="1"] .modal-body { padding: 12px !important; }
html body .modal[data-mdt-native-form="1"] .modal-body > .form-group { margin: 0 0 16px !important; }
html body .modal[data-mdt-native-form="1"] .modal-body h6 { margin: 0 0 10px !important; line-height: 18px !important; }
html body .modal[data-mdt-native-form="1"] .modal-body .btn:where(:not(.note-btn):not(.note-color-btn)) {
  display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 4px !important;
  width: auto !important; min-width: 0 !important; max-width: 100% !important;
  height: auto !important; min-height: 28px !important; padding: 3px 10px !important; margin: 0 !important;
  font-size: 12px !important; line-height: 20px !important; white-space: nowrap !important;
}
html body .modal[data-mdt-native-form="1"] .modal-body .btn > i { margin: 0 !important; line-height: 1 !important; }
html body .modal[data-mdt-native-form="1"] .modal-body :is(input.form-control, select.form-control, select.custom-select, .input-group-text) {
  box-sizing: border-box !important; height: 30px !important; min-height: 30px !important; max-height: 30px !important;
  padding: 4px 8px !important; margin: 0 !important; line-height: 20px !important; font-size: 12px !important;
}
html body .modal[data-mdt-native-form="1"] .modal-body .input-group-text { display: flex !important; align-items: center !important; justify-content: center !important; min-width: 30px !important; }
html body .modal[data-mdt-native-form="1"] .modal-body .input-group-prepend { align-self: flex-start !important; }
html body .modal[data-mdt-native-form="1"] .modal-body > .row:first-child { margin: 0 0 14px !important; gap: 12px !important; }
html body .modal[data-mdt-native-form="1"] .modal-body > .row:first-child > .col-3 { flex: 0 1 auto !important; width: auto !important; max-width: none !important; padding: 0 !important; }
html body .modal[data-mdt-native-form="1"] .modal-body > .row:first-child > .col-3:empty { display: none !important; }
html body .modal[data-mdt-native-form="1"] .modal-body > .row:first-child .form-group { margin: 0 !important; }
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-suspect="1"] {
  display: grid !important; grid-template-columns: minmax(0, 420px) minmax(0, 1fr) !important; gap: 10px 16px !important;
}
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-suspect="1"] > h6 { grid-column: 1 / -1 !important; margin: 0 !important; }
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-suspect="1"] > :is(.input-group, .row) {
  grid-column: 1 !important; width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important;
}
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-suspect="1"] > .row > .col-4 {
  flex: 1 1 100% !important; width: 100% !important; max-width: 100% !important; padding: 0 !important;
}
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-suspect="1"] > .col-auto {
  grid-column: 2 !important; grid-row: 2 / span 4 !important; width: auto !important; margin: 0 !important; padding: 0 !important; justify-self: start !important;
}
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-suspect="1"] .custom-select { width: 100% !important; }
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-situation="1"] {
  display: grid !important; grid-template-columns: minmax(160px, 1fr) minmax(130px, .8fr) minmax(180px, 2fr) !important;
  gap: 10px !important; margin: 0 0 12px !important; align-items: start !important;
}
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-situation="1"] > .form-group {
  width: auto !important; max-width: none !important; min-width: 0 !important; padding: 0 !important; margin: 0 !important;
}
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-situation="1"] label {
  position: static !important; display: block !important; margin: 0 0 4px !important; padding: 0 !important; line-height: 16px !important;
}
html body .modal[data-mdt-native-form="1"] .modal-body .input-group-addon { padding: 8px !important; }
html body .modal[data-mdt-native-form="1"] .modal-body [data-mdt-warrant-entry] {
  display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(100px, .35fr) 28px !important;
  gap: 8px !important; width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 0 8px !important; align-items: start !important;
}
html body .modal[data-mdt-native-form="1"] .modal-body [data-mdt-warrant-entry="evidence"] { grid-template-columns: minmax(0, 1fr) 28px !important; }
html body .modal[data-mdt-native-form="1"] .modal-body [data-mdt-warrant-entry] > [class*="col-"] {
  width: 100% !important; max-width: 100% !important; min-width: 0 !important; padding: 0 !important; margin: 0 !important;
}
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-entry] .remove_button {
  width: 28px !important; min-width: 28px !important; height: auto !important; min-height: 30px !important; padding: 0 !important;
}
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-entry] .bootstrap-select { width: 1% !important; min-width: 0 !important; flex: 1 1 0 !important; }
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-entry] .bootstrap-select > .dropdown-toggle { width: 100% !important; height: 30px !important; }
html body .modal[data-mdt-native-form="1"] .bootstrap-select.form-control { background: transparent !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; }
html body .modal[data-mdt-native-form="1"] .bootstrap-select > .dropdown-toggle {
  background: linear-gradient(${p.panelAlt}, ${p.btnFace}) !important;
  border: 1px solid ${p.fieldBorder} !important; color: ${p.text} !important;
  height: auto !important; min-height: 30px !important; box-shadow: none !important;
}
html body .modal[data-mdt-native-form="1"] .bootstrap-select > .dropdown-toggle :is(.filter-option, .filter-option-inner, .filter-option-inner-inner) {
  background: transparent !important; border: 0 !important; box-shadow: none !important;
  color: inherit !important; -webkit-text-fill-color: inherit !important;
}
html body :is(.bootstrap-select, .bs-container) .dropdown-menu {
  background: ${glass ? glass.menuBg : p.panel} !important; color: ${menuInk} !important; border-color: ${p.border} !important;
  text-shadow: none !important; box-shadow: 0 3px 10px rgba(0,0,0,.22) !important;
}
html body :is(.bootstrap-select, .bs-container) .dropdown-menu :is(.dropdown-item, .text, .dropdown-header, .no-results) {
  color: ${menuInk} !important; -webkit-text-fill-color: ${menuInk} !important; background: transparent !important; text-shadow: none !important;
}
html body :is(.bootstrap-select, .bs-container) .dropdown-menu :is(.dropdown-item:is(:hover, :focus, .active, .selected), li.selected > .dropdown-item, .dropdown-header) {
  background: ${menuHighlight} !important; color: ${menuInk} !important; -webkit-text-fill-color: ${menuInk} !important;
}
html body :is(.bootstrap-select, .bs-container) .dropdown-menu .dropdown-item:is(:hover, :focus, .active, .selected) .text,
html body :is(.bootstrap-select, .bs-container) .dropdown-menu li.selected > .dropdown-item .text {
  color: ${menuInk} !important; -webkit-text-fill-color: ${menuInk} !important;
}
html body :is(.bootstrap-select, .bs-container) .bs-searchbox input.form-control {
  background: ${fieldFace} !important; color: ${fieldInk} !important; -webkit-text-fill-color: ${fieldInk} !important;
  border: 1px solid ${glass ? glass.fieldBorder : p.fieldBorder} !important; box-shadow: none !important; opacity: 1 !important;
}
html body :is(.bootstrap-select, .bs-container) .bs-searchbox input.form-control::placeholder {
  color: ${fieldInk} !important; -webkit-text-fill-color: ${fieldInk} !important; opacity: .65 !important;
}
html body :is(.bootstrap-select, .bs-container) .dropdown-menu .badge {
  display: inline-block !important; box-sizing: border-box !important; min-width: 28px !important;
  font-size: 10px !important; line-height: 14px !important; font-weight: bold !important;
  padding: 1px 4px !important; text-align: center !important; text-shadow: none !important; letter-spacing: 0 !important;
  color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; background-image: none !important;
}
html body :is(.bootstrap-select, .bs-container) .dropdown-menu :is(.badge-danger, .badge-primary) { background-color: #B51F18 !important; }
html body :is(.bootstrap-select, .bs-container) .dropdown-menu .badge-success { background-color: #2E7D32 !important; }
html body :is(.bootstrap-select, .bs-container) .dropdown-menu .badge-info { background-color: #126A8B !important; }
html body :is(.bootstrap-select, .bs-container) .dropdown-menu .badge-light { background-color: #E6E6E6 !important; color: #111111 !important; -webkit-text-fill-color: #111111 !important; }
html body :is(.bootstrap-select, .bs-container) .dropdown-menu .badge-warning { background-color: #E5AA20 !important; color: #111111 !important; -webkit-text-fill-color: #111111 !important; }
html body :is(.bootstrap-select, .bs-container) .dropdown-menu :is(.badge-dark, .badge-secondary) { background-color: #343A40 !important; }
html body :is(.bootstrap-select, .bs-container) .dropdown-menu .badge * { color: inherit !important; -webkit-text-fill-color: inherit !important; font: inherit !important; }
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-entry] .note-editor { width: 1% !important; min-width: 0 !important; flex: 1 1 0 !important; }
html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-entry] .note-editable { min-height: 120px !important; }
html body .modal[data-mdt-native-form="1"] .input-group-prepend:has(.fa-search) { display: none !important; }
html body .card-license :is(.btn-group, .dropdown, .dropup) { position: relative !important; }
html body .card-license .dropdown-menu { display: none !important; text-align: left !important; padding: 8px !important; }
html body .card-license :is(.show, .open) > .dropdown-menu { display: block !important; }
html body .card-profile :is(.characterDetailsTitle, .characterDetailsValue) {
  background: transparent !important; border: 0 !important; box-shadow: none !important;
  padding: 0 !important; margin: 0 !important; font-size: 12px !important; line-height: 18px !important;
}
html body [data-mdt-profile-tail="1"] { display: none !important; }
html body [id="profile-element-vehicles"] > span > .row {
  margin-left: 0 !important; margin-right: 0 !important; width: auto !important; max-width: 100% !important; box-sizing: border-box !important;
}
html body .card.card-stats:has(> .card-header:only-child) {
  padding: 0 !important; min-height: 0 !important; border: 0 !important;
  background: transparent !important; box-shadow: none !important;
}
html body .card.card-stats:has(> .card-header:only-child) > .card-header { margin: 0 !important; }
@media (max-width: 650px) {
  html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-situation="1"] { grid-template-columns: minmax(0, 1fr) !important; }
  html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-suspect="1"] { grid-template-columns: minmax(0, 1fr) !important; }
  html body .modal[data-mdt-native-form="1"] [data-mdt-warrant-suspect="1"] > .col-auto { grid-column: 1 !important; grid-row: auto !important; }
}
`
}

const profileStyles = new Map()

function profileStyle(node, properties) {
  if (!profileStyles.has(node)) profileStyles.set(node, new Map())
  const saved = profileStyles.get(node)
  Object.entries(properties).forEach(([key, value]) => {
    if (!saved.has(key)) saved.set(key, [node.style.getPropertyValue(key), node.style.getPropertyPriority(key)])
    if (node.style.getPropertyValue(key) !== value) node.style.setProperty(key, value, 'important')
  })
}

function restoreProfileDetails() {
  document.querySelectorAll('[data-mdt-profile-tail]').forEach((node) => node.removeAttribute('data-mdt-profile-tail'))
  profileStyles.forEach((properties, node) => {
    properties.forEach(([value, priority], key) => {
      if (value) node.style.setProperty(key, value, priority)
      else node.style.removeProperty(key)
    })
    node.removeAttribute('data-mdt-profile-column')
  })
  profileStyles.clear()
}

function fixProfileDetails() {
  if (themeNow() === 'off') { restoreProfileDetails(); return }
  const tails = new Set()
  profileStyles.forEach((_properties, node) => { if (!node.isConnected) profileStyles.delete(node) })
  document.querySelectorAll('.card-profile').forEach((card) => {
    const titles = Array.from(card.querySelectorAll('.characterDetailsTitle'))
    const values = Array.from(card.querySelectorAll('.characterDetailsValue'))
    if (titles.length < 2 || titles.length !== values.length) return
    const labelColumn = titles[0].parentElement
    const valueColumn = values[0].parentElement
    const separated = labelColumn !== valueColumn && labelColumn.parentElement === valueColumn.parentElement && titles.every((node) => node.parentElement === labelColumn) && values.every((node) => node.parentElement === valueColumn)
    const alternating = labelColumn === valueColumn && titles.every((node) => node.parentElement === labelColumn) && values.every((node) => node.parentElement === valueColumn)
    if (!separated && !alternating) return
    for (const column of [labelColumn,valueColumn]) column.querySelectorAll(':scope > hr.style-hr-no-divider').forEach(node=>tails.add(node))
    const paired = values.slice()
    const jailIndex = titles.findIndex((node) => /jail\s*time/i.test(flatText(node)))
    const partnerIndex = titles.findIndex((node) => /^partner\s*:?$/i.test(flatText(node)))
    const duration = values.find((node) => node.matches('[id*="jail" i]') || node.querySelector('[id*="jail" i]') || /\d+\s*(?:years?|months?|days?|hours?|minutes?|seconds?)\b/i.test(flatText(node)))
    if (jailIndex >= 0 && partnerIndex >= 0 && duration && paired[jailIndex] !== duration && paired[partnerIndex] === duration) {
      paired[partnerIndex] = paired[jailIndex]
      paired[jailIndex] = duration
    }
    const pointsIndex = titles.findIndex((node) => /^criminal\s*points\s*:?$/i.test(flatText(node)))
    if (pointsIndex === titles.length - 1) {
      for (const field of [titles[pointsIndex], paired[pointsIndex]]) {
        const empty = []
        let node = field.nextElementSibling
        while (node && !flatText(node) && node.matches('hr, br, div, span, p') && Array.from(node.querySelectorAll('*')).every((child) => child.matches('hr, br, div, span, p'))) {
          empty.push(node)
          node = node.nextElementSibling
        }
        if (!node && empty.some((candidate) => candidate.matches('hr') || candidate.querySelector('hr'))) empty.forEach((candidate) => tails.add(candidate))
      }
    }
    if (separated) {
      for (const column of [labelColumn, valueColumn]) {
        profileStyle(column, { display: 'grid', 'grid-template-columns': 'minmax(0, 1fr)', 'align-content': 'start', 'row-gap': '4px' })
        column.dataset.mdtProfileColumn = '1'
      }
    } else {
      profileStyle(labelColumn, { display: 'grid', 'grid-template-columns': 'minmax(90px, .9fr) minmax(0, 1fr)', 'column-gap': '8px', 'row-gap': '4px' })
      labelColumn.dataset.mdtProfileColumn = '1'
    }
    titles.forEach((title, index) => {
      profileStyle(title, { 'grid-row': String(index + 1), 'grid-column': '1', 'min-width': '0', 'align-self': 'start', float: 'none', width: 'auto' })
      profileStyle(paired[index], { 'grid-row': String(index + 1), 'grid-column': separated ? '1' : '2', 'min-width': '0', 'align-self': 'start', float: 'none', width: 'auto', 'overflow-wrap': 'anywhere' })
    })
    if (separated) {
      const heights = titles.map((title, index) => Math.max(title.getBoundingClientRect().height, paired[index].getBoundingClientRect().height) + 'px').join(' ')
      profileStyle(labelColumn, { 'grid-template-rows': heights })
      profileStyle(valueColumn, { 'grid-template-rows': heights })
    }
  })
  document.querySelectorAll('[data-mdt-profile-tail]').forEach((node) => { if (!tails.has(node)) node.removeAttribute('data-mdt-profile-tail') })
  tails.forEach((node) => node.setAttribute('data-mdt-profile-tail', '1'))
}

function modalScrollCss(p) {
  return `
html body :is(.bootstrap-select,.bs-container) .dropdown-menu :is(.ps-scrollbar-x-rail,.ps-scrollbar-y-rail,.ps-scrollbar-x,.ps-scrollbar-y,.ps__rail-x,.ps__rail-y,.ps__thumb-x,.ps__thumb-y) { display: none !important; pointer-events: none !important; }
html body :is(.bootstrap-select, .bs-container) div.inner::-webkit-scrollbar, html body :is(.bootstrap-select, .bs-container) .dropdown-menu > div.inner[data-mdt-picker-list]::-webkit-scrollbar { display: block !important; width: 10px !important; height: 10px !important; }
html body :is(.bootstrap-select, .bs-container) div.inner::-webkit-scrollbar-track { background: ${p.scrollTrack} !important; }
html body :is(.bootstrap-select, .bs-container) div.inner::-webkit-scrollbar-thumb { background: ${p.scrollThumb} !important; border: 1px solid ${p.border} !important; border-radius: 0 !important; }
html body :is(.bootstrap-select, .bs-container) div.inner::-webkit-scrollbar-thumb:hover { background: ${p.scrollThumbHover} !important; }
html body .modal .modal-body:is(.ps-container, .modal-scroll) { overflow-y: auto !important; scrollbar-gutter: stable; overscroll-behavior: contain; }
html body .modal .modal-body::-webkit-scrollbar { display: block !important; width: ${themeNow().startsWith('aero') ? 17 : 8}px !important; height: ${themeNow().startsWith('aero') ? 17 : 8}px !important; }
html body .modal .modal-body::-webkit-scrollbar-track { background: ${p.scrollTrack} !important; }
html body .modal .modal-body::-webkit-scrollbar-thumb { background: ${p.scrollThumb} !important; border: 1px solid ${p.border} !important; }
html body .modal .modal-body::-webkit-scrollbar-thumb:hover { background: ${p.scrollThumbHover} !important; }
`
}

function paperCss() {
  return `
html body [data-mdt-record-details], html body [data-mdt-record-details] :is(span, p, a, strong, label, h6):not(:where([data-mdt-paper], [data-mdt-paper] *, .badge, .badge *, .note-editor *)) { font-size: 13px !important; line-height: 1.4 !important; }
html body [data-mdt-paper] {
  background: #FFFFFF !important; color: #000000 !important; color-scheme: light;
  font-family: "Times New Roman", Times, serif !important; font-size: 14px; line-height: 1.45;
  width: 100% !important; max-width: 100% !important; margin-inline: 0 !important; box-sizing: border-box;
}
html body :is(table[data-mdt-paper], [data-mdt-paper] table) {
  width: 100% !important; max-width: 100% !important; border-collapse: collapse; border-spacing: 0;
  border: 1px solid #000000; margin: 0; font-family: inherit; font-size: inherit; line-height: inherit;
}
html body [data-mdt-paper] :is(th, td) {
  background: #FFFFFF; background-image: none; color: #000000; border: 1px solid #000000;
  padding: 6px 4px; font-family: inherit; font-size: inherit; line-height: inherit;
  vertical-align: top; overflow-wrap: anywhere;
}
html body [data-mdt-paper] th { font-size: 10px; font-weight: bold; text-align: left; line-height: 1.3; }
html body [data-mdt-paper] [data-mdt-paper-title] { font-size: 16px; font-weight: bold; text-align: center; padding: 12px 6px; }
html body [data-mdt-paper] p { line-height: 1.45; margin-block: 0 10px; }
@media print {
  @page mdt-document { size: letter; margin: 12mm; }
  html:has([data-mdt-paper-print]), html body:has([data-mdt-paper-print]) { background: white !important; min-width: 0 !important; height: auto !important; overflow: visible !important; }
  html body:has([data-mdt-paper-print]) *:not([data-mdt-paper-print]):not([data-mdt-paper-print] *):not(:has([data-mdt-paper-print])) { display: none !important; }
  html body :has([data-mdt-paper-print]), html body [data-mdt-paper-print], html body [data-mdt-paper-print] :is(.modal-dialog, .modal-content, .modal-body) {
    display: block !important; position: static !important; inset: auto !important; transform: none !important;
    width: 100% !important; min-width: 0 !important; max-width: none !important; height: auto !important; max-height: none !important;
    overflow: visible !important; margin: 0 !important; padding: 0 !important; border: 0 !important; box-shadow: none !important;
    background: white !important;
  }
  [data-mdt-paper-print] { page: mdt-document; }
  [data-mdt-paper-print] :is(.modal-header, .modal-footer, .mdt-grip) { display: none !important; }
  [data-mdt-paper-print] .modal-body > :not([data-mdt-paper]):not(:has([data-mdt-paper])) { display: none !important; }
  [data-mdt-paper] { print-color-adjust: exact; }
  html body [data-mdt-paper] :is(table, th, td), html body table[data-mdt-paper] { border: 1pt solid #000000 !important; }
  [data-mdt-paper] tr:has(th) { break-inside: avoid; break-after: avoid; }
}
`
}

function isPrintedForm(table) {
  if (table.closest('.note-editor, [contenteditable="true"]') || table.querySelector('input, select, textarea, [contenteditable="true"]')) return false
  const rows = Array.from(table.rows)
  if (rows.length < 3) return false
  const heading = rows.slice(0,3).flatMap(row=>Array.from(row.cells)).find(cell => {
    if (cell.closest('table') !== table || cell.querySelector('table') || !(cell.colSpan > 1 || cell.querySelector('h1,h2,h3,center'))) return false
    return /(?:(?:arrest|incident|infraction|impound|supplemental)\s+report|(?:infraction|traffic|parking|civil)\s+citation(?:\s+report)?|(?:(?:arrest|search|electronic|financial)\s+)?warrant)\b/i.test(flatText(cell))
  })
  if (!heading) return false
  const labels = rows.slice(1).flatMap(row=>Array.from(row.cells)).filter(cell=>cell.closest('table')===table&&flatText(cell).length<90&&(cell.tagName==='TH'||cell.querySelector('b,strong')))
  return labels.length >= 3 && rows.some(row=>row.cells.length>1)
}

function markPaperDocuments() {
  const wanted = new Set(), details = new Set()
  if(themeNow()!=='off') {
    document.querySelectorAll('table').forEach(table=>{if(isPrintedForm(table))wanted.add(table)})
    document.querySelectorAll('.report-document, .paper, .printable, article.document').forEach(node=>{
      if(!node.closest('.note-editor, [contenteditable="true"]')&&!node.querySelector('input,select,textarea,[contenteditable="true"]'))wanted.add(node)
    })
    document.querySelectorAll('.card, .panel, article').forEach(card=>{
      if(card.closest('.modal, .note-editor, [contenteditable="true"]')) return
      const heading=card.querySelector('.card-title, .panel-title, .modal-header :is(h1,h2,h3,h4,h5,h6)')
      if(!heading||heading.closest('.card,.panel,article')!==card||!/^view\s+(?:record|report)\b/i.test(flatText(heading))) return
      const body=card.querySelector(':scope > .card-body, :scope > .panel-body')
      if(body) details.add(body)
    })
  }
  wanted.forEach(node=>{let parent=node.parentElement;while(parent){if(wanted.has(parent)){wanted.delete(node);break}parent=parent.parentElement}})
  document.querySelectorAll('[data-mdt-record-details]').forEach(node=>{if(!details.has(node)) node.removeAttribute('data-mdt-record-details')})
  details.forEach(node=>node.setAttribute('data-mdt-record-details','1'))
  document.querySelectorAll('[data-mdt-paper]').forEach((node) => { if (!wanted.has(node)) node.removeAttribute('data-mdt-paper') })
  document.querySelectorAll('[data-mdt-paper-title]').forEach((node) => { if (!node.closest('[data-mdt-paper]')) node.removeAttribute('data-mdt-paper-title') })
  wanted.forEach((node) => {
    node.setAttribute('data-mdt-paper', '1')
    const table = node.matches('table') ? node : node.querySelector('table')
    const row = table && table.rows[0]
    if (row && row.cells.length === 1 && (row.cells[0].colSpan > 1 || row.cells[0].querySelector('h1, h2, h3, br'))) row.cells[0].setAttribute('data-mdt-paper-title', '1')
  })
}

window.addEventListener('beforeprint', () => {
  markPaperDocuments()
  const modals = Array.from(document.querySelectorAll('.modal')).filter((node) => node.style.display !== 'none' && node.getAttribute('aria-hidden') !== 'true' && (node.matches('.show, .in') || node.style.display === 'block') && node.querySelector('[data-mdt-paper]'))
  modals.sort((a, b) => Number(getComputedStyle(b).zIndex || 0) - Number(getComputedStyle(a).zIndex || 0))
  if (modals[0]) modals[0].setAttribute('data-mdt-paper-print', '1')
  else document.querySelector('[data-mdt-record-details] [data-mdt-paper], .report-document[data-mdt-paper], .paper[data-mdt-paper]')?.setAttribute('data-mdt-paper-print','1')
})
window.addEventListener('afterprint', () => document.querySelectorAll('[data-mdt-paper-print]').forEach((node) => node.removeAttribute('data-mdt-paper-print')))

function markAuthorStyle(node) {
  if (!node.style || node.closest('.bootstrap-select, .cropper-container, .note-color-palette')) return
  for (const [attribute, enabled] of [['data-mdt-author-color', !!(node.style.color || node.style.backgroundColor || node.style.webkitTextFillColor)], ['data-mdt-author-font', !!node.style.fontFamily]]) {
    if (enabled && !node.hasAttribute(attribute)) node.setAttribute(attribute, '1')
    else if (!enabled && node.hasAttribute(attribute)) node.removeAttribute(attribute)
  }
}

function markAuthorStyles(root) {
  if (root.nodeType === 1) markAuthorStyle(root)
  root.querySelectorAll('[style]').forEach(markAuthorStyle)
}

function keepLast() {
  try {
    if (themeNow() === 'off') {
      const old = document.getElementById(STYLE_ID)
      if (old) old.remove()
      document.querySelectorAll('[data-mdt-author-color], [data-mdt-author-font]').forEach((node) => { node.removeAttribute('data-mdt-author-color'); node.removeAttribute('data-mdt-author-font') })
      return
    }
    markAuthorStyles(document)
    const el = styleEl()
    const wanted = paletteNow()
    const css = cachedSkinCss('base:' + themeNow(), () => buildCss(wanted) + buildControlCss(wanted) + modalScrollCss(wanted) + paperCss())
    if (el.textContent !== css) el.textContent = css
    const host = document.body || document.head || document.documentElement
    if (host && host.lastElementChild !== el) host.appendChild(el)
    el.disabled = themeNow() === 'off'
  } catch (_) {
  }
}

function markNoticeIcon(icon) {
  const nested = icon.querySelector('.material-icons')
  const known = nested && /^(?:error|error_outline|warning|warning_amber|priority_high|report_problem|report)$/i.test(flatText(nested))
  if (known) icon.dataset.mdtNoticeMark = '1'
  else icon.removeAttribute('data-mdt-notice-mark')
}

const noticeObserver = new MutationObserver((records) => {
  for (const record of records) {
    const target = record.target.nodeType === 1 ? record.target : record.target.parentElement
    const icon = target && target.closest('[data-notify="icon"]')
    if (icon) markNoticeIcon(icon)
    for (const node of record.addedNodes || []) {
      if (node.nodeType !== 1) continue
      if (node.matches('[data-notify="icon"]')) markNoticeIcon(node)
      node.querySelectorAll('[data-notify="icon"]').forEach(markNoticeIcon)
    }
  }
})
noticeObserver.observe(document, { childList: true, subtree: true, characterData: true })

function normalizeInlineColors() {
  try {
    const scope = document.querySelectorAll('#cautionCodes, #cautionCodes *, .card-license span[name="licenseStatus"]')
    const p = paletteNow()
    scope.forEach((el) => {
      if (!el.style) return
      if (themeNow() === 'off') {
        if (el.dataset.mdtColor !== undefined) {
          el.style.setProperty('color', el.dataset.mdtColor)
          delete el.dataset.mdtColor
        }
        return
      }
      const inline = el.style.getPropertyValue('color')
      if (el.dataset.mdtColor === undefined) el.dataset.mdtColor = inline || ''
      el.style.setProperty('color', p.text, 'important')
    })
  } catch (_) {
  }
}

const FRAME_PROPS = {
  'background': 'transparent',
  'background-color': 'transparent',
  'background-image': 'none',
  'border': 'none',
  'box-shadow': 'none'
}

const BANNER_RE = /^(wanted|wanted person|deceased|missing|missing person)$/i
const TIME_RE = /time:\s*\d+\s*day/i
const SCROLL_SEL = '.table-responsive, .dataTables_wrapper, .card-body, .tab-content'

const BANNER_STYLE = {
  'display': 'block',
  'width': '100%',
  'box-sizing': 'border-box',
  'background': '#C00000',
  'background-color': '#C00000',
  'background-image': 'none',
  'border': '1px solid #C00000',
  'border-radius': '0',
  'box-shadow': 'none',
  'color': '#FFFFFF',
  'font-weight': 'bold',
  'font-size': '12px',
  'letter-spacing': '1px',
  'text-align': 'center',
  'line-height': '14px',
  'padding': '1px 6px',
  'margin': '0 0 3px 0',
  'height': 'auto',
  'min-height': '0',
  'max-height': 'none'
}
const POINTS_RE = /^criminal points:?\s*[\d,.]*$/i
const AGE_RE = /^age:?\s*[\d,]*$/i
const EMOTE_RE = /\*\*[^*]+\*\*/
const COLOUR_RE = /^colou?r$/i

function flatText(el) {
  return ((el && el.textContent) || '').replace(/\s+/g, ' ').trim()
}

function labelText(el) {
  try {
    const clone = el.cloneNode(true)
    clone.querySelectorAll('i, svg, .material-icons, .caret, .fa').forEach((n) => n.remove())
    return (clone.textContent || '').replace(/\s+/g, ' ').trim()
  } catch (_) {
    return flatText(el)
  }
}

function stripFrame(el) {
  if (!el || !el.style || !el.dataset) return
  if (el.closest('[data-mdt-paper]')) return
  if (el.dataset.mdtDeframed === '1') return
  el.dataset.mdtDeframed = '1'
  Object.keys(FRAME_PROPS).forEach((prop) => {
    el.style.setProperty(prop, FRAME_PROPS[prop], 'important')
  })
}

function frameBannerHost(el) {
  if (!el || !el.closest) return
  const host = el.closest('.card, .card-body')
  if (!host || !host.style || !host.dataset) return
  if (host.dataset.mdtBannerHost === '1') return
  const pal = paletteNow()
  host.dataset.mdtBannerHost = '1'
  host.style.setProperty('border', '1px solid ' + pal.border, 'important')
  host.style.setProperty('background-color', pal.panel, 'important')
  host.style.setProperty('padding', '4px', 'important')
}

function paintBanner(el) {
  if (!el || !el.style || !el.dataset || el.closest('.dropdown-menu, .dropdown-item, [role="menu"], [role="option"]')) return
  frameBannerHost(el)
  if (el.dataset.mdtBanner === '1') return
  el.dataset.mdtBanner = '1'
  Object.keys(BANNER_STYLE).forEach((prop) => {
    el.style.setProperty(prop, BANNER_STYLE[prop], 'important')
  })
  el.querySelectorAll('*').forEach((kid) => {
    if (!kid.style || !kid.dataset) return
    kid.dataset.mdtBannerInk = '1'
    kid.style.setProperty('color', '#FFFFFF', 'important')
    kid.style.setProperty('background', 'transparent', 'important')
    kid.style.setProperty('font-size', '12px', 'important')
    kid.style.setProperty('line-height', '14px', 'important')
  })
}

function restoreBanners() {
  document.querySelectorAll('[data-mdt-banner-host="1"]').forEach((host) => {
    if (!host.style || !host.dataset) return
    delete host.dataset.mdtBannerHost
    host.style.removeProperty('border')
    host.style.removeProperty('background-color')
    host.style.removeProperty('padding')
  })
  document.querySelectorAll('[data-mdt-banner="1"]').forEach((el) => {
    Object.keys(BANNER_STYLE).forEach((prop) => el.style.removeProperty(prop))
    delete el.dataset.mdtBanner
  })
  document.querySelectorAll('[data-mdt-banner-ink="1"]').forEach((el) => {
    ;['color', 'background', 'font-size', 'line-height'].forEach((prop) => el.style.removeProperty(prop))
    delete el.dataset.mdtBannerInk
  })
}

function restoreFrames() {
  document.querySelectorAll('[data-mdt-deframed="1"]').forEach((el) => {
    Object.keys(FRAME_PROPS).forEach((prop) => el.style.removeProperty(prop))
    delete el.dataset.mdtDeframed
  })
}

function hideEl(el) {
  if (!el || !el.style || !el.dataset) return
  if (el.dataset.mdtHidden === '1') return
  el.dataset.mdtHidden = '1'
  el.style.setProperty('display', 'none', 'important')
}

function restoreHidden() {
  document.querySelectorAll('[data-mdt-hidden="1"]').forEach((el) => {
    el.style.removeProperty('display')
    delete el.dataset.mdtHidden
  })
}

let headerPanelOpen = false
ipcRenderer.on('mdt:header-panel-state', (_event, open) => {headerPanelOpen=!!open})
function dismissHeaderPanel() {
  if (!headerPanelOpen) return
  headerPanelOpen = false
  ipcRenderer.sendToHost('mdt:dismiss-header-panel')
}
for (const event of ['pointerdown','mousedown','focusin']) document.addEventListener(event,dismissHeaderPanel,true)
window.addEventListener('focus',dismissHeaderPanel)
window.addEventListener('keydown',event=>{
  if(headerPanelOpen&&event.key==='Escape') {dismissHeaderPanel();event.preventDefault();event.stopImmediatePropagation()}
},true)

const HDR_SEL = {
  history: '#navbarDropdownHistory',
  bell: '#navbarDropdownNotifications',
  profile: '#navbarDropdownProfile'
}

function findHeaderCtl(kind) {
  const sel = HDR_SEL[kind]
  if (!sel) return null
  const nodes = document.querySelectorAll(sel)
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].closest('.navbar')) return nodes[i]
  }
  return nodes[0] || null
}


const ALERT_MAX = 999
let lastAlertCount = -1

function alertCountFrom(node) {
  if (!node) return 0
  const badge = node.querySelector('.badge, .notification-count, .count, sup')
  if (badge) {
    const n = parseInt(String(flatText(badge)).replace(/[^0-9]/g, ''), 10)
    if (!isNaN(n)) return Math.min(n, ALERT_MAX)
  }
  const box = node.closest('li.nav-item') || node.parentNode
  const menu = box && box.querySelector ? box.querySelector('.dropdown-menu') : null
  if (!menu) return 0
  const unread = menu.querySelectorAll(
    '.unread, [data-unread="1"], .notification-unread, li.unread, a.unread'
  )
  return Math.min(unread.length, ALERT_MAX)
}

function reportAlerts() {
  try {
    const n = alertCountFrom(findHeaderCtl('bell'))
    if (n === lastAlertCount) return
    lastAlertCount = n
    ipcRenderer.sendToHost('mdt:alerts', n)
  } catch (_) {
  }
}

setInterval(reportAlerts, 15000)

function headerCtlBox(node) {
  return (node && node.closest && (node.closest('li.nav-item') || node.closest('li'))) || node
}

function fixHeaderControls() {
  if (themeNow() === 'off') {
    restoreHeaderControls()
    return
  }
  Object.keys(HDR_SEL).forEach((kind) => {
    const box = headerCtlBox(findHeaderCtl(kind))
    if (!box || !box.dataset || box.dataset.mdtHdr === '1') return
    box.dataset.mdtHdr = '1'
    box.style.setProperty('display', 'none', 'important')
  })
}

function restoreHeaderControls() {
  document.querySelectorAll('[data-mdt-hdr="1"]').forEach((box) => {
    box.style.removeProperty('display')
    delete box.dataset.mdtHdr
  })
}

function isDayModeItem(node) {
  if (!node) return false
  if (node.id === 'darkMode') return true
  return /^(day|night)\s*mode$/i.test(labelText(node))
}

function headerLabelParts(link, label) {
  const parts = []
  let cursor = 0
  link.querySelectorAll('[class], [style]').forEach(node=>{
    const tone=Array.from(node.classList).map(name=>/^text-(primary|secondary|success|danger|warning|info|light|dark|muted)$/.exec(name)).find(Boolean)?.[1]
    if(!tone&&!node.style.color) return
    if(node.querySelector('[class*="text-"], [style*="color"]')) return
    const text=flatText(node),start=label.indexOf(text,cursor)
    if(!text||start<cursor) return
    if(start>cursor)parts.push({text:label.slice(cursor,start)})
    parts.push({text,tone:tone||'',color:node.style.color?getComputedStyle(node).color:''})
    cursor=start+text.length
  })
  if(cursor<label.length)parts.push({text:label.slice(cursor)})
  return parts
}

function headerMenuItems(kind) {
  const node = findHeaderCtl(kind)
  const box = headerCtlBox(node)
  const menu = box && box.querySelector('.dropdown-menu')
  const out = []
  if (!menu) return out
  const links = menu.querySelectorAll('a')
  for (let i = 0; i < links.length; i++) {
    const link = links[i]
    if (themeNow() !== 'off' && isDayModeItem(link)) continue
    const small = link.querySelector('span')
    const sub = small ? flatText(small) : ''
    let label = flatText(link)
    if (sub && label.endsWith(sub)) label = label.slice(0, label.length - sub.length).trim()
    if (!label && !sub) continue
    out.push({ index: i, label: label, parts:headerLabelParts(link,label), sub: sub, unread: !!link.closest('.unread, [data-unread="1"], .notification-unread'), href: link.getAttribute('href') || '' })
  }
  return out
}

function sendHeaderMenu(kind) {
  try {
    ipcRenderer.sendToHost('mdt:header-menu', { kind: kind, items: headerMenuItems(kind) })
  } catch (_) {
  }
}

function runHeaderItem(kind, index) {
  const box = headerCtlBox(findHeaderCtl(kind))
  const menu = box && box.querySelector('.dropdown-menu')
  if (!menu) return
  const link = menu.querySelectorAll('a')[index]
  if (!link) return
  try {
    link.click()
  } catch (_) {
  }
}

function deframeBanners() {
  if (themeNow() === 'off') {
    restoreFrames()
    restoreBanners()
    restoreEmotes()
    return
  }
  const nodes = document.querySelectorAll(
    'div, span, p, h1, h2, h3, h4, h5, h6, td, th, section, label, strong, b'
  )
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i]
    if (el.closest('[data-mdt-paper], .dropdown-menu, .dropdown-item, [role="menu"], [role="option"]')) continue
    const t = flatText(el)
    if (!t || t.length > 40) continue
    const isBanner = BANNER_RE.test(t)
    const isPoints = POINTS_RE.test(t)
    const isAge = AGE_RE.test(t)
    if (!isBanner && !isPoints && !isAge) continue

    if (isBanner && isCautionChip(el)) continue
    if (isPoints) stripFrame(el)
    if (isBanner && !isCautionChip(el)) paintBanner(el)
    if (isAge) {
      stripFrame(el)
      el.querySelectorAll('*').forEach((kid) => {
        const cls = String((kid && kid.className) || '')
        if (/badge|label/i.test(cls)) return
        stripFrame(kid)
      })
    }

    let parent = el.parentElement
    let hops = 0
    while (parent && hops < 3 && flatText(parent) === t) {
      stripFrame(parent)
      parent = parent.parentElement
      hops++
    }
  }
}

function isCautionChip(el) {
  if (!el || !el.closest) return false
  if (el.closest('#cautionCodes, td, th, .nav-tabs, .nav-pills, [data-notify], .note-editor')) return true
  const cls = String((el.className && el.className.baseVal) || el.className || '')
  return /\bbadge\b|\bchip\b|\bcaution\b/i.test(cls)
}

function setScrollProp(el, prop, value) {
  const key = prop === 'overflow-x' ? 'mdtSx' : 'mdtSy'
  if (!el || !el.style || !el.dataset || el.dataset[key] === '1') return
  el.dataset[key] = '1'
  el.style.setProperty(prop, value, 'important')
}

function clearScrollProp(el, prop) {
  const key = prop === 'overflow-x' ? 'mdtSx' : 'mdtSy'
  if (!el || !el.dataset || el.dataset[key] !== '1') return
  delete el.dataset[key]
  el.style.removeProperty(prop)
}

function restoreScrollers() {
  document.querySelectorAll('[data-mdt-sx="1"]').forEach((el) => clearScrollProp(el, 'overflow-x'))
  document.querySelectorAll('[data-mdt-sy="1"]').forEach((el) => clearScrollProp(el, 'overflow-y'))
}

function trimScrollers() {
  if (themeNow() === 'off') {
    restoreScrollers()
    return
  }
  if (!document.body || typeof getComputedStyle !== 'function') return
  document.querySelectorAll('[data-mdt-sy="1"]').forEach((el) => clearScrollProp(el, 'overflow-y'))
  const nodes = Array.prototype.filter.call(
    document.querySelectorAll(SCROLL_SEL),
    (node) => node && node.closest && !node.closest('.modal, .dropdown-menu, .bootstrap-select')
  )
  const limit = nodes.length > 600 ? 600 : nodes.length
  for (let i = 0; i < limit; i++) {
    const el = nodes[i]
    if (!el || !el.style || !el.dataset) continue
    if (el.classList && el.classList.contains('collapsing')) continue
    let cs = null
    try {
      cs = getComputedStyle(el)
    } catch (_) {
      continue
    }
    if (!cs) continue
    const scrollsWide = el.scrollWidth > el.clientWidth + 2
    if (!scrollsWide && /auto|scroll/.test(cs.overflowX)) setScrollProp(el, 'overflow-x', 'hidden')
  }
}

const ROW_PROPS = [
  'display', 'flex-wrap', 'flex-direction', 'align-items', 'justify-content',
  'gap', 'width', 'flex-basis', 'order', 'margin', 'padding-left', 'min-height',
  'overflow', 'position', 'text-align', 'float', 'max-width'
]

const FORM_PAGE_RE = /\/(incidents?|apbs?|warrants?|reports?|arrests?)\/(create|edit)(?:\/|$)/i

function isFormPage() {
  try {
    return FORM_PAGE_RE.test(String(location.pathname || ''))
  } catch (_) {
    return false
  }
}

function applyFormFlag() {
  try {
    if (document.documentElement) {
      const authoring = isFormPage() || !!document.querySelector('.content :is(form:has(textarea, .note-editor, [contenteditable="true"]), textarea.summernote, .note-editor):not(.modal *)')
      document.documentElement.classList.toggle('mdt-form-page', authoring && themeNow() !== 'off')
    }
  } catch (_) {
  }
}

function markRow(el, props) {
  if (!el || !el.style || !el.dataset || el.dataset.mdtRow === '1') return
  if (isFormPage() || document.documentElement.classList.contains('mdt-form-page')) return
  if (el.closest && el.closest('[data-mdt-vanilla="1"], [data-mdt-paper]')) return
  el.dataset.mdtRow = '1'
  Object.keys(props).forEach((key) => el.style.setProperty(key, props[key], 'important'))
}

function restoreRows() {
  document.querySelectorAll('[data-mdt-row="1"]').forEach((el) => {
    if (el.dataset) delete el.dataset.mdtRow
    ROW_PROPS.forEach((key) => el.style.removeProperty(key))
  })
}

function fixChargeBars() {
  if (themeNow() === 'off') {
    restoreRows()
    return
  }
  const scopes = document.querySelectorAll('.modal-content, .card')
  for (let i = 0; i < scopes.length; i++) {
    const nodes = scopes[i].querySelectorAll('div, span, p, small, label, strong, b, h5, h6')
    for (let j = 0; j < nodes.length; j++) {
      const el = nodes[j]
      const t = flatText(el)
      if (!t || t.length > 80 || !TIME_RE.test(t)) continue
      if (el.querySelector && el.querySelector('div, span, p, label, strong, b')) continue
      markRow(el, {
        display: 'block',
        width: '100%',
        'flex-basis': '100%',
        order: '9',
        margin: '2px 0 0 0',
        'padding-left': '2px'
      })
      const parent = el.parentElement
      if (parent) {
        markRow(parent, {
          display: 'block',
          position: 'relative',
          'max-width': '100%',
          overflow: 'visible'
        })
      }
      break
    }
  }
}

const TIME_PROPS = [
  'display', 'position', 'width', 'max-width', 'float', 'clear',
  'margin', 'padding-left', 'top', 'right', 'bottom', 'left'
]

function restoreTimeBadges() {
  document.querySelectorAll('[data-mdt-time="1"]').forEach((el) => {
    if (!el.style || !el.dataset) return
    delete el.dataset.mdtTime
    TIME_PROPS.forEach((key) => el.style.removeProperty(key))
  })
}

function fixTimeBadges() {
  if (themeNow() === 'off') {
    restoreTimeBadges()
    return
  }
  const scopes = document.querySelectorAll('.modal-content, .card')
  for (let i = 0; i < scopes.length; i++) {
    const nodes = scopes[i].querySelectorAll('div, span, p, small, label, strong, b, h5, h6')
    for (let j = 0; j < nodes.length; j++) {
      const el = nodes[j]
      if (!el.style || !el.dataset) continue
      if (el.closest('[data-mdt-paper]')) continue
      const t = flatText(el)
      if (!t || t.length > 80 || !TIME_RE.test(t)) continue
      if (el.querySelector && el.querySelector('div, span, p, label, strong, b')) continue
      if (el.dataset.mdtTime === '1') break
      el.dataset.mdtTime = '1'
      el.style.setProperty('display', 'block', 'important')
      el.style.setProperty('position', 'static', 'important')
      el.style.setProperty('width', '100%', 'important')
      el.style.setProperty('max-width', '100%', 'important')
      el.style.setProperty('float', 'none', 'important')
      el.style.setProperty('clear', 'both', 'important')
      el.style.setProperty('margin', '2px 0', 'important')
      el.style.setProperty('padding-left', '2px', 'important')
      break
    }
  }
}

const CROW_PROPS = [
  'display', 'flex-wrap', 'align-items', 'gap', 'width', 'max-width',
  'min-width', 'margin', 'padding', 'float', 'flex', 'text-align',
  'position', 'height', 'min-height'
]

function restoreChargeRows() {
  document.querySelectorAll('[data-mdt-crow="1"], [data-mdt-ccell="1"], [data-mdt-cbtn="1"], [data-mdt-chost="1"]').forEach((el) => {
    if (!el.style || !el.dataset) return
    delete el.dataset.mdtCrow
    delete el.dataset.mdtCcell
    delete el.dataset.mdtCbtn
    delete el.dataset.mdtChost
    CROW_PROPS.forEach((key) => el.style.removeProperty(key))
  })
}

function setImportant(el, props) {
  Object.keys(props).forEach((key) => el.style.setProperty(key, props[key], 'important'))
}

function hasSelectish(el) {
  if (!el || !el.querySelector) return false
  if (el.tagName === 'SELECT') return true
  return !!el.querySelector('select, .bootstrap-select, input, textarea')
}

function isLoneIconButton(el) {
  if (!el || !el.querySelectorAll) return false
  if (hasSelectish(el)) return false
  const btns = el.querySelectorAll('.btn, button')
  if (btns.length !== 1) return false
  return labelText(btns[0]).length === 0
}

function fixChargeRows() {
  if (themeNow() === 'off') {
    restoreChargeRows()
    return
  }
  const bodies = document.querySelectorAll('.modal-body')
  for (let b = 0; b < bodies.length; b++) {
    const body = bodies[b]
    if (body.closest('[data-mdt-vanilla="1"]')) continue
    const controls = body.querySelectorAll('select, .bootstrap-select')
    if (controls.length < 2) continue
    const rows = []
    for (let c = 0; c < controls.length; c++) {
      const ctl = controls[c]
      let row = ctl.closest ? ctl.closest('.row, .form-row') : null
      if (!row && ctl.parentElement) row = ctl.parentElement.parentElement
      if (!row || !row.style || !row.dataset) continue
      if (!body.contains(row) || row === body) continue
      if (rows.indexOf(row) !== -1) continue
      const count = row.querySelectorAll('select, .bootstrap-select').length
      if (count < 2 || count > 4) continue
      if (flatText(row).length > 200) continue
      const nested = row.querySelectorAll('.row, .form-row')
      let hasNested = false
      for (let n = 0; n < nested.length; n++) {
        if (nested[n].querySelectorAll('select, .bootstrap-select').length >= 2) {
          hasNested = true
          break
        }
      }
      if (hasNested) continue
      rows.push(row)
    }
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r]
      if (row.dataset.mdtCrow !== '1') {
        row.dataset.mdtCrow = '1'
        setImportant(row, {
          display: 'flex',
          'flex-wrap': 'nowrap',
          'align-items': 'center',
          gap: '3px',
          width: '100%',
          'max-width': '100%',
          margin: '0 0 3px 0',
          padding: '0',
          float: 'none',
          'text-align': 'left'
        })
        const cells = row.children
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i]
          if (!cell.style || !cell.dataset) continue
          cell.dataset.mdtCcell = '1'
          const picker = hasSelectish(cell)
          setImportant(cell, {
            float: 'none',
            margin: '0',
            padding: '0',
            width: 'auto',
            'min-width': picker ? '96px' : '0',
            'max-width': '100%',
            flex: picker ? '1 1 160px' : '0 0 auto'
          })
          if (!picker) cell.dataset.mdtCbtn = '1'
        }
      }
      const host = row.parentElement
      if (!host || !host.style || !host.dataset) continue
      const kids = []
      for (let k = 0; k < host.children.length; k++) {
        if (host.children[k].nodeType === 1) kids.push(host.children[k])
      }
      if (kids.length !== 2) continue
      const other = kids[0] === row ? kids[1] : kids[0]
      if (!isLoneIconButton(other)) continue
      if (host.dataset.mdtChost !== '1') {
        host.dataset.mdtChost = '1'
        setImportant(host, {
          display: 'flex',
          'flex-wrap': 'nowrap',
          'align-items': 'center',
          gap: '3px',
          width: '100%',
          'max-width': '100%',
          margin: '0 0 3px 0',
          padding: '0'
        })
        setImportant(row, { flex: '1 1 auto', margin: '0', 'min-width': '0' })
      }
      if (other.dataset.mdtCbtn !== '1') {
        other.dataset.mdtCbtn = '1'
        setImportant(other, {
          flex: '0 0 auto',
          margin: '0',
          padding: '0',
          float: 'none',
          width: 'auto',
          'text-align': 'center'
        })
      }
    }
  }
}

const LIC_PROPS = [
  'display', 'flex-direction', 'flex-wrap', 'align-items', 'justify-content',
  'gap', 'width', 'max-width', 'min-width', 'margin', 'padding', 'float',
  'flex', 'text-align', 'position'
]

const LIC_BTN_RE = /^(revoke|suspend|unsuspend|reinstate|renew|reissue|issue|activate|deactivate)\b/i

function restoreLicenseButtons() {
  document.querySelectorAll('[data-mdt-lic="1"], [data-mdt-lichost="1"]').forEach((el) => {
    if (!el.style || !el.dataset) return
    delete el.dataset.mdtLic
    delete el.dataset.mdtLichost
    LIC_PROPS.forEach((key) => el.style.removeProperty(key))
  })
}

function ancestorChain(el, stop) {
  const out = []
  let cur = el
  while (cur && cur !== stop) {
    out.push(cur)
    cur = cur.parentElement
  }
  return out
}

function sharedAncestor(nodes) {
  if (!nodes.length) return null
  let cur = nodes[0].parentElement
  while (cur) {
    let all = true
    for (let i = 1; i < nodes.length; i++) {
      if (!cur.contains(nodes[i])) {
        all = false
        break
      }
    }
    if (all) return cur
    cur = cur.parentElement
  }
  return null
}

function fixLicenseButtons() {
  if (themeNow() === 'off') {
    restoreLicenseButtons()
    return
  }
  const cards = document.querySelectorAll('.card-license, .card')
  for (let c = 0; c < cards.length; c++) {
    const card = cards[c]
    const all = card.querySelectorAll('.btn, button')
    if (all.length < 2 || all.length > 8) continue
    const btns = []
    for (let i = 0; i < all.length; i++) {
      if (LIC_BTN_RE.test(labelText(all[i]))) btns.push(all[i])
    }
    if (btns.length < 2) continue
    const host = sharedAncestor(btns)
    if (!host || !host.style || !host.dataset || host === card.ownerDocument.body) continue
    if (host.matches('.card, .card-license, .card-body')) continue
    if (host.dataset.mdtLichost !== '1') {
      host.dataset.mdtLichost = '1'
      setImportant(host, {
        display: 'flex',
        'flex-direction': 'row',
        'flex-wrap': 'nowrap',
        'align-items': 'center',
        'justify-content': 'center',
        gap: '4px',
        width: '100%',
        'max-width': '100%',
        margin: '2px 0',
        padding: '0',
        float: 'none',
        'text-align': 'center'
      })
    }
    for (let i = 0; i < btns.length; i++) {
      const chain = ancestorChain(btns[i], host)
      for (let j = 0; j < chain.length; j++) {
        const el = chain[j]
        if (!el.style || !el.dataset || el.dataset.mdtLic === '1') continue
        el.dataset.mdtLic = '1'
        setImportant(el, {
          display: 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          width: 'auto',
          'max-width': 'none',
          'min-width': '0',
          flex: '0 0 auto',
          float: 'none',
          margin: '0',
          position: el.matches('.btn-group, .dropdown, .dropup') ? 'relative' : 'static'
        })
      }
    }
  }
}

function isButtonish(node) {
  if (!node || node.nodeType !== 1) return false
  if (node.tagName === 'BUTTON') return true
  const cls = String((node.className && node.className.baseVal) || node.className || '')
  if (/\bbtn\b/.test(cls)) return true
  if (/\bdropdown\b|\bbtn-group\b|\bdropup\b|\bbootstrap-select\b/.test(cls)) {
    return !!(node.querySelector && node.querySelector('.btn, button'))
  }
  return false
}

function packButtonRows() {
  if (themeNow() === 'off') {
    restoreRows()
    return
  }
  const nodes = document.querySelectorAll(
    '.card div, .card-body div, .card-footer div, .modal-body div, .modal-footer div'
  )
  const limit = nodes.length > 900 ? 900 : nodes.length
  for (let i = 0; i < limit; i++) {
    const el = nodes[i]
    const kids = el.children
    if (!kids || kids.length < 2 || kids.length > 6) continue
    let allButtons = true
    for (let j = 0; j < kids.length; j++) {
      if (!isButtonish(kids[j])) {
        allButtons = false
        break
      }
    }
    if (!allButtons) continue
    if (flatText(el).length > 80) continue
    markRow(el, {
      display: 'flex',
      'flex-wrap': 'wrap',
      'align-items': 'center',
      'justify-content': 'flex-start',
      gap: '4px',
      'text-align': 'left'
    })
    for (let j = 0; j < kids.length; j++) {
      markRow(kids[j], { float: 'none', margin: '0' })
    }
  }
}

function centerFieldColumns() {
  if (themeNow() === 'off') {
    restoreRows()
    return
  }
  const cols = document.querySelectorAll('.modal-body [class*="col-"], .modal-body .col')
  const limit = cols.length > 400 ? 400 : cols.length
  for (let i = 0; i < limit; i++) {
    const el = cols[i]
    const t = flatText(el)
    if (!t || t.length > 60) continue
    const controls = el.querySelectorAll('.btn, button, select, .dropdown, .bootstrap-select')
    if (controls.length !== 1) continue
    markRow(el, {
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
      'justify-content': 'flex-start',
      gap: '2px',
      'text-align': 'center'
    })
  }
}

function emoteColor() {
  return themeNow() !== 'light' ? '#C9A0FF' : '#7A00CC'
}

function restoreEmotes() {
  document.querySelectorAll('[data-mdt-emote="1"]').forEach((span) => {
    const parent = span.parentNode
    if (!parent) return
    const raw = (span.dataset && span.dataset.mdtEmoteRaw) || ('**' + (span.textContent || '') + '**')
    parent.replaceChild(document.createTextNode(raw), span)
    if (parent.normalize) parent.normalize()
  })
  document.querySelectorAll('[data-mdt-emote-host="1"]').forEach((el) => {
    if (el.dataset) delete el.dataset.mdtEmoteHost
  })
}

function colorEmotes() {
  if (themeNow() === 'off') {
    restoreEmotes()
    return
  }
  if (!document.body || !document.createTreeWalker) return
  const color = emoteColor()
  const skip = 'input, textarea, select, script, style, code, pre, [contenteditable="true"], .note-editor, .note-editable, .summernote, .CodeMirror'
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
  const targets = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    const value = node.nodeValue
    if (!value || value.indexOf('**') === -1) continue
    if (!EMOTE_RE.test(value)) continue
    const parent = node.parentElement
    if (!parent || !parent.closest) continue
    if (parent.closest(skip)) continue
    if (parent.dataset && parent.dataset.mdtEmoteHost === '1') continue
    targets.push(node)
  }
  targets.forEach((node) => {
    const parent = node.parentElement
    if (!parent) return
    const parts = String(node.nodeValue).split(/(\*\*[^*]+\*\*)/)
    const frag = document.createDocumentFragment()
    parts.forEach((part) => {
      if (!part) return
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        const span = document.createElement('span')
        span.dataset.mdtEmote = '1'
        span.dataset.mdtEmoteRaw = part
        span.textContent = part.slice(2, -2)
        span.style.setProperty('color', color, 'important')
        span.style.setProperty('font-style', 'italic', 'important')
        frag.appendChild(span)
      } else {
        frag.appendChild(document.createTextNode(part))
      }
    })
    parent.replaceChild(frag, node)
    if (parent.dataset) parent.dataset.mdtEmoteHost = '1'
  })
}

function hideColourControls() {
  if (themeNow() === 'off') {
    restoreHidden()
    return
  }
  document
    .querySelectorAll('button, a.btn, .btn, .dropdown-toggle')
    .forEach((btn) => {
      if (!COLOUR_RE.test(labelText(btn))) return
      const wrap =
        (btn.closest && (btn.closest('.dropdown') || btn.closest('.btn-group') || btn.closest('.dropup'))) || btn
      hideEl(wrap)
    })
}

const NAV_ROOT_SEL = '.sidebar, .sidebar-wrapper, #sidebar, aside.sidebar, nav.sidebar'
let lastNavJson = ''

function navDepth(a, root) {
  let depth = 0
  let cur = a.parentElement
  while (cur && cur !== root) {
    if (cur.tagName === 'UL') depth++
    cur = cur.parentElement
  }
  return depth
}

function collectNav() {
  const root = document.querySelector(NAV_ROOT_SEL)
  if (!root) return
  const links = root.querySelectorAll('a')
  const items = []
  const seen = {}
  for (let i = 0; i < links.length; i++) {
    const a = links[i]
    const label = labelText(a).replace(/\s+/g, ' ').trim()
    if (!label || label.length > 40) continue
    const raw = a.getAttribute('href') || ''
    if (!raw || /^#|^javascript:/i.test(raw)) continue
    const url = a.href
    if (!url) continue
    const key = label + '|' + url
    if (seen[key]) continue
    seen[key] = 1
    items.push({ label: label, url: url, depth: navDepth(a, root) })
  }
  if (!items.length) return
  const json = JSON.stringify(items)
  if (json === lastNavJson) return
  lastNavJson = json
  try {
    ipcRenderer.sendToHost('mdt:nav', items)
  } catch (_) {
  }
}

let clientNavigation = false

function navGo(url) {
  if (!url) return
  const links = document.querySelectorAll('a')
  for (let i = 0; i < links.length; i++) {
    if (links[i].href === url) {
      clientNavigation = true
      try { links[i].click() } finally { clientNavigation = false }
      return
    }
  }
  try {
    window.location.assign(url)
  } catch (_) {
  }
}

const SIDEBAR_STYLE_ID = 'mdt-sidebar-toggle'
const SEARCH_STYLE_ID = 'mdt-search-toggle'
let searchHidden = false
let lastErrorSound = 0
let sidebarHidden = true

function sidebarStyleEl() {
  let el = document.getElementById(SIDEBAR_STYLE_ID)
  if (!el) {
    el = document.createElement('style')
    el.id = SIDEBAR_STYLE_ID
    el.textContent = [
      'html.mdt-hide-sidebar body .sidebar,',
      'html.mdt-hide-sidebar body .sidebar-wrapper { display: none !important; }',
      'html.mdt-hide-sidebar body .main-panel {',
      '  width: 100% !important;',
      '  max-width: 100% !important;',
      '  float: none !important;',
      '  margin-left: 0 !important;',
      '  padding-left: 0 !important;',
      '}'
    ].join('\n')
    ;(document.head || document.documentElement).appendChild(el)
  }
  return el
}

function applySidebarState() {
  if (!document.documentElement || !isMdcHost()) return
  if (themeNow() !== 'off') sidebarStyleEl()
  else { const old = document.getElementById(SIDEBAR_STYLE_ID); if (old) old.remove() }
  document.documentElement.classList.toggle('mdt-hide-sidebar', sidebarHidden && themeNow() !== 'off')
  savePrefs()
}

function searchStyleEl() {
  let el = document.getElementById(SEARCH_STYLE_ID)
  if (!el) {
    el = document.createElement('style')
    el.id = SEARCH_STYLE_ID
    el.textContent = [
      'html.mdt-hide-search body #character,',
      'html.mdt-hide-search body #plate { display: none !important; }',
      'html.mdt-hide-search body form:has(#character),',
      'html.mdt-hide-search body form:has(#plate),',
      'html.mdt-hide-search body .input-group:has(#character),',
      'html.mdt-hide-search body .input-group:has(#plate),',
      'html.mdt-hide-search body .form-group:has(#character),',
      'html.mdt-hide-search body .form-group:has(#plate),',
      'html.mdt-hide-search body li:has(#character),',
      'html.mdt-hide-search body li:has(#plate) { display: none !important; }'
    ].join('\n')
    ;(document.head || document.documentElement).appendChild(el)
  }
  return el
}

function applySearchState() {
  if (!document.documentElement || !isMdcHost()) return
  if (themeNow() !== 'off') searchStyleEl()
  else { const old = document.getElementById(SEARCH_STYLE_ID); if (old) old.remove() }
  document.documentElement.classList.toggle('mdt-hide-search', searchHidden && themeNow() !== 'off')
  applySearchInputs()
  savePrefs()
}

function setSearchHidden(next) {
  searchHidden = !!next
  applySearchState()
}

let lastSoundName = ''
let lastSoundAt = 0

function sendSound(name) {
  const nowTs = Date.now()
  if (name === lastSoundName && nowTs - lastSoundAt < 400) return
  if (nowTs - lastSoundAt < 120) return
  lastSoundName = name
  lastSoundAt = nowTs
  try {
    ipcRenderer.sendToHost('mdt:sound', name)
  } catch (_) {}
}

function setSidebarHidden(next) {
  sidebarHidden = !!next
  applySidebarState()
}

const NOIMG_RE = /^no image(?:\s+(?:found|available|on file|uploaded))?\.?$/i

const SHOT_SEL = '#copyWarrant, #copyWarrantReason, [id^="copyWarrant"]'
let shotWired = 0
function watchWarrantCopy() {
  if (shotWired) return
  shotWired = 1
  document.addEventListener('click', event => {
    if (event.target.closest && event.target.closest(SHOT_SEL)) document.dispatchEvent(new Event('mdt:prepare-export'))
  }, true)
}

const KEY_RE = /^\s*index\.([A-Za-z][A-Za-z0-9]*)\s*:?\s*$/
function humanKey(raw) {
  const words = String(raw).replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
function fixLabelKeys() {
  if (!document.body) return
  const links = document.querySelectorAll('a[href*="index."]')
  for (const link of links) {
    const href = link.getAttribute('href') || ''
    if (!/^(https?:)?\/\/index\.[A-Za-z]/.test(href)) continue
    const text = document.createTextNode(link.textContent || '')
    if (link.parentNode) link.parentNode.replaceChild(text, link)
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
  const hits = []
  let node = walker.nextNode()
  while (node) {
    const raw = node.nodeValue || ''
    if (raw.indexOf('index.') !== -1) hits.push(node)
    node = walker.nextNode()
  }
  for (const hit of hits) {
    const parent = hit.parentNode
    if (!parent) continue
    const tag = (parent.nodeName || '').toLowerCase()
    if (tag === 'script' || tag === 'style' || tag === 'textarea') continue
    const raw = hit.nodeValue || ''
    const match = raw.match(KEY_RE)
    if (match) {
      const tail = raw.indexOf(':') !== -1 ? ':' : ''
      hit.nodeValue = humanKey(match[1]) + tail
      continue
    }
    const next = raw.replace(/index\.([A-Za-z][A-Za-z0-9]*)/g, function (whole, key) {
      return humanKey(key)
    })
    if (next !== raw) hit.nodeValue = next
  }
}
const WELL_SEL = '.warrantSealLogoLeft, .warrantSealLogoRight, .personPhotograph, .characterFactionLogo img, img[src*="/img/logo/"]'
function clearImageWells() {
  const shots = document.querySelectorAll(WELL_SEL)
  for (const shot of shots) {
    let node = shot.parentNode
    let depth = 0
    while (node && node.nodeType === 1 && depth < 3) {
      const tag = (node.nodeName || '').toLowerCase()
      if (tag === 'body' || tag === 'html') break
      if (node.classList && (node.classList.contains('card') || node.classList.contains('card-body'))) break
      setImportant(node, 'background', 'transparent')
      setImportant(node, 'background-color', 'transparent')
      setImportant(node, 'background-image', 'none')
      setImportant(node, 'box-shadow', 'none')
      node = node.parentNode
      depth += 1
    }
  }
}
function fixNoImage() {
  if (themeNow() === 'off') return
  const nodes = document.querySelectorAll(
    'div:not([data-mdt-noimg]), span:not([data-mdt-noimg]), p:not([data-mdt-noimg]), td:not([data-mdt-noimg]), h1:not([data-mdt-noimg]), h2:not([data-mdt-noimg]), h3:not([data-mdt-noimg]), h4:not([data-mdt-noimg]), h5:not([data-mdt-noimg])'
  )
  nodes.forEach((node) => {
    if (!NOIMG_RE.test(flatText(node))) return
    if (node.querySelector('div, span, p, td, img, h1, h2, h3, h4, h5')) return
    let host = node
    for (let i = 0; i < 4; i++) {
      const parent = host.parentElement
      if (!parent || parent === document.body) break
      if (!NOIMG_RE.test(flatText(parent))) break
      host = parent
    }
    if (host.offsetHeight < 90) {
      host.setAttribute('data-mdt-noimg', 'small')
      return
    }
    host.setAttribute('data-mdt-noimg', '1')
    setImportant(host, {
      'max-height': '26px',
      'min-height': '0',
      height: 'auto',
      overflow: 'hidden',
      padding: '2px 6px',
      margin: '0 0 4px 0',
      'font-size': '11px',
      'line-height': '20px',
      'text-align': 'center',
      opacity: '0.7'
    })
  })
}

let scrollerTimer = null
let deferredSkinPass = false
function scheduleScrollerFix() {
  if (scrollerTimer) clearTimeout(scrollerTimer)
  scrollerTimer = setTimeout(() => {
    scrollerTimer = null
    if (dragState || gripBox) { deferredSkinPass = true; return }
    deferredSkinPass = false
    if (themeNow() === 'off') { collectNav(); return }
    if (styleObserver) styleObserver.disconnect()
    try {
      applyFormFlag()
      markLookupControls()
      watchMapSearch()
      exemptDialogs()
      fixProfileDetails()
      fixContrast()
      deframeBanners()
      hideColourControls()
      colorEmotes()
      fixChargeBars()
      fixChargeRows()
      fixLicenseButtons()
      fixNoImage()
      fixPlates()
      fixTimeBadges()
      packButtonRows()
      centerFieldColumns()
      trimScrollers()
      applySidebarState()
      applySearchState()
      markLookupPage()
      fixFilterStrips()
      fixHeaderControls()
      collectNav()
      uncloak()
    } finally { observeSkinStyles() }
  }, 120)
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

function backgroundLuminance(el, cache) {
  let node = el
  let hops = 0
  const visited = []
  const remember = (value) => { visited.forEach((item) => cache.set(item, value)); return value }
  while (node && node.nodeType === 1 && hops < 40) {
    if (cache.has(node)) return remember(cache.get(node))
    visited.push(node)
    const style = getComputedStyle(node)
    const stops = /gradient\(/.test(style.backgroundImage) ? style.backgroundImage.match(/rgba?\([^)]+\)/g) : null
    if (stops && stops.length) {
      const colors = stops.map(parseRgb).filter((c) => c && c.a > 0.8)
      if (colors.length) return remember(colors.reduce((sum, c) => sum + luminance(c), 0) / colors.length)
    }
    const c = parseRgb(style.backgroundColor)
    if (c && c.a > 0.8) return remember(luminance(c))
    node = node.parentElement
    hops++
  }
  return remember(luminance(parseRgb(getComputedStyle(document.body).backgroundColor) || { r: 240, g: 240, b: 240 }))
}

function hasDirectText(el) {
  for (const n of el.childNodes) {
    if (n.nodeType === 3 && n.textContent && n.textContent.trim()) return true
  }
  return false
}

function syncCollapseButton(button) {
  if (themeNow() === 'off') { delete button.dataset.mdtCollapse; return }
  const expanded = button.getAttribute('aria-expanded')
  const plus = expanded !== null ? expanded === 'false' : /^(\+|add)$/.test(flatText(button)) || button.querySelector('.fa-plus, .glyphicon-plus')
  button.dataset.mdtCollapse = plus ? 'plus' : 'minus'
}

function fixContrast() {
  try {
    if (!document.body) return
    document.querySelectorAll('.btn-collapse').forEach(syncCollapseButton)
    const off = themeNow() === 'off'
    if (off) { restoreInk(); return }
    const backgrounds = new WeakMap()
    const repairs = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {acceptNode(el) {
      if (el.matches('script, style, noscript, [data-mdt-paper], #mugshotPreview, .cropper-container, [class^="cropper-"], [class*=" cropper-"], [class^="imgareaselect-"], .note-editor, .note-color-palette, .bootstrap-select, .bs-container, [contenteditable="true"], .modal:not(.show):not(.in)')) return NodeFilter.FILTER_REJECT
      return el.style && el.dataset && hasDirectText(el) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
    }})
    let el
    while ((el = walker.nextNode())) {
      const col = parseRgb(getComputedStyle(el).color)
      if (!col || col.a < 0.1) continue
      if (Math.max(col.r, col.g, col.b) - Math.min(col.r, col.g, col.b) > 28 && el.closest(AUTHOR_COLOR_SELECTOR)) continue

      const inkL = luminance(col)
      const bgL = backgroundLuminance(el, backgrounds)
      if (Math.abs(inkL - bgL) > 0.34) continue

      repairs.push([el, bgL > 0.5 ? '#202020' : '#FFFFFF'])
    }
    repairs.forEach(([el, color]) => {
      if (el.dataset.mdtInk === undefined) {
        el.dataset.mdtInk = el.style.getPropertyValue('color') || ''
        el.dataset.mdtInkPriority = el.style.getPropertyPriority('color') || ''
      }
      el.style.setProperty('color', color, 'important')
    })
  } catch (_) {
  }
}

function restoreInk() {
  document.querySelectorAll('[data-mdt-ink]').forEach((el) => {
    if (!el.style || !el.dataset) return
    const prev = el.dataset.mdtInk
    if (prev) el.style.setProperty('color', prev, el.dataset.mdtInkPriority || '')
    else el.style.removeProperty('color')
    delete el.dataset.mdtInk
    delete el.dataset.mdtInkPriority
  })
}

function restoreInlineColors() {
  document.querySelectorAll('[data-mdt-color]').forEach((el) => {
    if (!el.style || !el.dataset) return
    const prev = el.dataset.mdtColor
    if (prev) el.style.setProperty('color', prev)
    else el.style.removeProperty('color')
    delete el.dataset.mdtColor
  })
}

function resetPaintedState() {
  try {
    restoreBanners()
    restoreFrames()
    restoreEmotes()
    restoreRows()
    restoreScrollers()
    restoreHidden()
    restoreTimeBadges()
    restoreChargeRows()
    restoreLicenseButtons()
    restoreFilterStrips()
    restoreHeaderControls()
    restoreInk()
    restoreProfileDetails()
    restoreInlineColors()
    if (themeNow() === 'off') {
      document.querySelectorAll('.mdt-grip, .mdt-maximize, .mdt-minimize').forEach((node) => node.remove())
      document.querySelectorAll('[data-mdt-moved], [data-mdt-offset], [data-mdt-maximized]').forEach(resetModalDrag)
      document.querySelectorAll('[data-mdt-sized]').forEach(clearGripSize)
      hideNarrativeLabel()
      hideSourceTextareas()
      scanPickers()
    }
  } catch (_) {
  }
}

const FSTRIP_FIELD_SEL = [
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])',
  'select',
  '.bootstrap-select',
  '.btn',
  'button'
].join(', ')
const FSTRIP_SKIP_SEL = '.modal, [data-mdt-vanilla="1"], table, .dataTables_length, .dataTables_filter, .navbar, .sidebar, .sidebar-wrapper'
const FSTRIP_CELL_SEL = '.form-group, .bmd-form-group, .input-group, [class*="col-"]'

function fixFilterStrips() {
  try {
    if (!document.body || !document.documentElement) return
    if (themeNow() === 'off' || isFormPage() || document.documentElement.classList.contains('mdt-form-page') || document.documentElement.classList.contains('mdt-lookup')) {
      restoreFilterStrips()
      return
    }

    const byRow = new Map()
    document.body.querySelectorAll(FSTRIP_FIELD_SEL).forEach((field) => {
      if (!field.closest || field.closest(FSTRIP_SKIP_SEL)) return
      const form = field.closest('form')
      if (form && form.querySelector('textarea, .note-editor, [contenteditable="true"]')) return
      const cell = field.closest(FSTRIP_CELL_SEL)
      if (!cell || cell.querySelector('table')) return
      const row = cell.parentElement
      if (!row || row.querySelector('table')) return
      if (!byRow.has(row)) byRow.set(row, [])
      const list = byRow.get(row)
      if (list.indexOf(cell) === -1) list.push(cell)
    })

    const rows = []
    const cells = []
    byRow.forEach((list, row) => {
      if (list.length < 2) return
      rows.push(row)
      list.forEach((cell) => cells.push(cell))
    })

    document.querySelectorAll('[data-mdt-frow="1"]').forEach((el) => {
      if (rows.indexOf(el) === -1 && el.dataset) delete el.dataset.mdtFrow
    })
    document.querySelectorAll('[data-mdt-fcell="1"]').forEach((el) => {
      if (cells.indexOf(el) === -1 && el.dataset) delete el.dataset.mdtFcell
    })
    rows.forEach((el) => {
      if (el.dataset) el.dataset.mdtFrow = '1'
    })
    cells.forEach((el) => {
      if (el.dataset) el.dataset.mdtFcell = '1'
    })
  } catch (_) {
  }
}

function restoreFilterStrips() {
  document.querySelectorAll('[data-mdt-frow="1"], [data-mdt-fcell="1"]').forEach((el) => {
    if (!el.dataset) return
    delete el.dataset.mdtFrow
    delete el.dataset.mdtFcell
  })
}

const LOOKUP_TAB_RE = /^(person|id|vehicle|plate)\s+lookup$/i

function markLookupPage() {
  if (!document.documentElement) return
  let hit = false
  if (themeNow() !== 'off') {
    const links = document.querySelectorAll('.nav-tabs .nav-link, .nav-tabs a, .nav-pills .nav-link')
    for (let i = 0; i < links.length; i++) {
      if (LOOKUP_TAB_RE.test(flatText(links[i]))) {
        hit = true
        break
      }
    }
  }
  document.documentElement.classList.toggle('mdt-lookup', hit)
}

const PREFS_KEY = 'mdtViewPrefs'
const BOOT_STYLE_ID = 'mdt-boot-cloak'
let lastPrefsJson = ''
let uncloaked = false
let skinSynced = false

function savePrefs() {
  try {
    const json = JSON.stringify({ theme: theme, sidebar: sidebarHidden, search: searchHidden })
    if (json === lastPrefsJson) return
    lastPrefsJson = json
    localStorage.setItem(PREFS_KEY, json)
  } catch (_) {
  }
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return
    theme = SKINS.includes(saved.theme) ? saved.theme : 'p1'
    if (typeof saved.sidebar === 'boolean') sidebarHidden = saved.sidebar
    searchHidden = !!saved.search
    lastPrefsJson = raw
  } catch (_) {
  }
}

function cloakStyleEl() {
  let el = document.getElementById(BOOT_STYLE_ID)
  if (!el) {
    const p = paletteNow()
    el = document.createElement('style')
    el.id = BOOT_STYLE_ID
    el.textContent = [
      'html.mdt-cloak { background-color: ' + p.panel + ' !important; }',
      'html.mdt-cloak body { visibility: hidden !important; }'
    ].join('\n')
    const host = document.head || document.documentElement
    if (host) host.appendChild(el)
  }
  return el
}

function uncloak() {
  uncloaked = true
  try {
    if (document.documentElement) document.documentElement.classList.remove('mdt-cloak')
    const old = document.getElementById(BOOT_STYLE_ID)
    if (old) old.remove()
  } catch (_) {
  }
}

function cloak() {
  if (uncloaked || !document.documentElement || themeNow() === 'off') return
  cloakStyleEl()
  document.documentElement.classList.add('mdt-cloak')
  setTimeout(uncloak, 1500)
}

function earlyBoot() {
  if (!document.documentElement) return false
  try {
    applySidebarState()
    applySearchState()
    cloak()
    applyFormFlag()
    keepLast()
    applyGlass()
    applyP1()
    watchStyles()
    applySidebarState()
    applySearchState()
  } catch (_) {
  }
  return true
}

let appliedTheme = null
function applyTheme(next) {
  const prev = theme
  theme = SKINS.includes(next) ? next : 'p1'
  if (appliedTheme === theme && document.body) { applyFormFlag(); keepLast(); applyGlass(); applyP1(); uncloak(); return }
  if (document.body) appliedTheme = theme
  if (prev !== theme) resetPaintedState()
  applyFormFlag()
  keepLast()
  applyGlass()
  applyP1()
  applyDragFlag()
  exemptDialogs()
  fixProfileDetails()
  reportAlerts()
  fixPlates()
  normalizeInlineColors()
  fixContrast()
  deframeBanners()
  hideColourControls()
  colorEmotes()
  fixChargeBars()
  fixChargeRows()
  fixLicenseButtons()
  fixNoImage()
  fixLabelKeys()
  clearImageWells()
  watchWarrantCopy()
  fixTimeBadges()
  packButtonRows()
  centerFieldColumns()
  trimScrollers()
  applySidebarState()
  applySearchState()
  markLookupPage()
  fixFilterStrips()
  fixHeaderControls()
  collectNav()
  if (themeNow() === 'off') {
    document.querySelectorAll('style[id^="mdt-"]').forEach((node) => node.remove())
    document.querySelectorAll('img[data-mdt-imgur-src]').forEach((img) => {
      const src = img.getAttribute('data-mdt-imgur-src')
      if (img.mdtProxyError) img.removeEventListener('error', img.mdtProxyError)
      img.removeAttribute('data-mdt-imgur')
      img.removeAttribute('data-mdt-imgur-src')
      if (src) img.src = src
    })
  }
  savePrefs()
}

let styleObserver = null
let profileFrame = 0

function observeSkinStyles() {
  if (styleObserver && document.documentElement) styleObserver.observe(document.documentElement, {childList:true,subtree:true,characterData:true,attributes:true,attributeOldValue:true,attributeFilter:['class','style','aria-expanded','placeholder','aria-label','id']})
}

function clockOnlyChange(record) {
  if (record.type === 'attributes') return false
  const nodes = record.type === 'characterData' ? [record.target] : Array.from(record.addedNodes).concat(Array.from(record.removedNodes))
  return nodes.length > 0 && nodes.every((node) => (node.nodeType === 3 || node.nodeType === 1 && node.matches('span, b, strong, small, font, time') && !node.querySelector('input, button, a, img, script, style')) && /^\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM|GMT[+-]?\d*))?\s*$/i.test(node.textContent || ''))
}

function watchStyles() {
  if (styleObserver || !document.documentElement) return
  try {
    styleObserver = new MutationObserver((records) => {
      let restyle = false
      let content = false
      let lookup = false
      let alerts = false
      let recolor = false
      let profile = false
      for (const record of records) {
        const target = record.target.nodeType === 1 ? record.target : record.target.parentElement
        if (!target) continue
        if (themeNow() !== 'off' && target.closest('.note-toolbar')) {
          if (record.type === 'attributes' && record.attributeName === 'style') markAuthorStyle(target)
          if (record.type === 'childList') Array.from(record.addedNodes).filter((node) => node.nodeType === 1).forEach(markAuthorStyles)
        }
        if (target.closest('#navbarDropdownNotifications, .notification-count, .notification-unread')) alerts = true
        if (target.closest('script, style, .note-editor, .bootstrap-select, .bs-container, [contenteditable="true"], [data-notify], .ripple-container, .ripple, .leaflet-pane, [data-mdt-emote]') || clockOnlyChange(record)) continue
        if (record.type !== 'attributes' && target.closest('[data-mdt-profile-column]')) { profile = true; continue }
        if (record.type === 'attributes') {
          if (record.attributeName === 'style') { if (themeNow() !== 'off') markAuthorStyle(target); continue }
          const button = target.closest('.btn-collapse')
          if (button) { syncCollapseButton(button); continue }
          if (target.matches('input, [data-mdt-lookup-action]')) lookup = true
          if (target === document.documentElement || target === document.body || target.matches('button, input, a, i, [data-mdt-lookup-action]')) continue
          if (record.attributeName === 'class') {
            const old = (record.oldValue || '').split(/\s+/)
            const now = Array.from(target.classList)
            const changed = old.filter((name) => !now.includes(name)).concat(now.filter((name) => !old.includes(name)))
            if (changed.some((name) => /^(?:bg-|text-|alert-|card-header|active$|selected$|show$|in$)/.test(name)) && !target.closest('.bootstrap-select, .dropdown-menu')) content = true
          }
          continue
        }
        if (record.type === 'characterData') { content = true; continue }
        for (const node of Array.from(record.addedNodes).concat(Array.from(record.removedNodes))) {
          if (node.nodeType === 3) { if (node.textContent.trim()) content = true; continue }
          if (node.nodeType !== 1) continue
          if (node.matches('script, .mdt-grip, .bootstrap-select, .bs-container, .note-editor, [data-mdt-emote], [data-notify], .ripple-container, .ripple')) continue
          if (themeNow() !== 'off') markAuthorStyles(node)
          if (node.matches('style, link')) { if (!node.id.startsWith('mdt-') && node.isConnected) restyle = true; continue }
          if (node.matches('script, .mdt-grip, [data-mdt-emote], [data-notify], .ripple-container, .ripple')) continue
          if (node.matches('#navbarDropdownNotifications') || node.querySelector('#navbarDropdownNotifications')) alerts = true
          if (node.matches('input, button, a, i') || node.querySelector('input')) lookup = true
          if (target.closest('#cautionCodes') || node.id === 'cautionCodes') recolor = true
          content = true
        }
      }
      if (restyle) keepLast()
      if (lookup) markLookupControls()
      if (recolor) normalizeInlineColors()
      if (alerts) reportAlerts()
      if (profile && !profileFrame) profileFrame = requestAnimationFrame(() => { profileFrame = 0; fixProfileDetails() })
      if (content || restyle) scheduleScrollerFix()
    })
    observeSkinStyles()
  } catch (_) {}
}

loadPrefs()

if (!earlyBoot()) {
  const bootObserver = new MutationObserver(() => {
    if (earlyBoot()) bootObserver.disconnect()
  })
  bootObserver.observe(document, { childList: true, subtree: true })
}

document.addEventListener('DOMContentLoaded', () => {
  keepLast()
  normalizeInlineColors()
  reportPageInfo()
  scheduleScrollerFix()
  markLookupPage()
  watchMapSearch()
  watchSourceTextareas()
  hideNarrativeLabel()
  window.addEventListener('resize', scheduleScrollerFix)

  watchStyles()
})

window.addEventListener('load', () => {
  keepLast()
  normalizeInlineColors()
  scheduleScrollerFix()
  watchMapSearch()
  scheduleMapSearchFix()
  hideSourceTextareas()
  hideNarrativeLabel()
  if (skinSynced) uncloak()
  else setTimeout(uncloak, 450)
})

let VIEW_KEY_COMBOS = null
let HOTKEYS = {
  F3: 'findnext',
  F5: 'reload',
  F8: 'cycletheme',
  F10: 'togglesidebar'
}

let CTRL_HOTKEYS = {
  f: 'find',
  n: 'focusname',
  l: 'focusplate',
  '+': 'zoomin',
  '=': 'zoomin',
  '-': 'zoomout',
  '0': 'zoomreset'
}

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

if (window.addEventListener) window.addEventListener('resize', scheduleScrollerFix)

document.addEventListener('contextmenu', (e) => {
  const t = e && e.target
  if (!t || !t.closest) return
  const link = t.closest('a[href]')
  if (!link) return
  const href = String(link.href || '')
  if (!href) return
  if (/^(javascript:|mailto:|#)/i.test(link.getAttribute('href') || '')) return
  if (!/^https?:/i.test(href)) return
  e.preventDefault()
  e.stopPropagation()
  try {
    ipcRenderer.sendToHost('mdt:open-new-page', href)
  } catch (_) {}
}, true)

ipcRenderer.on('mdt:set-search-boxes', (_e, hidden) => {
  setSearchHidden(hidden)
})

document.addEventListener('click', (e) => {
  const t = e && e.target
  if (!t || !t.closest) return
  if (clientNavigation) return
  if (t.closest('.close, [data-dismiss="modal"], [data-notify="dismiss"], .swal2-close')) {
    sendSound('close')
    return
  }
  if (t.closest('a, button, .btn, .nav-link, .dropdown-item, .page-link, [role="button"]')) {
    sendSound('click')
  }
}, true)

const errorObserver = new MutationObserver((records) => {
  const now = Date.now()
  if (now - lastErrorSound < 400) return
  for (let i = 0; i < records.length; i++) {
    const added = records[i].addedNodes
    for (let j = 0; j < added.length; j++) {
      const node = added[j]
      if (!node || node.nodeType !== 1) continue
      const cls = String((node.className && node.className.baseVal) || node.className || '')
      const hit = /alert-danger|swal2-icon-error|swal2-error/.test(cls) ||
        (node.querySelector && node.querySelector('.alert-danger, .swal2-icon-error, .swal2-error'))
      if (hit) {
        lastErrorSound = now
        sendSound('error')
        return
      }
    }
  }
})

if (document.body) watchModalDrag()
else document.addEventListener('DOMContentLoaded', watchModalDrag)

function watchErrors() {
  if (!document.body) return
  try {
    errorObserver.observe(document.body, { childList: true, subtree: true })
  } catch (_) {}
}

if (document.body) watchErrors()
else document.addEventListener('DOMContentLoaded', watchErrors)

ipcRenderer.on('mdt:set-keys', (_e, payload) => {
  try {
    if (payload && payload.plain) HOTKEYS = payload.plain
    if (payload && payload.ctrl) CTRL_HOTKEYS = payload.ctrl
    if (payload && payload.mouse) MOUSE_KEYS = payload.mouse
    if (payload && payload.combos) VIEW_KEY_COMBOS = payload.combos
  } catch (_) {
  }
})

let MOUSE_KEYS = {}

function mouseCombo(e) {
  if (!e) return ''
  const n = e.button + 1
  if (n !== 2 && n !== 4 && n !== 5) return ''
  return 'Mouse' + n
}

function runMouseKey(e) {
  const combo = mouseCombo(e)
  if (!combo) return false
  const action = MOUSE_KEYS[combo]
  if (!action) return false
  e.preventDefault()
  e.stopPropagation()
  try {
    ipcRenderer.sendToHost('mdt:hotkey', action)
  } catch (_) {
  }
  return true
}

window.addEventListener('mousedown', runMouseKey, true)
window.addEventListener('auxclick', (e) => {
  if (mouseCombo(e) && MOUSE_KEYS[mouseCombo(e)]) {
    e.preventDefault()
    e.stopPropagation()
  }
}, true)

ipcRenderer.on('mdt:nav-go', (_e, url) => {
  navGo(String(url || ''))
})

ipcRenderer.on('mdt:set-sidebar', (_e, hidden) => {
  setSidebarHidden(hidden)
})


let dragEnabled = true
let dragState = null
let modalDragFrame = 0
let modalLayer = 1100
const modalLayers = new Map()
let workspaceInstalled = false
let workspaceOpen = []

const minimizedRecords = new Map()
let minimizedSequence = 0
const recordDocument = Date.now().toString(36)+Math.random().toString(36).slice(2)
function publishRecordDock() {
  for(const [id,e] of minimizedRecords) {
    if(!e.node.isConnected || !e.node.matches('.show,.in') || e.node.style.display==='none' || recordNumber(e.node)!==e.recordId) {
      e.node.removeAttribute('data-mdt-minimized')
      minimizedRecords.delete(id)
    }
  }
  ipcRenderer.sendToHost('mdt:record-dock',Array.from(minimizedRecords,([id,e])=>({id,key:e.key,recordId:e.recordId,documentId:recordDocument,url:e.url,title:e.title,color:e.color,geometry:e.geometry,scroll:e.scroll,active:id===Array.from(minimizedRecords.keys()).pop()})))
}
function recordGeometry(entry) {
  if(!entry.node.isConnected) return
  const dlg=entry.node.querySelector('.modal-dialog'),head=dlg.querySelector('.modal-header')
  if(dlg.hasAttribute('data-mdt-maximized')) return
  const r=head.getBoundingClientRect(),at=(dlg.getAttribute('data-mdt-offset')||'0,0').split(',').map(Number)
  if(!dlg.mdtDragTransform) dlg.mdtDragTransform=[dlg.style.getPropertyValue('transform'),dlg.style.getPropertyPriority('transform')]
  const x=at[0]+entry.left-r.left,y=at[1]+entry.top-r.top
  dlg.style.setProperty('transform','translate3d('+x+'px,'+y+'px,0)','important')
  dlg.setAttribute('data-mdt-offset',x+','+y)
}
function recordNumber(node) {
  return /#\s*(\d+)/.exec(flatText(node.querySelector('.modal-title')))?.[1] || ''
}
function minimizeRecord(dlg,approved=false) {
  if(!isRecordMaxTarget(dlg)) return
  const node=dlg.closest('.modal')
  if(!recordNumber(node)) return
  if(!reportIdentity(node)&&!approved) {
    node.setAttribute('data-mdt-edit-warning',recordNumber(node))
    ipcRenderer.sendToHost('mdt:record-minimize-warning',{recordId:recordNumber(node)})
    return
  }
  if(node.hasAttribute('data-mdt-minimized')) return
  const r=dlg.querySelector('.modal-header').getBoundingClientRect(),box=dlg.querySelector('.modal-content')
  const title=flatText(node.querySelector('.modal-title')).replace(/^view\s+record\s*[-:]?\s*/i,'')
  const match=title.match(/^#(\d+)\s*[-:]?\s*(.*)/)
  const type=node.querySelector('[id*="RecordType"], [id*="recordType"]')
  const entry={node,scrolls:[node].concat(Array.from(node.querySelectorAll('*'))).map(n=>[n.scrollTop,n.scrollLeft]),left:r.left,top:r.top,title:match?(match[2]||'Record')+' #'+match[1]:title,color:type?getComputedStyle(type).color:''}
  const frame=dlg.getBoundingClientRect(),content=box.getBoundingClientRect()
  entry.recordId=recordNumber(node)
  entry.url=location.href
  entry.geometry={...(dlg.mdtMaxState?.geometry||{left:r.left,top:r.top,width:frame.width,height:content.height}),maximized:dlg.hasAttribute('data-mdt-maximized')}
  const body=node.querySelector('.modal-body')
  entry.scroll={modal:[node.scrollTop,node.scrollLeft],body:[body?.scrollTop||0,body?.scrollLeft||0]}
  if(!dlg.hasAttribute('data-mdt-maximized')) {
    gripStyle(dlg,dlg,{width:dlg.getBoundingClientRect().width+'px','max-width':'none'})
    gripStyle(dlg,box,{height:box.getBoundingClientRect().height+'px'})
    dlg.setAttribute('data-mdt-sized','1')
    fitSizedModal(dlg)
  }
  const id=String(++minimizedSequence)
  entry.key=recordDocument+':'+id
  minimizedRecords.set(id,entry)
  node.setAttribute('data-mdt-minimized',id)
  document.activeElement?.blur()
  syncWorkspace()
  cacheMovedReport()
  publishRecordDock()
  setTimeout(()=>recordGeometry(entry),180)
}
function recordResult(record,success,reason='') {
  ipcRenderer.sendToHost('mdt:record-dock-result',{key:record.key||record.recordId,success,reason})
}
function nativeRecordOpen(recordId) {
  const jq=window.jQuery
  const target=Array.from(document.querySelectorAll('span[name="viewRecord"]')).find(n=>n.id===recordId)
  const events=jq&&jq._data&&jq._data(document,'events')
  const delegated=events?.click?.some(h=>/viewRecord/.test(h.selector||''))
  if(target&&(delegated||target.onclick||jq?._data?.(target,'events')?.click?.length)) { target.click(); return true }
  if(!document.querySelector('#modalViewRecord')||!delegated) return false
  const trigger=document.createElement('span')
  trigger.setAttribute('name','viewRecord');trigger.id=recordId;trigger.hidden=true
  document.body.appendChild(trigger);trigger.click();trigger.remove()
  return true
}
let recordReopenToken=0
async function reopenRecord(record) {
  const token=++recordReopenToken
  if(!/^\d+$/.test(String(record.recordId))) {recordResult(record,false,'No record ID');return}
  try {
    const opened=await webFrame.executeJavaScript('('+nativeRecordOpen.toString()+')('+JSON.stringify(String(record.recordId))+')')
    if(!opened) {recordResult(record,false,'This page has no record viewer');return}
    const start=Date.now()
    const wait=()=>{
      if(token!==recordReopenToken) return
      const node=Array.from(document.querySelectorAll('.modal.show,.modal.in')).find(n=>recordNumber(n)===String(record.recordId)&&!n.hasAttribute('data-mdt-minimized'))
      if(node) {
        setTimeout(()=>{
          if(token!==recordReopenToken||!node.isConnected) return
          const dlg=node.querySelector('.modal-dialog'),box=dlg.querySelector('.modal-content'),body=box.querySelector('.modal-body'),g=record.geometry
          if(g&&themeNow()!=='off') {
            restoreModalMax(dlg)
            gripStyle(dlg,dlg,{width:Math.max(240,Math.min(g.width,innerWidth))+'px','max-width':'none'})
            gripStyle(dlg,box,{height:Math.max(180,Math.min(g.height,innerHeight))+'px'})
            dlg.setAttribute('data-mdt-sized','1');dlg.setAttribute('data-mdt-moved','1');fitSizedModal(dlg)
            syncWorkspace()
            recordGeometry({node,left:Math.max(0,Math.min(g.left,innerWidth-dlg.getBoundingClientRect().width)),top:Math.max(0,Math.min(g.top,innerHeight-30))})
            if(g.maximized) toggleModalMax(dlg)
            syncWorkspace();raiseModal(node)
          }
          if(record.scroll) { node.scrollTop=record.scroll.modal?.[0]||0;node.scrollLeft=record.scroll.modal?.[1]||0;if(body){body.scrollTop=record.scroll.body?.[0]||0;body.scrollLeft=record.scroll.body?.[1]||0} }
          cacheMovedReport()
          recordResult(record,true)
        },220)
      } else if(Date.now()-start<12000) setTimeout(wait,100)
      else recordResult(record,false,'The MDC did not open the record')
    }
    wait()
  } catch(_) {recordResult(record,false,'The MDC could not open the record')}
}
ipcRenderer.on('mdt:record-dock-sync',()=>ipcRenderer.sendToHost('mdt:record-ready',{documentId:recordDocument}))
ipcRenderer.on('mdt:record-minimize-approved',(_e,recordId)=>{
  const node=Array.from(document.querySelectorAll('.modal[data-mdt-edit-warning]')).find(n=>n.getAttribute('data-mdt-edit-warning')===String(recordId))
  if(node&&recordNumber(node)===String(recordId)) {node.removeAttribute('data-mdt-edit-warning');minimizeRecord(node.querySelector('.modal-dialog'),true)}
})
ipcRenderer.on('mdt:record-dock',(_event,message)=>{
  if(!message||!['restore','close'].includes(message.action)) return
  const record=message.record||{}
  let entry=record.documentId===recordDocument?minimizedRecords.get(String(message.id)):null
  if(entry&&recordNumber(entry.node)!==entry.recordId) entry=null
  if(!entry) {if(message.action==='restore') reopenRecord(record);return}
  minimizedRecords.delete(String(message.id))
  if(message.action==='restore') {
    entry.node.removeAttribute('data-mdt-minimized')
    syncWorkspace();raiseModal(entry.node)
    setTimeout(()=>{recordGeometry(entry);recordResult(record,true)},180)
  } else {
    if(entry.node.hasAttribute('data-mdt-record-copy')) entry.node.remove()
    else entry.node.querySelector('.close')?.click()
  }
  publishRecordDock();syncWorkspace()
})
document.addEventListener('click',e=>{
  const target=e.target.closest&&e.target.closest('a,button')
  if(target&&/^(?:sign\s*out|log\s*out)$/i.test(flatText(target))) ipcRenderer.sendToHost('mdt:record-signout')
},true)

const reportSnapshots = new Map()
let reportCopySequence = 0
let reportCacheTimer = 0

function reportIdentity(node) {
  const title = flatText(node.querySelector('.modal-title, .modal-header'))
  if (!/^(view|show)\s+(?:(?:arrest|incident)\s+)?(?:record|report)\b/i.test(title)) return ''
  if (node.querySelector('textarea, select, input:not([type="hidden"]):not([readonly]):not([disabled]), [contenteditable="true"], .note-editor')) return ''
  const id = /#\s*(\d+)/.exec(title)
  return id ? id[1] : title + '|' + flatText(node.querySelector('.modal-body'))
}

function cacheMovedReport() {
  if (themeNow() === 'off' || dragState || gripBox) return
  const copies = !!document.querySelector('[data-mdt-record-copy]')
  document.querySelectorAll('.modal.show:not([data-mdt-record-copy]), .modal.in:not([data-mdt-record-copy])').forEach((node) => {
    const box = node.querySelector('.modal-dialog')
    if (!node.getClientRects().length || !box || !copies && !box.hasAttribute('data-mdt-moved') && !node.hasAttribute('data-mdt-minimized')) return
    const identity = reportIdentity(node)
    if (identity) {
      const snapshot = node.cloneNode(true)
      if (box.mdtMaxState && !node.hasAttribute('data-mdt-minimized')) {
        const original = [node].concat(Array.from(node.querySelectorAll('*')))
        const copies = [snapshot].concat(Array.from(snapshot.querySelectorAll('*')))
        box.mdtMaxState.styles.forEach(([element,prop,value,priority]) => {
          const target = copies[original.indexOf(element)]
          if (!target) return
          if (value) target.style.setProperty(prop,value,priority)
          else target.style.removeProperty(prop)
        })
        const frame = snapshot.querySelector('.modal-dialog')
        frame.removeAttribute('data-mdt-maximized')
        if (box.mdtMaxState.sized === null) frame.removeAttribute('data-mdt-sized')
        else frame.setAttribute('data-mdt-sized',box.mdtMaxState.sized)
      }
      reportSnapshots.set(node, {identity, snapshot})
    }
  })
}

function preserveReport(node, saved) {
  reportSnapshots.delete(node)
  const copy = saved.snapshot
  const minId=node.getAttribute('data-mdt-minimized'),entry=minimizedRecords.get(minId)
  const original=[node].concat(Array.from(node.querySelectorAll('*'))),cloned=[copy].concat(Array.from(copy.querySelectorAll('*')))
  const scrolls=entry?entry.scrolls:original.map(n=>[n.scrollTop,n.scrollLeft])
  if(entry) {
    const oldBox=node.querySelector('.modal-dialog'),newBox=copy.querySelector('.modal-dialog')
    const mapped=n=>cloned[original.indexOf(n)]
    if(oldBox.mdtGripStyle) newBox.mdtGripStyle=oldBox.mdtGripStyle.map(([n,...rest])=>[mapped(n),...rest]).filter(([n])=>n)
    if(oldBox.mdtMaxState) newBox.mdtMaxState={...oldBox.mdtMaxState,grip:oldBox.mdtMaxState.grip?.map(([n,...rest])=>[mapped(n),...rest]).filter(([n])=>n),styles:oldBox.mdtMaxState.styles.map(([n,...rest])=>[mapped(n),...rest]).filter(([n])=>n)}
    newBox.mdtDragTransform=oldBox.mdtDragTransform
    entry.node=copy
    copy.setAttribute('data-mdt-minimized',minId)
    node.removeAttribute('data-mdt-minimized')
  }
  copy.setAttribute('data-mdt-record-copy', '1')
  copy.classList.add('show')
  copy.classList.remove('fade')
  copy.style.display = 'block'
  copy.removeAttribute('aria-hidden')
  copy.setAttribute('aria-modal','false')
  const ids = new Map()
  const prefix = 'mdt-report-' + (++reportCopySequence) + '-'
  ;[copy].concat(Array.from(copy.querySelectorAll('[id]'))).forEach((el) => {
    if (!el.id) return
    ids.set(el.id, prefix + el.id)
    el.id = prefix + el.id
  })
  copy.querySelectorAll('script, input[type="hidden"], .mdt-grip, button:not(.close)').forEach((el) => el.remove())
  ;[copy].concat(Array.from(copy.querySelectorAll('*'))).forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (/^on/i.test(attr.name) || /^(data-toggle|data-target|data-dismiss)$/.test(attr.name)) el.removeAttribute(attr.name)
    })
    for (const attr of ['for','aria-labelledby','aria-describedby','headers']) {
      const value = el.getAttribute(attr)
      if (value) el.setAttribute(attr, value.split(/\s+/).map((id) => ids.get(id) || id).join(' '))
    }
    const href = el.getAttribute('href') || ''
    if (/^javascript:/i.test(href)) el.removeAttribute('href')
    else if (href.startsWith('#') && ids.has(href.slice(1))) el.setAttribute('href', '#' + ids.get(href.slice(1)))
  })
  const box = copy.querySelector('.modal-dialog')
  box.setAttribute('data-mdt-moved', '1')
  box.removeAttribute('data-mdt-dragging')
  const close = copy.querySelector('.close')
  if (close) { close.setAttribute('type','button'); close.addEventListener('click', (event) => { event.preventDefault(); event.stopImmediatePropagation(); copy.remove(); syncWorkspace() }) }
  document.body.appendChild(copy)
  cloned.forEach((n,i)=>{if(scrolls[i]) { n.scrollTop=scrolls[i][0]; n.scrollLeft=scrolls[i][1] }})
  if(entry) publishRecordDock()
  resetModalDrag(node.querySelector('.modal-dialog'))
  syncWorkspace()
  raiseModal(copy)
  raiseModal(node)
}

function watchReportReuse() {
  const observer = new MutationObserver((records) => {
    const affected = new Set()
    for (const record of records) {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement
      const modal = target && target.closest('.modal:not([data-mdt-record-copy])')
      if (modal) affected.add(modal)
    }
    if (!affected.size) return
    affected.forEach((node) => {
      const saved = reportSnapshots.get(node)
      const identity = reportIdentity(node)
      if (saved && identity && identity !== saved.identity && themeNow() !== 'off') preserveReport(node, saved)
    })
    if(Array.from(minimizedRecords.values()).some(e=>recordNumber(e.node)!==e.recordId)) {publishRecordDock();syncWorkspace()}
    clearTimeout(reportCacheTimer)
    reportCacheTimer = setTimeout(cacheMovedReport, 180)
  })
  observer.observe(document.documentElement, {subtree:true, childList:true, characterData:true})
  document.addEventListener('click', (event) => {
    const modal = event.target.closest && event.target.closest('.modal')
    if (modal && event.target.closest('.close, [data-dismiss="modal"]')) reportSnapshots.delete(modal)
    else if (!modal) cacheMovedReport()
  }, true)
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    const modal = event.target.closest && event.target.closest('.modal')
    if (modal && modal.hasAttribute('data-mdt-record-copy')) { event.preventDefault(); event.stopImmediatePropagation(); modal.remove(); syncWorkspace() }
    else if (modal) reportSnapshots.delete(modal)
  }, true)
}

function installWorkspace() {
  if (workspaceInstalled) return
  workspaceInstalled = true
  webFrame.executeJavaScript('(' + bootstrapWorkspace.toString() + ')()').catch(() => { workspaceInstalled = false })
}

function bootstrapWorkspace() {
  document.addEventListener('mdt:prepare-export', () => {
    const nativeCapture = window.html2canvas
    if (typeof nativeCapture !== 'function' || nativeCapture.mdtPaperCapture) return
    const capture = async (root, options = {}) => {
      if (!root || !/^(warrant|warrantReason)$/.test(root.id)) return nativeCapture(root, options)
      if (document.fonts) await document.fonts.ready
      const nativeClone = options.onclone
      const prepare = async clone => {
        clone.querySelectorAll('style[id^="mdt-"]').forEach(node => node.remove())
        Array.from(clone.documentElement.classList).filter(name => name.startsWith('mdt-')).forEach(name => clone.documentElement.classList.remove(name))
        const paper = clone.getElementById(root.id)
        if (!paper) return
        paper.querySelectorAll('.mdt-grip, .mdt-maximize, .mdt-minimize').forEach(node => node.remove())
        const style = clone.createElement('style')
        style.textContent = `
          #${root.id}, #${root.id} .card, #${root.id} .card-body { background: #FFF !important; color: #111 !important; box-shadow: none !important; }
          #${root.id} * { color: #111 !important; -webkit-text-fill-color: #111 !important; text-shadow: none !important; }
          #${root.id} .card-header { position: relative !important; margin: 0 !important; padding: 8px 26px !important; background: #EEE !important; box-shadow: none !important; border-bottom: 1px solid #999 !important; }
          #${root.id} .card-header * { background: transparent !important; }
          #${root.id} .btn-collapse { position: absolute !important; top: 8px !important; left: 5px !important; right: auto !important; width: 18px !important; min-height: 18px !important; padding: 0 !important; margin: 0 !important; background: #EEE !important; border: 1px solid #888 !important; transform: none !important; }
          #${root.id} .btn-collapse::before, #${root.id} .btn-collapse::after { content: none !important; }
          #${root.id} .btn-collapse > * { visibility: visible !important; }
          #${root.id} table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
          #${root.id} table :is(th,td) { color: #111 !important; background: #FFF !important; border: 1px solid #AAA !important; padding: 6px !important; white-space: normal !important; overflow-wrap: anywhere !important; font-size: 12px !important; }
          #${root.id} table thead th { background: #EEE !important; }
          #${root.id} .badge { padding: 3px 6px !important; background: #DDD !important; color: #111 !important; }
          #${root.id} .badge-warning { background: #FFB331 !important; }
          #${root.id} .badge-danger { background: #B51F18 !important; }
          #${root.id} .badge-danger, #${root.id} .badge-danger * { color: #FFF !important; -webkit-text-fill-color: #FFF !important; }
          #${root.id} .text-right:has(> .badge) { display: flex !important; flex-direction: column !important; align-items: flex-end !important; gap: 4px !important; }
          #${root.id} .text-right:has(> .badge) > br { display: none !important; }
          #${root.id} .text-right > .badge { min-width: 90px !important; text-align: center !important; }
          #${root.id} .badge > * { font: inherit !important; margin: 0 !important; }
        `
        clone.head.appendChild(style)
        if (clone.fonts) await clone.fonts.ready
        const view = clone.defaultView
        for (const icon of paper.querySelectorAll('i.fa, i.fas, i.far, i.fab, i[class*="fa-"], .material-icons')) {
          const css = view.getComputedStyle(icon), pseudo = view.getComputedStyle(icon, '::before')
          let glyph = pseudo.content
          try { glyph = JSON.parse(glyph) } catch (_) { glyph = '' }
          if (!glyph || glyph === 'none' || glyph === 'normal') glyph = icon.textContent.trim()
          if (!glyph) continue
          const family = pseudo.fontFamily || css.fontFamily, weight = pseudo.fontWeight || css.fontWeight, size = parseFloat(css.fontSize) || 12
          const font = weight + ' ' + size + 'px ' + family
          if (document.fonts) await document.fonts.load(font, glyph)
          const canvas = document.createElement('canvas'), pixels = Math.ceil(size * 1.6)
          canvas.width = canvas.height = pixels * 2
          const ctx = canvas.getContext('2d')
          ctx.scale(2, 2); ctx.font = font; ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(glyph, pixels / 2, pixels / 2)
          const image = clone.createElement('img')
          image.src = canvas.toDataURL('image/png'); image.alt = icon.getAttribute('aria-label') || ''; image.dataset.mdtExportIcon = '1'
          image.style.cssText = 'display:inline-block;width:'+size+'px;height:'+size+'px;vertical-align:middle;margin-left:'+css.marginLeft+';margin-right:'+css.marginRight
          icon.replaceWith(image)
        }
      }
      const frame = document.createElement('iframe')
      frame.setAttribute('aria-hidden', 'true')
      frame.style.cssText = 'position:fixed;left:-100000px;top:0;border:0;width:'+Math.ceil(root.getBoundingClientRect().width)+'px;height:'+innerHeight+'px;pointer-events:none'
      document.body.appendChild(frame)
      try {
        const clone = frame.contentDocument
        clone.open(); clone.write('<!doctype html><html><head></head><body></body></html>'); clone.close()
        const base = clone.createElement('base'); base.href = document.baseURI; clone.head.appendChild(base)
        const loaded = []
        document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
          if (node.id.startsWith('mdt-')) return
          const copy = node.cloneNode(true)
          if (copy.tagName === 'LINK') loaded.push(new Promise(resolve => { copy.onload = resolve; copy.onerror = resolve }))
          clone.head.appendChild(copy)
        })
        clone.body.style.margin = '0'
        clone.body.appendChild(root.cloneNode(true))
        clone.querySelectorAll('script, iframe').forEach(node => node.remove())
        clone.querySelectorAll('*').forEach(node => Array.from(node.attributes).filter(attribute => /^on/i.test(attribute.name)).forEach(attribute => node.removeAttribute(attribute.name)))
        await Promise.all(loaded)
        await prepare(clone)
        return await nativeCapture(clone.getElementById(root.id), {...options, backgroundColor:'#FFFFFF', onclone:nativeClone})
      } finally { frame.remove() }

    }
    capture.mdtPaperCapture = true
    window.html2canvas = capture
  })

  const saved = new Map()
  const backdrops = new Set()
  let syncing = false
  const instanceFor = (node) => window.jQuery && window.jQuery(node).data('bs.modal') || (window.bootstrap && window.bootstrap.Modal && typeof window.bootstrap.Modal.getInstance === 'function' && window.bootstrap.Modal.getInstance(node))
  const backdropFor = (instance) => instance.$backdrop && instance.$backdrop[0] || instance._backdrop && (instance._backdrop._element || instance._backdrop)
  function sync() {
    if (syncing) return
    syncing = true
    try {
      const active = document.documentElement.classList.contains('mdt-workspace')
      const jq = window.jQuery
      const open = Array.from(document.querySelectorAll('.modal.show, .modal.in')).filter((node) => node.getClientRects().length && !node.hasAttribute('data-mdt-minimized'))
      const native = open.filter((node) => !node.hasAttribute('data-mdt-record-copy'))
      if (active && jq) jq(document).off('focusin.bs.modal')
      document.querySelectorAll('.modal:not([data-mdt-record-copy])').forEach((node) => {
        const instance = instanceFor(node)
        if (!instance) return
        if (active && (native.includes(node) || node.hasAttribute('data-mdt-minimized'))) {
          if (!saved.has(instance)) saved.set(instance, {focus:instance._config && instance._config.focus, node})
          if (instance._config) instance._config.focus = false
          if (instance._focustrap) instance._focustrap.deactivate()
        }
        if (!saved.has(instance)) return
        const backdrop = backdropFor(instance)
        if (backdrop && backdrop.nodeType === 1) {
          backdrop.setAttribute('data-mdt-workspace-backdrop','1')
          backdrops.add(backdrop)
        }
        if (!node.getClientRects().length && !instance._isTransitioning && (instance._isShown || instance.isShown) && typeof instance.hide === 'function') instance.hide()
      })
      if (active) document.body.classList.remove('modal-open')
      else if (saved.size) {
        const top = native.sort((a, b) => Number(getComputedStyle(a).zIndex) - Number(getComputedStyle(b).zIndex)).pop()
        let pending = false
        saved.forEach(({focus,node}, instance) => {
          if (instance._config && focus !== undefined) instance._config.focus = focus
          if (instance._focustrap) instance._focustrap.deactivate()
          if (instance._isTransitioning) pending = true
          if (node === top && focus !== false) {
            if (instance._focustrap) instance._focustrap.activate()
            else if (instance._enforceFocus) instance._enforceFocus()
            else if (instance.enforceFocus) instance.enforceFocus()
          }
        })
        if (native.length) {
          document.body.classList.add('modal-open')
          backdrops.forEach((node) => node.removeAttribute('data-mdt-workspace-backdrop'))
          backdrops.clear()
          saved.clear()
        } else if (!pending && !document.querySelector('.swal2-shown, .sweet-alert.visible')) {
          if (jq) jq(document).off('focusin.bs.modal')
          const needsReset = document.body.classList.contains('modal-open') || Array.from(backdrops).some((node) => node.isConnected)
          const instances = Array.from(saved.keys()).reverse()
          const reset = instances.find((instance) => { const node = backdropFor(instance); return node && node.isConnected }) || instances[0]
          saved.forEach((value, instance) => {
            if (instance._removeBackdrop) instance._removeBackdrop()
            else if (instance.removeBackdrop) instance.removeBackdrop()
            else if (instance._backdrop && instance._backdrop.dispose) instance._backdrop.dispose()
          })
          if (needsReset && reset) {
            if (reset._resetScrollbar) reset._resetScrollbar()
            else if (reset.resetScrollbar) reset.resetScrollbar()
          }
          backdrops.forEach((node) => node.remove())
          document.body.classList.remove('modal-open')
          backdrops.clear()
          saved.clear()
        }
      }
    } finally { syncing = false }
  }
  document.addEventListener('mdt:picker-dismiss',event=>{
    const picker=window.jQuery&&window.jQuery(event.target).data('this')
    if(picker)picker.$button.trigger('click.bs.dropdown.data-api').trigger('focus')
  })
  const editorToolbars = new Map()
  let editorSkinActive = null
  function tuneEditorToolbar(note) {
    const jq = window.jQuery, context = jq && jq(note).data('summernote'), buttons = context && context.modules && context.modules.buttons
    if (!buttons || typeof buttons.updateCurrentStyle !== 'function' || editorToolbars.has(buttons) || !document.documentElement.matches('.mdt-p1,.mdt-aero')) return
    const native = buttons.updateCurrentStyle, states = new WeakMap()
    buttons.updateCurrentStyle = function(container) {
      const target = (container || this.$toolbar)?.[0]
      if (!target || !target.isConnected || !document.documentElement.matches('.mdt-p1,.mdt-aero')) return native.apply(this,arguments)
      const style = this.context.invoke('editor.currentStyle')
      const key = JSON.stringify(Object.keys(style).sort().filter(name=>['string','number','boolean'].includes(typeof style[name])||Array.isArray(style[name])&&style[name].every(value=>typeof value==='string')).map(name=>[name,style[name]]))
      if (states.get(target) === key) return
      const result = native.apply(this,arguments)
      states.set(target,key)
      return result
    }
    editorToolbars.set(buttons,native)
  }
  function syncEditorToolbars() {
    const active = document.documentElement.matches('.mdt-p1,.mdt-aero')
    if (active === editorSkinActive) return
    editorSkinActive = active
    if (active) document.querySelectorAll('textarea,.summernote').forEach(tuneEditorToolbar)
    else { editorToolbars.forEach((native,buttons)=>{buttons.updateCurrentStyle=native});editorToolbars.clear() }
  }
  const editorSkinObserver = new MutationObserver(syncEditorToolbars)
  editorSkinObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']})
  function tunePickerRows(event) {
    if (!document.documentElement.matches('.mdt-p1,.mdt-aero') || event.type === 'keydown' && !['ArrowDown','ArrowUp','Enter',' '].includes(event.key)) return
    const button = event.target.closest?.('.bootstrap-select > button.dropdown-toggle')
    const jq = window.jQuery, picker = button && jq && jq(button.parentElement.querySelector('select')).data('selectpicker')
    if (!picker || Object.hasOwn(picker,'mdtVirtualScroll') || !picker.options || !picker.selectpicker) return
    const size = picker.options.virtualScroll, rows = picker.selectpicker.main.data
    if (typeof size !== 'number' || size <= 80 || rows.length < 80) return
    picker.mdtVirtualScroll = size
    picker.options.virtualScroll = 80
  }
  function restorePickerRows(picker, refresh) {
    if (!picker || !Object.hasOwn(picker,'mdtVirtualScroll')) return
    picker.options.virtualScroll = picker.mdtVirtualScroll
    delete picker.mdtVirtualScroll
    if (refresh) picker.setSize()
  }
  document.addEventListener('click',tunePickerRows,true)
  document.addEventListener('keydown',tunePickerRows,true)
  window.addEventListener('wheel', event => {
    if (event.ctrlKey) return
    const menu = event.target.closest?.('.dropdown-menu')
    const list = menu?.closest('.bootstrap-select,.bs-container')?.querySelector('div.inner[data-mdt-picker-list]')
    if (!list) return
    const factor = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? list.clientHeight : 1
    list.scrollTop += event.deltaY * factor
    event.preventDefault()
    event.stopPropagation()
  }, {capture:true,passive:false})
  function applyPickerFit(picker, state) {
    const menu = picker.$menu[0], list = picker.$menuInner[0]
    menu.style.setProperty('height', state.height+'px', 'important')
    menu.style.setProperty('max-height', state.height+'px', 'important')
    menu.style.setProperty('min-height', '0', 'important')
    menu.style.setProperty('overflow', 'hidden', 'important')
    list.style.setProperty('height', state.innerHeight+'px', 'important')
    list.style.setProperty('max-height', state.innerHeight+'px', 'important')
    list.style.setProperty('min-height', '0', 'important')
    list.style.setProperty('overflow-y', 'auto', 'important')
    list.style.setProperty('overflow-x', 'hidden', 'important')
    list.style.setProperty('scrollbar-gutter', 'stable', 'important')
    list.style.setProperty('scrollbar-width', 'auto', 'important')
    list.style.setProperty('scrollbar-color', 'auto', 'important')
    list.style.setProperty('overscroll-behavior', 'contain', 'important')
    list.setAttribute('data-mdt-picker-list', '1')
    picker.sizeInfo.menuInnerHeight = state.innerHeight
    picker.$newElement.toggleClass('dropup', state.up)
    picker.selectpicker.dropup = state.up
  }
  document.addEventListener('mdt:picker-fit', event => {
    const jq = window.jQuery, picker = jq && jq(event.target).data('selectpicker')
    if (!picker || !picker.sizeInfo || !picker.sizeInfo.menuExtras) return
    let fit
    try { fit = JSON.parse(event.detail) } catch (_) { return }
    let state = picker.mdtFixedMenu
    if (fit === null) {
      if (!state) { restorePickerRows(picker,false); return }
      picker.setMenuSize = state.native
      picker.options.windowPadding = state.padding
      state.styles.forEach(([node, values])=>values.forEach(([key,value,priority])=>{if(value)node.style.setProperty(key,value,priority);else node.style.removeProperty(key)}))
      picker.$menuInner[0].removeAttribute('data-mdt-picker-list')
      delete picker.mdtFixedMenu
      const open = picker.$newElement.hasClass('show') || picker.$newElement.hasClass('open')
      if (Object.hasOwn(picker,'mdtVirtualScroll')) restorePickerRows(picker,open)
      else if (open) picker.setMenuSize()
      return
    }
    if (!fit || !Array.isArray(fit.padding) || fit.padding.length!==4 || !fit.padding.every(Number.isFinite) || !Number.isFinite(fit.limit)) return
    if (!state) {
      const keys = ['height','max-height','min-height','overflow','overflow-x','overflow-y','scrollbar-gutter','scrollbar-width','scrollbar-color','overscroll-behavior','transition-property']
      state = {native:picker.setMenuSize,padding:picker.options.windowPadding.slice(),styles:[picker.$menu[0],picker.$menuInner[0]].map(node=>[node,keys.map(key=>[key,node.style.getPropertyValue(key),node.style.getPropertyPriority(key)])])}
      picker.mdtFixedMenu = state
      picker.setMenuSize = function(){applyPickerFit(this,state)}
    }
    picker.$menu[0].style.setProperty('transition-property','opacity','important')
    picker.$menu[0].style.setProperty('transform','none','important')
    picker.options.windowPadding = fit.padding
    state.native.call(picker)
    const menu = picker.$menu[0], list = picker.$menuInner[0]
    const extra = Math.max(0, menu.offsetHeight-list.offsetHeight)
    const data = picker.selectpicker.current.data, last = data[data.length-1]
    if (!state.contentHeight) state.contentHeight = Math.max(list.scrollHeight,last && last.position || 0)
    state.height = Math.max(1,Math.min(fit.limit,extra+state.contentHeight))
    state.innerHeight = Math.max(0,state.height-extra)
    state.up = !!fit.up
    applyPickerFit(picker,state)
  })
  document.addEventListener('mdt:workspace', sync)
  function lifecycle() {
    document.dispatchEvent(new Event('mdt:modal-lifecycle'))
    sync()
  }
  function wire() {
    if (window.jQuery) {
      window.jQuery(document).on('show.bs.modal.mdtWorkspace shown.bs.modal.mdtWorkspace hidden.bs.modal.mdtWorkspace', lifecycle)
      window.jQuery(document).on('summernote.init.mdtToolbar',event=>tuneEditorToolbar(event.target))
      window.jQuery(document).on('summernote.destroy.mdtToolbar',event=>{editorToolbars.forEach((native,buttons)=>{if(buttons.context?.$note?.[0]===event.target){buttons.updateCurrentStyle=native;editorToolbars.delete(buttons)}});setTimeout(()=>tuneEditorToolbar(event.target),0)})
      syncEditorToolbars()
      window.jQuery(document).on('hidden.bs.select.mdtRows',event=>restorePickerRows(window.jQuery(event.target).data('selectpicker'),false))
    }
    else ['show.bs.modal','shown.bs.modal','hidden.bs.modal'].forEach((name) => document.addEventListener(name,lifecycle))
    sync()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire, {once:true})
  else wire()
}

function syncWorkspace() {
  if(Array.from(minimizedRecords.values()).some(e=>!e.node.isConnected||!e.node.matches('.show,.in')||e.node.style.display==='none')) publishRecordDock()
  document.querySelectorAll('.modal[data-mdt-minimized]').forEach(node=>{if(node.style.display==='none') node.removeAttribute('data-mdt-minimized')})
  const open = Array.from(document.querySelectorAll('.modal.show, .modal.in')).filter((node) => node.getClientRects().length && !node.hasAttribute('data-mdt-minimized'))
  const root = document.documentElement
  const floating = themeNow() !== 'off' && (dragEnabled || minimizedRecords.size>0) && (open.length > 0 || minimizedRecords.size > 0) && (minimizedRecords.size > 0 || root.classList.contains('mdt-workspace') || open.some((node) => node.querySelector('[data-mdt-moved="1"]')))
  const changed = root.classList.contains('mdt-workspace') !== floating
  const windowsChanged = open.length !== workspaceOpen.length || open.some((node,index) => node !== workspaceOpen[index])
  workspaceOpen = open
  if (changed) root.classList.toggle('mdt-workspace', floating)
  if (changed || floating && windowsChanged) document.dispatchEvent(new Event('mdt:workspace'))
  modalLayers.forEach((saved, node) => {
    if (!open.includes(node) || !floating) {
      if (saved[0]) node.style.setProperty('z-index', saved[0], saved[1])
      else node.style.removeProperty('z-index')
      modalLayers.delete(node)
    }
  })
}

function raiseModal(node) {
  if (!node || node.hasAttribute('data-mdt-minimized') || !document.documentElement.classList.contains('mdt-workspace')) return
  if (!modalLayers.has(node)) modalLayers.set(node, [node.style.getPropertyValue('z-index'), node.style.getPropertyPriority('z-index')])
  if (modalLayer >= 1400) {
    Array.from(modalLayers.keys()).sort((a,b) => Number(a.style.zIndex)-Number(b.style.zIndex)).forEach((modal,index) => modal.style.setProperty('z-index', String(1100+index), 'important'))
    modalLayer = 1100 + modalLayers.size
  }
  node.style.setProperty('z-index', String(++modalLayer), 'important')
}

document.addEventListener('wheel', (event) => {
  if (themeNow() === 'off' || event.ctrlKey || !event.target.closest) return
  const menu = event.target.closest('.dropdown-menu')
  const picker = menu && menu.closest('.bootstrap-select, .bs-container')
  const list = picker && picker.querySelector('.dropdown-menu > div.inner')
  if (list) {
    const factor = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? list.clientHeight : 1
    list.scrollTop += event.deltaY * factor
    event.preventDefault()
    event.stopPropagation()
    return
  }
  const content = event.target.closest('.modal-content')
  const modal = content && content.closest('.modal.show, .modal.in')
  if (!modal) return
  const factor = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? modal.clientHeight : 1
  const deltaY = event.deltaY * factor
  const deltaX = event.deltaX * factor
  let node = event.target.nodeType === 1 ? event.target : event.target.parentElement
  while (node && modal.contains(node)) {
    const style = getComputedStyle(node)
    const vertical = /auto|scroll|overlay/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1
    const horizontal = /auto|scroll|overlay/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1
    const beforeY = node.scrollTop
    const beforeX = node.scrollLeft
    if (vertical && deltaY) node.scrollTop += deltaY
    if (horizontal && deltaX) node.scrollLeft += deltaX
    if (node.scrollTop !== beforeY || node.scrollLeft !== beforeX) break
    node = node.parentElement
  }
  event.preventDefault()
  event.stopPropagation()
}, { capture: true, passive: false })

function applyDragFlag() {
  try {
    if (themeNow() === 'off') {
      minimizedRecords.forEach(e=>e.node.removeAttribute('data-mdt-minimized'))
      minimizedRecords.clear()
      publishRecordDock()
      document.querySelectorAll('[data-mdt-record-copy]').forEach((node) => node.remove())
      reportSnapshots.clear()
    }
    document.documentElement.classList.toggle('mdt-drag', !!dragEnabled && themeNow() !== 'off')
    if (themeNow() !== 'off') installWorkspace()
    syncWorkspace()
  } catch (_) {}
}

function dragTarget(node) {
  if (!node || !node.closest) return null
  const head = node.closest('.modal-header, .swal2-header')
  if (!head || node.closest('button, a, input, select, textarea, .close')) return null
  return head.closest('.modal-dialog, .swal2-popup')
}

function startModalDrag(e) {
  if (themeNow() === 'off' || !dragEnabled || !e || e.button !== 0) return
  const box = dragTarget(e.target)
  if (!box || box.hasAttribute('data-mdt-maximized')) return
  const at = (box.getAttribute('data-mdt-offset') || '0,0').split(',').map(Number)
  const rect = box.getBoundingClientRect()
  const handle = e.target.closest('.modal-header, .swal2-header')
  handle.setPointerCapture(e.pointerId)
  box.setAttribute('data-mdt-dragging', '1')
  dragState = { box, handle, pointer:e.pointerId, ox:at[0] || 0, oy:at[1] || 0, sx:e.clientX, sy:e.clientY, left:rect.left, top:rect.top, width:rect.width, x:at[0] || 0, y:at[1] || 0, moved:false }
  e.preventDefault()
}

function paintModalDrag() {
  modalDragFrame = 0
  if (!dragState || !dragState.moved) return
  dragState.box.style.setProperty('transform', 'translate3d(' + dragState.x + 'px,' + dragState.y + 'px,0)', 'important')
}

function moveModalDrag(e) {
  if (!dragState || e.pointerId !== dragState.pointer) return
  const state = dragState
  if (!state.moved && Math.abs(e.clientX - state.sx) + Math.abs(e.clientY - state.sy) < 4) return
  if (!state.moved) {
    state.moved = true
    if (!state.box.mdtDragTransform) state.box.mdtDragTransform = [state.box.style.getPropertyValue('transform'), state.box.style.getPropertyPriority('transform')]
    state.box.setAttribute('data-mdt-moved', '1')
    syncWorkspace()
    const settled = state.box.getBoundingClientRect()
    state.baseLeft = settled.left - state.ox
    state.baseTop = settled.top - state.oy
    const header = state.handle.getBoundingClientRect()
    state.headLeft = header.left - state.ox
    state.headTop = header.top - state.oy
    state.headWidth = header.width
    state.headHeight = header.height
    state.ox += state.left - settled.left
    state.oy += state.top - settled.top
    raiseModal(state.box.closest('.modal'))
  }
  state.x = Math.min(Math.max(state.ox + e.clientX - state.sx, -state.headLeft), Math.max(0, innerWidth - state.headWidth) - state.headLeft)
  state.y = Math.min(Math.max(state.oy + e.clientY - state.sy, -state.headTop), Math.max(0, innerHeight - state.headHeight) - state.headTop)
  if (!modalDragFrame) modalDragFrame = requestAnimationFrame(paintModalDrag)
  e.preventDefault()
}

function endModalDrag() {
  if (!dragState) return
  if (modalDragFrame) cancelAnimationFrame(modalDragFrame)
  paintModalDrag()
  if (dragState.moved) dragState.box.setAttribute('data-mdt-offset', dragState.x + ',' + dragState.y)
  if (dragState.handle.hasPointerCapture(dragState.pointer)) dragState.handle.releasePointerCapture(dragState.pointer)
  dragState.box.removeAttribute('data-mdt-dragging')
  dragState = null
  if (deferredSkinPass) scheduleScrollerFix()
  cacheMovedReport()
}

function resetModalDrag(box) {
  if (!box) return
  restoreModalMax(box)
  if (dragState && dragState.box === box) endModalDrag()
  box.removeAttribute('data-mdt-moved')
  box.removeAttribute('data-mdt-offset')
  if (box.mdtDragTransform) {
    const saved = box.mdtDragTransform
    if (saved[0]) box.style.setProperty('transform', saved[0], saved[1])
    else box.style.removeProperty('transform')
    delete box.mdtDragTransform
  }
  syncWorkspace()
}

function styleTipList(list, p) {
  list.setAttribute('data-mdt-tip', '1')
  list.style.setProperty('position', 'absolute', 'important')
  list.style.setProperty('top', '100%', 'important')
  list.style.setProperty('bottom', 'auto', 'important')
  list.style.setProperty('left', '0', 'important')
  list.style.setProperty('right', 'auto', 'important')
  list.style.setProperty('margin', '2px 0 0 0', 'important')
  list.style.setProperty('padding', '0', 'important')
  list.style.setProperty('width', '252px', 'important')
  list.style.setProperty('max-height', '220px', 'important')
  list.style.setProperty('overflow-y', 'auto', 'important')
  list.style.setProperty('overflow-x', 'hidden', 'important')
  list.style.setProperty('background-color', p.panel, 'important')
  list.style.setProperty('background-image', 'none', 'important')
  list.style.setProperty('color', p.text, 'important')
  list.style.setProperty('border', '1px solid ' + p.border, 'important')
  list.style.setProperty('border-radius', '0', 'important')
  list.style.setProperty('box-shadow', '0 4px 10px rgba(0, 0, 0, 0.35)', 'important')
  list.style.setProperty('opacity', '1', 'important')
  list.style.setProperty('z-index', '1500', 'important')
  list.style.setProperty('list-style', 'none', 'important')
}

function styleTipRow(tip, p) {
  tip.setAttribute('data-mdt-tip-row', '1')
  tip.style.setProperty('display', 'block', 'important')
  tip.style.setProperty('margin', '0', 'important')
  tip.style.setProperty('padding', '4px 8px', 'important')
  tip.style.setProperty('background-color', p.panelAlt, 'important')
  tip.style.setProperty('background-image', 'none', 'important')
  tip.style.setProperty('color', p.text, 'important')
  tip.style.setProperty('border', 'none', 'important')
  tip.style.setProperty('border-bottom', '1px solid ' + p.borderLite, 'important')
  tip.style.setProperty('font-size', '11px', 'important')
  tip.style.setProperty('white-space', 'nowrap', 'important')
  tip.style.setProperty('overflow', 'hidden', 'important')
  tip.style.setProperty('text-overflow', 'ellipsis', 'important')
  tip.style.setProperty('cursor', 'pointer', 'important')
}

function fixMapSearch() {
  if (themeNow() === 'off') return
  const controls = document.querySelectorAll('.leaflet-control-search')
  if (!controls.length) return
  const p = paletteNow()
  for (const ctl of controls) {
    ctl.style.setProperty('position', 'relative', 'important')
    ctl.style.setProperty('overflow', 'visible', 'important')
    ctl.style.setProperty('z-index', '1400', 'important')
    const lists = ctl.querySelectorAll('ul, .search-tooltip, [class*="tooltip"]')
    for (const list of lists) {
      if (list.getAttribute('data-mdt-tip') !== '1') styleTipList(list, p)
      for (const tip of list.children) {
        if (tip.getAttribute('data-mdt-tip-row') !== '1') styleTipRow(tip, p)
      }
    }
  }
}

let mapSearchTimer = null

function scheduleMapSearchFix() {
  if (mapSearchTimer) return
  mapSearchTimer = setTimeout(() => {
    mapSearchTimer = null
    fixMapSearch()
  }, 80)
}

let mapSearchWatching = false
function watchMapSearch() {
  if (mapSearchWatching || !document.querySelector('#map, .leaflet-container')) return
  if (!document.body) return
  mapSearchWatching = true
  scheduleMapSearchFix()
  const obs = new MutationObserver((records) => {
    if (records.some((record) => record.target.nodeType === 1 && record.target.closest('#map, .leaflet-container, .leaflet-control-search'))) scheduleMapSearchFix()
  })
  obs.observe(document.body, { childList: true, subtree: true })
  document.addEventListener('input', scheduleMapSearchFix, true)
  document.addEventListener('keyup', scheduleMapSearchFix, true)
  document.addEventListener('focusin', scheduleMapSearchFix, true)
}

function hideNarrativeLabel() {
  if (themeNow() === 'off') {
    document.querySelectorAll('[data-mdt-nolabel]').forEach((el) => { el.style.removeProperty('display'); el.removeAttribute('data-mdt-nolabel') })
    return
  }
  const list = document.querySelectorAll('.card-text, h1, h2, h3, h4, h5, label')
  for (const el of list) {
    if (el.getAttribute('data-mdt-nolabel') === '1') continue
    if (el.closest('.note-editor') || el.closest('.note-frame')) continue
    if (el.querySelector('.note-editor, textarea, input, select, .btn')) continue
    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().replace(/[:\s]+$/, '')
    if (txt !== 'Narrative') continue
    el.setAttribute('data-mdt-nolabel', '1')
    el.style.setProperty('display', 'none', 'important')
  }
}

function inCodeView(el) {
  const fr = el.closest('.note-frame, .note-editor')
  return !!fr && fr.classList.contains('codeview')
}

function hideOneTextarea(el) {
  if (!el) return
  if (inCodeView(el)) {
    el.style.removeProperty('display')
    el.removeAttribute('data-mdt-src-hidden')
    return
  }
  if (el.getAttribute('data-mdt-src-hidden') === '1') return
  el.setAttribute('data-mdt-src-hidden', '1')
  el.style.setProperty('display', 'none', 'important')
}

function hideSourceTextareas() {
  if (themeNow() === 'off') {
    document.querySelectorAll('[data-mdt-src-hidden]').forEach((el) => { el.style.removeProperty('display'); el.removeAttribute('data-mdt-src-hidden') })
    return
  }
  const sel = [
    'textarea.summernote',
    '.note-editor + textarea',
    '.note-frame + textarea',
    '.note-editor textarea',
    '.note-frame textarea',
    'textarea.note-codable'
  ].join(', ')
  for (const el of document.querySelectorAll(sel)) hideOneTextarea(el)
  for (const fr of document.querySelectorAll('.note-editor')) {
    const box = fr.parentElement
    if (!box) continue
    for (const el of box.querySelectorAll(':scope > textarea')) hideOneTextarea(el)
  }
}

let srcTextareaTimer = null

function scheduleSourceTextareaFix() {
  if (srcTextareaTimer) return
  srcTextareaTimer = setTimeout(() => {
    srcTextareaTimer = null
    hideSourceTextareas()
    hideNarrativeLabel()
  }, 120)
}

function watchSourceTextareas() {
  hideSourceTextareas()
  try {
    const ob = new MutationObserver((records) => {
      if (records.some((record) => Array.from(record.addedNodes).concat(Array.from(record.removedNodes)).some((node) => node.nodeType === 1 && (node.matches('textarea, .note-editor, .note-frame') || node.querySelector('textarea, .note-editor, .note-frame'))))) scheduleSourceTextareaFix()
    })
    ob.observe(document.documentElement, { childList: true, subtree: true })
  } catch (_) {
  }
}

let gripBox = null
let gripStartX = 0
let gripStartY = 0
let gripW = 0
let gripH = 0
let gripFrame = 0
let gripSize = null

function gripStyle(dlg, node, properties) {
  if (!node) return
  if (!dlg.mdtGripStyle) dlg.mdtGripStyle = []
  for (const [prop, value] of Object.entries(properties)) {
    if (!dlg.mdtGripStyle.some(([savedNode, savedProp]) => savedNode === node && savedProp === prop)) dlg.mdtGripStyle.push([node, prop, node.style.getPropertyValue(prop), node.style.getPropertyPriority(prop)])
    if (node.style.getPropertyValue(prop) !== value || node.style.getPropertyPriority(prop) !== 'important') node.style.setProperty(prop, value, 'important')
  }
}

function fitSizedModal(dlg) {
  if (!dlg || !dlg.hasAttribute('data-mdt-sized')) return
  const box = dlg.querySelector('.modal-content')
  gripStyle(dlg, box, {display:'flex', 'flex-direction':'column', 'min-height':'0', 'max-height':'none'})
  gripStyle(dlg, box && box.querySelector(':scope > .modal-body'), {flex:'1 1 0px', height:'auto', 'min-height':'0', 'max-height':'none'})
}

function restoreModalMax(dlg) {
  const state = dlg && dlg.mdtMaxState
  if (!state) return
  state.styles.forEach(([node, prop, value, priority]) => {
    if (value) node.style.setProperty(prop, value, priority)
    else node.style.removeProperty(prop)
  })
  if (state.sized === null) dlg.removeAttribute('data-mdt-sized')
  else dlg.setAttribute('data-mdt-sized', state.sized)
  dlg.mdtGripStyle = state.grip
  dlg.removeAttribute('data-mdt-maximized')
  delete dlg.mdtMaxState
  const button = dlg.querySelector('.mdt-maximize')
  if (button) { button.title = 'Maximize'; button.setAttribute('aria-label', 'Maximize'); button.setAttribute('aria-pressed', 'false') }
}

function toggleModalMax(dlg) {
  if (!dlg || themeNow() === 'off' || !isRecordMaxTarget(dlg)) return
  if (dlg.mdtMaxState) { restoreModalMax(dlg); return }
  endModalDrag()
  endGrip()
  const box = dlg.querySelector('.modal-content')
  const body = box && box.querySelector(':scope > .modal-body')
  if (!box || !body) return
  const properties = [
    [dlg.closest('.modal'), {'scrollbar-gutter':'auto'}],
    [dlg, {position:'fixed',left:'0',top:'0',margin:'0',padding:'0',width:'100vw',height:'100vh','max-width':'none','min-height':'0',transform:'none','box-sizing':'border-box'}],
    [box, {width:'100%',height:'100%',display:'flex','flex-direction':'column','min-height':'0','max-height':'none','box-sizing':'border-box'}],
    [body, {flex:'1 1 0px',height:'auto','min-height':'0','max-height':'none'}]
  ]
  dlg.mdtMaxState = {geometry:{left:dlg.querySelector('.modal-header').getBoundingClientRect().left,top:dlg.querySelector('.modal-header').getBoundingClientRect().top,width:dlg.getBoundingClientRect().width,height:box.getBoundingClientRect().height},sized:dlg.getAttribute('data-mdt-sized'),grip:dlg.mdtGripStyle && dlg.mdtGripStyle.slice(),styles:properties.flatMap(([node, props])=>Object.keys(props).map(prop=>[node,prop,node.style.getPropertyValue(prop),node.style.getPropertyPriority(prop)]))}
  dlg.setAttribute('data-mdt-sized','1')
  dlg.setAttribute('data-mdt-maximized','1')
  properties.forEach(([node,props])=>gripStyle(dlg,node,props))
  const button = dlg.querySelector('.mdt-maximize')
  if (button) { button.title = 'Restore'; button.setAttribute('aria-label', 'Restore'); button.setAttribute('aria-pressed', 'true') }
  raiseModal(dlg.closest('.modal'))
}

function paintGrip() {
  gripFrame = 0
  if (!gripBox || !gripSize) return
  const dlg = gripBox
  const head = dlg.querySelector('.modal-header') || dlg.querySelector('.modal-content')
  const at = (dlg.getAttribute('data-mdt-offset') || '0,0').split(',').map(Number)
  gripStyle(dlg, dlg, {width:gripSize.width+'px', 'max-width':gripSize.width+'px'})
  dlg.setAttribute('data-mdt-sized', '1')
  gripStyle(dlg, dlg.querySelector('.modal-content'), {height:gripSize.height+'px'})
  fitSizedModal(dlg)
  const settled = head.getBoundingClientRect()
  const x = at[0] + gripPointer.left - settled.left
  const y = at[1] + gripPointer.top - settled.top
  if (!dlg.mdtDragTransform) dlg.mdtDragTransform = [dlg.style.getPropertyValue('transform'), dlg.style.getPropertyPriority('transform')]
  dlg.style.setProperty('transform', 'translate3d('+x+'px,'+y+'px,0)', 'important')
  dlg.setAttribute('data-mdt-offset', x+','+y)
}

function isRecordMaxTarget(dlg) {
  return !!dlg && /^view\s+record\b/i.test(flatText(dlg.querySelector('.modal-title')))
}

function addGrips() {
  if (themeNow() === 'off') return
  const list = document.querySelectorAll('.modal.show .modal-content, .modal.in .modal-content')
  for (const box of list) {
    const head = box.querySelector(':scope > .modal-header')
    if (!isRecordMaxTarget(box.closest('.modal-dialog'))) {
      restoreModalMax(box.closest('.modal-dialog'))
      head?.querySelectorAll('.mdt-maximize,.mdt-minimize').forEach(n=>n.remove())
    }
    if(head && isRecordMaxTarget(box.closest('.modal-dialog')) && !head.querySelector('.mdt-minimize')) {
      const b=document.createElement('button');b.type='button';b.className='mdt-minimize';b.title='Minimize';b.setAttribute('aria-label','Minimize');head.appendChild(b)
    }
    if (head && isRecordMaxTarget(box.closest('.modal-dialog')) && !head.querySelector('.mdt-maximize')) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'mdt-maximize'
      const maximized=box.closest('.modal-dialog').hasAttribute('data-mdt-maximized')
      button.title = maximized?'Restore':'Maximize'
      button.setAttribute('aria-label',button.title)
      button.setAttribute('aria-pressed',String(maximized))
      head.appendChild(button)
    }
    if (box.querySelector('.mdt-grip')) continue
    const g = document.createElement('div')
    g.className = 'mdt-grip'
    g.setAttribute('data-mdt-grip', '1')
    g.setAttribute('title', 'Drag to resize')
    box.appendChild(g)
  }
}

let gripPointer = null
let gripClickUntil = 0
let gripReleasePoint = null

function startGrip(e) {
  if (themeNow() === 'off' || e.button !== 0) return
  const g = e.target && e.target.closest ? e.target.closest('.mdt-grip') : null
  if (!g) return
  const dlg = g.closest('.modal-dialog')
  if (!dlg || dlg.hasAttribute('data-mdt-maximized')) return
  const r = dlg.getBoundingClientRect()
  const box = dlg.querySelector('.modal-content')
  const header = (dlg.querySelector('.modal-header') || box).getBoundingClientRect()
  gripBox = dlg
  gripPointer = { node: g, id: e.pointerId, left:header.left, top:header.top, frameLeft:r.left, frameTop:box.getBoundingClientRect().top }
  gripSize = null
  g.setAttribute('data-mdt-resizing', '1')
  gripStartX = e.clientX
  gripStartY = e.clientY
  gripW = r.width
  gripH = box.getBoundingClientRect().height
  g.setPointerCapture(e.pointerId)
  e.preventDefault()
  e.stopImmediatePropagation()
}

function moveGrip(e) {
  if (!gripBox || !gripPointer || e.pointerId !== gripPointer.id) return
  const minW = Math.min(320, innerWidth)
  const minH = Math.min(220, innerHeight)
  const w = Math.min(Math.max(minW, gripW + e.clientX - gripStartX), Math.max(minW, innerWidth - gripPointer.frameLeft))
  const h = Math.min(Math.max(minH, gripH + e.clientY - gripStartY), Math.max(minH, innerHeight - gripPointer.frameTop))
  gripSize = {width:w, height:h}
  if (!gripFrame) gripFrame = requestAnimationFrame(paintGrip)
  e.preventDefault()
  e.stopImmediatePropagation()
}

function endGrip(e) {
  if (!gripBox) return
  if (gripFrame) cancelAnimationFrame(gripFrame)
  paintGrip()
  gripClickUntil = Date.now() + 400
  gripReleasePoint = e && Number.isFinite(e.clientX) ? { x: e.clientX, y: e.clientY } : null
  if (gripPointer) {
    gripPointer.node.removeAttribute('data-mdt-resizing')
    if (gripPointer.node.hasPointerCapture(gripPointer.id)) gripPointer.node.releasePointerCapture(gripPointer.id)
  }
  gripBox = null
  gripPointer = null
  gripSize = null
  if (pinned.length) schedulePickerScan()
  if (deferredSkinPass) scheduleScrollerFix()
  if (e && e.stopImmediatePropagation) {
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}

function clearGripSize(dlg) {
  restoreModalMax(dlg)
  if (!dlg || !dlg.mdtGripStyle) return
  const saved = dlg.mdtGripStyle
  saved.forEach(([node, prop, value, priority]) => {
    if (value) node.style.setProperty(prop, value, priority)
    else node.style.removeProperty(prop)
  })
  dlg.removeAttribute('data-mdt-sized')
  delete dlg.mdtGripStyle
}

const pinned = []
const raised = []
const pickerObserved = new Set()
const pickerResizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(()=>{if(pinned.length) schedulePickerScan()}) : null
function observePickerBounds() {
  if (!pickerResizeObserver) return
  const wanted = new Set()
  pinned.forEach(menu=>{const host=menu.parentElement;for(const n of [host?.querySelector(':scope > button'),host?.closest('.modal-body')])if(n)wanted.add(n)})
  pickerObserved.forEach(n=>{if(!wanted.has(n)){pickerResizeObserver.unobserve(n);pickerObserved.delete(n)}})
  wanted.forEach(n=>{if(!pickerObserved.has(n)){pickerObserved.add(n);pickerResizeObserver.observe(n)}})
}

function raiseChain(menu) {
  let n = menu.parentElement
  while (n && n !== document.body && n !== document.documentElement) {
    let cs = null
    try {
      cs = getComputedStyle(n)
    } catch (err) {
      break
    }
    if (cs && cs.position !== 'static' && n.getAttribute('data-mdt-raise') !== '1') {
      n.setAttribute('data-mdt-raise', '1')
      n.mdtOldZ = n.style.getPropertyValue('z-index')
      n.style.setProperty('z-index', '2147483000', 'important')
      raised.push(n)
    }
    if (n.classList && (n.classList.contains('modal-content') || n.classList.contains('modal'))) break
    n = n.parentElement
  }
}

function dropChain() {
  while (raised.length) {
    const el = raised.pop()
    if (!el || !el.style) continue
    el.removeAttribute('data-mdt-raise')
    el.style.removeProperty('z-index')
    if (el.mdtOldZ) el.style.setProperty('z-index', el.mdtOldZ)
    el.mdtOldZ = ''
  }
}

function pinOrigin(el) {
  let n = el.parentElement
  while (n && n !== document.body && n !== document.documentElement) {
    let cs = null
    try {
      cs = getComputedStyle(n)
    } catch (err) {
      return null
    }
    if (cs && ((cs.transform && cs.transform !== 'none') || (cs.filter && cs.filter !== 'none') || (cs.perspective && cs.perspective !== 'none'))) return n
    n = n.parentElement
  }
  return null
}

function isPickerMenu(menu) {
  const host = menu && menu.parentElement
  if (!host || !host.classList) return false
  if (!host.classList.contains('bootstrap-select') && !(host.closest('.card-license') && host.matches('.btn-group, .dropdown, .dropup'))) return false
  if (menu.closest && (menu.closest('.note-toolbar') || menu.closest('.note-editor'))) return false
  return true
}

function pinMenu(menu) {
  const host = menu.parentElement
  const tog = host.querySelector(':scope > .dropdown-toggle, :scope > button')
  if (!tog || !tog.getBoundingClientRect) return
  const r = tog.getBoundingClientRect()
  if (!r.width && !r.height) return
  const origin = pinOrigin(menu)
  const o = origin ? origin.getBoundingClientRect() : null
  const body = host.closest('.modal-body')
  const bodyRect = body && body.getBoundingClientRect()
  const bounds = {top:Math.max(4, bodyRect ? bodyRect.top+4 : 4),bottom:Math.min(innerHeight-4, bodyRect ? bodyRect.bottom-4 : innerHeight-4),left:Math.max(4,bodyRect ? bodyRect.left+4 : 4),right:Math.min(innerWidth-4,bodyRect ? bodyRect.right-4 : innerWidth-4)}
  const select = host.querySelector('select')
  const geometry = select ? [innerWidth,innerHeight,r.width,r.height,bodyRect && bodyRect.width,bodyRect && bodyRect.height].join(':') : [r.left,r.top,r.width,r.height,o && o.left,o && o.top,bounds.top,bounds.bottom,bounds.left,bounds.right,menu.offsetHeight].join(':')
  if (menu.dataset.mdtPin === '1' && menu.mdtPinGeometry === geometry) return
  const above = r.top-bounds.top, below = bounds.bottom-r.bottom
  const up = select ? above>below : below<menu.offsetHeight&&above>below
  const isSelect = host.classList.contains('bootstrap-select')
  const width = Math.min(isSelect ? r.width : menu.offsetWidth, bounds.right-bounds.left)
  const left = Math.max(bounds.left, Math.min(r.left, bounds.right-width))
  if (isSelect) {
    if (!menu.mdtPinWidth) menu.mdtPinWidth = ['width','min-width','max-width'].map(key=>[key,menu.style.getPropertyValue(key),menu.style.getPropertyPriority(key)])
    menu.style.setProperty('width', width+'px', 'important')
    menu.style.setProperty('min-width', width+'px', 'important')
    menu.style.setProperty('max-width', width+'px', 'important')
  }
  if (select) select.dispatchEvent(new CustomEvent('mdt:picker-fit',{bubbles:true,detail:JSON.stringify({padding:[bounds.top,innerWidth-bounds.right,innerHeight-bounds.bottom,bounds.left],limit:Math.max(1,Math.min(420,up?above:below)),up})}))
  const h = menu.offsetHeight
  const top = Math.max(bounds.top, Math.min(up ? r.top-h : r.bottom, bounds.bottom-h))
  menu.mdtPinGeometry = geometry
  const s = menu.style
  s.setProperty('position', 'fixed', 'important')
  s.setProperty('left', Math.round(left - (o ? o.left : 0)) + 'px', 'important')
  s.setProperty('top', Math.round(top - (o ? o.top : 0)) + 'px', 'important')
  s.setProperty('right', 'auto', 'important')
  s.setProperty('bottom', 'auto', 'important')
  s.setProperty('transform', 'none', 'important')
  s.setProperty('margin', '0', 'important')
  s.setProperty('z-index', '2147483000', 'important')
  if (menu.getAttribute('data-mdt-pin') !== '1') {
    menu.setAttribute('data-mdt-pin', '1')
    pinned.push(menu)
  }
  raiseChain(menu)
}

function unpinMenu(menu) {
  menu.parentElement?.querySelector('select')?.dispatchEvent(new CustomEvent('mdt:picker-fit',{bubbles:true,detail:'null'}))
  if (menu.mdtPinWidth) {menu.mdtPinWidth.forEach(([key,value,priority])=>{if(value) menu.style.setProperty(key,value,priority);else menu.style.removeProperty(key)});delete menu.mdtPinWidth}
  menu.removeAttribute('data-mdt-pin')
  delete menu.mdtPinGeometry
  const keys = ['position', 'left', 'top', 'right', 'bottom', 'transform', 'margin', 'z-index']
  keys.forEach((k) => menu.style.removeProperty(k))
}

function scanPickers() {
  if (dragState || gripBox) return
  if (themeNow() === 'off') {
    while (pinned.length) unpinMenu(pinned.pop())
    observePickerBounds()
    dropChain()
    return
  }
  const menus = document.querySelectorAll('.bootstrap-select.show > .dropdown-menu, .bootstrap-select.open > .dropdown-menu, .card-license .show > .dropdown-menu, .card-license .open > .dropdown-menu')
  menus.forEach((menu) => {
    const input = menu.querySelector('.bs-searchbox input')
    if (input && !input.getAttribute('placeholder')) input.setAttribute('placeholder', 'Search...')
    if (isPickerMenu(menu)) pinMenu(menu)
  })
  for (let i = pinned.length - 1; i >= 0; i--) {
    const menu = pinned[i]
    const host = menu.parentElement
    const open = host && host.classList && (host.classList.contains('show') || host.classList.contains('open'))
    if (!open || !document.body.contains(menu)) {
      pinned.splice(i, 1)
      unpinMenu(menu)
    }
  }
  observePickerBounds()
  if (!pinned.length && raised.length) dropChain()
}

let pickerFrame = 0
function schedulePickerScan() {
  if (pickerFrame) return
  pickerFrame = requestAnimationFrame(() => { pickerFrame = 0; scanPickers() })
}

function watchPickers() {
  document.addEventListener('keydown',event=>{
    if(themeNow()==='off'||!['ArrowDown','ArrowUp','Enter','Escape'].includes(event.key))return
    const host=event.target.closest?.('.bootstrap-select.show, .bootstrap-select.open, .bs-container.show, .bs-container.open')
    if(!host)return
    const menu=host.querySelector('.dropdown-menu')
    if(event.key==='Escape'&&menu){event.preventDefault();event.stopImmediatePropagation();menu.dispatchEvent(new Event('mdt:picker-dismiss',{bubbles:true}));return}
    if(menu&&(menu.querySelector('.no-results')||!menu.querySelector('.dropdown-item:not(.disabled)'))) {event.preventDefault();event.stopImmediatePropagation()}
    else if (menu && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) requestAnimationFrame(() => {
      const list = menu.querySelector('div.inner'), active = menu.querySelector('li.active .dropdown-item')
      if (!list || !active || !host.isConnected) return
      const bounds = list.getBoundingClientRect(), row = active.getBoundingClientRect()
      if (row.top < bounds.top) list.scrollTop += row.top - bounds.top
      else if (row.bottom > bounds.bottom) list.scrollTop += row.bottom - bounds.bottom
    })
  },true)
  document.addEventListener('input', event => { if (event.target.closest?.('.bs-searchbox') && pinned.length) schedulePickerScan() }, true)
  window.addEventListener('resize', () => { if (pinned.length) schedulePickerScan() }, {passive:true})
  window.addEventListener('scroll', event => { if (pinned.some(menu=>!menu.parentElement?.classList.contains('bootstrap-select')) && !event.target.closest?.('.bootstrap-select')) schedulePickerScan() }, {capture:true,passive:true})
  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.type === 'attributes' ? record.target.matches('.bootstrap-select, .card-license .btn-group, .card-license .dropdown, .card-license .dropup') : pinned.some((menu) => !menu.isConnected) || Array.from(record.addedNodes).some((node) => node.nodeType === 1 && (node.matches('.bootstrap-select, .card-license') || !record.target.closest('.bootstrap-select') && node.querySelector('.bootstrap-select, .card-license'))))) schedulePickerScan()
  })
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})
  schedulePickerScan()
}

const IMGUR_RE = /^https?:\/\/(i\.)?imgur\.com\//i

function imgurAlts(url) {
  const clean = url.replace(/^http:/i, 'https:')
  const bare = clean.replace(/^https?:\/\//i, '')
  return [
    'https://images.weserv.nl/?url=' + encodeURIComponent(bare),
    'https://proxy.duckduckgo.com/iu/?u=' + encodeURIComponent(clean) + '&f=1',
    clean
  ]
}

function stepImgur(img) {
  if (themeNow() === 'off') return
  if (img.mdtImgDone) return
  const alts = img.mdtAlts || []
  const next = (img.mdtAlt || 0) + 1
  if (next >= alts.length) {
    img.mdtImgDone = true
    return
  }
  img.mdtAlt = next
  img.src = alts[next]
}

function proxyImg(img) {
  if (themeNow() === 'off') return
  if (!img || !img.getAttribute) return
  if (img.getAttribute('data-mdt-imgur') === '1') return
  const src = img.getAttribute('src') || ''
  if (!IMGUR_RE.test(src)) return
  const alts = imgurAlts(src)
  img.setAttribute('data-mdt-imgur', '1')
  img.setAttribute('data-mdt-imgur-src', src)
  img.mdtAlts = alts
  img.mdtAlt = 0
  img.mdtImgDone = false
  img.mdtProxyError = () => stepImgur(img)
  img.addEventListener('error', img.mdtProxyError, false)
  img.src = alts[0]
}

function fixImgur() {
  if (themeNow() === 'off') return
  const imgs = document.querySelectorAll('img[src]')
  imgs.forEach(proxyImg)
}

function watchImgur() {
  fixImgur()
  const observer = new MutationObserver((records) => {
    if (themeNow() === 'off') return
    for (const record of records) {
      if (record.type === 'attributes') { proxyImg(record.target); continue }
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue
        if (node.matches('img[src]')) proxyImg(node)
        else node.querySelectorAll('img[src]').forEach(proxyImg)
      }
    }
  })
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']})
}

function watchModalResize() {
  document.addEventListener('click', (e) => {
    const minimize = e.target.closest && e.target.closest('.mdt-minimize')
    if(minimize) { e.preventDefault(); e.stopImmediatePropagation(); minimizeRecord(minimize.closest('.modal-dialog')); return }
    const button = e.target.closest && e.target.closest('.mdt-maximize')
    if (!button) return
    e.preventDefault()
    e.stopImmediatePropagation()
    toggleModalMax(button.closest('.modal-dialog'))
  }, true)
  document.addEventListener('dblclick', (e) => {
    const dlg = dragTarget(e.target)
    if (!dlg || !dlg.matches('.modal-dialog') || themeNow() === 'off') return
    e.preventDefault()
    toggleModalMax(dlg)
  }, true)
  document.addEventListener('pointerdown', startGrip, true)
  document.addEventListener('pointermove', moveGrip, true)
  document.addEventListener('pointerup', endGrip, true)
  document.addEventListener('pointercancel', endGrip, true)
  window.addEventListener('blur', endGrip)
  document.addEventListener('click', (e) => {
    if (Date.now() > gripClickUntil) return
    const releasedHere = gripReleasePoint && Math.abs(e.clientX - gripReleasePoint.x) < 2 && Math.abs(e.clientY - gripReleasePoint.y) < 2
    if (!releasedHere && !(e.target.closest && e.target.closest('.mdt-grip'))) return
    gripClickUntil = 0
    e.preventDefault()
    e.stopImmediatePropagation()
  }, true)
  document.addEventListener('shown.bs.modal', addGrips, true)
  document.addEventListener('hidden.bs.modal', (e) => {
    if (!e || !e.target || !e.target.querySelector) return
    clearGripSize(e.target.querySelector('.modal-dialog'))
  }, true)
  addGrips()
}

function watchModalDrag() {
  watchReportReuse()
  watchModalResize()
  watchPickers()
  watchImgur()
  installWorkspace()
  document.addEventListener('mdt:modal-lifecycle', syncWorkspace)
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest) raiseModal(e.target.closest('.modal'))
    startModalDrag(e)
  }, true)
  document.addEventListener('pointermove', moveModalDrag, true)
  document.addEventListener('pointerup', endModalDrag, true)
  document.addEventListener('pointercancel', endModalDrag, true)
  window.addEventListener('blur', endModalDrag)
  const observer = new MutationObserver((records) => {
    if (records.some(r=>(r.target.nodeType===1?r.target:r.target.parentElement)?.closest('.modal-header'))) addGrips()
    const sized = new Set()
    records.forEach((record) => {
      const node = record.target
      if (node.matches && node.matches('.modal-content, .modal-body, .modal-dialog')) {
        const dlg = node.closest('.modal-dialog[data-mdt-sized]')
        if (dlg) sized.add(dlg)
      }
    })
    sized.forEach(fitSizedModal)
    if (!records.some((record) => record.type === 'childList' ? Array.from(record.addedNodes).concat(Array.from(record.removedNodes)).some((node) => node.nodeType === 1 && (node.matches('.modal, .modal-backdrop') || node.querySelector('.modal, .modal-backdrop'))) : record.target.matches('.modal'))) return
    records.forEach((record) => {
      const node = record.target
      if (node.matches && node.matches('.modal') && (!node.matches('.show, .in') || !node.getClientRects().length)) {
        reportSnapshots.delete(node)
        const box = node.querySelector('.modal-dialog')
        resetModalDrag(box)
        clearGripSize(box)
      }
    })
    syncWorkspace()
    addGrips()
    document.querySelectorAll('.modal.show, .modal.in').forEach((node) => { if (!modalLayers.has(node)) raiseModal(node) })
  })
  observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['class','style']})
}

ipcRenderer.on('mdt:set-drag', (_e, value) => {
  dragEnabled = !!value
  applyDragFlag()
  if (!dragEnabled) {
    for (const box of document.querySelectorAll('[data-mdt-moved="1"], [data-mdt-offset]')) {
      resetModalDrag(box)
    }
  }
})

ipcRenderer.on('mdt:set-skin', (_e, value) => {
  skinSynced = true
  if (typeof value === 'boolean') applyTheme(value ? 'p1' : 'off')
  else applyTheme(String(value))
})

ipcRenderer.on('mdt:header-menu-request', (_e, kind) => {
  sendHeaderMenu(String(kind || ''))
})

ipcRenderer.on('mdt:header-item', (_e, payload) => {
  const data = payload || {}
  runHeaderItem(String(data.kind || ''), Number(data.index))
})

ipcRenderer.on('mdt:layout-report', () => {
  try {
    const de = document.documentElement
    const vh = window.innerHeight || 0
    const tall = []

    document.querySelectorAll('body *').forEach((el) => {
      const h = el.offsetHeight || 0
      if (vh && h > vh * 1.15) {
        const cs = getComputedStyle(el)
        let name = el.tagName.toLowerCase()
        if (el.id) name += '#' + el.id
        if (el.className && typeof el.className === 'string') {
          const cls = el.className.trim().split(/\s+/).slice(0, 3).join('.')
          if (cls) name += '.' + cls
        }
        tall.push({ name, height: h, css: cs.height + ' / min ' + cs.minHeight })
      }
    })

    tall.sort((a, b) => b.height - a.height)

    ipcRenderer.sendToHost('mdt:layout-report-result', {
      url: location.href,
      skin: themeNow(),
      viewport: (window.innerWidth || 0) + ' x ' + vh,
      document: de.scrollWidth + ' x ' + de.scrollHeight,
      body: document.body ? document.body.scrollWidth + ' x ' + document.body.scrollHeight : 'n/a',
      ratio: vh ? (de.scrollHeight / vh).toFixed(2) + ' x viewport' : 'n/a',
      tall: tall.slice(0, 8)
    })
  } catch (err) {
    ipcRenderer.sendToHost('mdt:layout-report-result', { error: String(err) })
  }
})

ipcRenderer.on('mdt:search', (_e, payload) => {
  try {
    const which = (payload && payload.which) || 'person'
    const value = (payload && payload.value) || ''
    const id = which === 'vehicle' ? 'plate' : 'character'
    const el = document.getElementById(id) ||
      document.querySelector('input[placeholder="Search ' + (which === 'vehicle' ? 'Vehicle' : 'Person') + '"]')
    if (!el) {
      ipcRenderer.sendToHost('mdt:search-result', { ok: false, which })
      return
    }
    el.scrollIntoView({ block: 'center' })
    el.focus()
    if (value) {
      el.value = value

      const ev = new KeyboardEvent('keypress', {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
      })
      el.dispatchEvent(ev)
    } else {
      el.select()
    }
    ipcRenderer.sendToHost('mdt:search-result', { ok: true, which })
  } catch (_) {
  }
})

function text(sel) {
  const el = document.querySelector(sel)
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''
}

function reportPageInfo() {
  try {
    const info = { officer: '', subject: '', skinnable: isMdcHost() }

    const header = document.querySelector('.navbar, header, .main-panel .navbar')
    if (header) {
      const t = header.textContent.replace(/\s+/g, ' ').trim()
      const m = t.match(/([A-Z][A-Za-z'.-]+(?: [A-Z][A-Za-z'.-]+){1,3})\s*#(\d{3,10})/)
      if (m) info.officer = m[1] + ' #' + m[2]
    }

    info.subject = text('h3.characterDetailsName')

    const stats = document.querySelectorAll('.card-stats')
    for (let i = 0; i < stats.length; i++) {
      const sm = String(stats[i].textContent || '').replace(/\s+/g, ' ').match(/([\d,]+)\s*Posted APBs/i)
      if (sm) {
        info.apbs = parseInt(sm[1].replace(/,/g, ''), 10) || 0
        break
      }
    }

    ipcRenderer.sendToHost('mdt:page-info', info)
  } catch (_) {
  }
}

const SEARCH_FIELD_RE = /^\s*(search person|search vehicle|search plate|search name)\s*$/i
const PENAL_LINK_RE = /^\s*penal code\s*$/i
const WRAP_RE = /input-group|form-group|form-inline|navbar-form|nav-item|search/i

function searchWrapper(el) {
  let node = el
  let hops = 0
  while (node && hops < 4) {
    const parent = node.parentElement
    if (!parent || parent === document.body) return node
    const cls = String((parent.className && parent.className.toString) ? parent.className.toString() : '')
    if (parent.tagName === 'FORM' || parent.tagName === 'LI' || WRAP_RE.test(cls)) return parent
    node = parent
    hops++
  }
  return el
}

function setSearchNodeHidden(el, hidden) {
  if (!el || !el.style || !el.dataset) return
  if (hidden) {
    if (el.dataset.mdtSearchGone === '1') return
    el.dataset.mdtSearchGone = '1'
    el.style.setProperty('display', 'none', 'important')
    return
  }
  if (el.dataset.mdtSearchGone !== '1') return
  delete el.dataset.mdtSearchGone
  el.style.removeProperty('display')
}

function markLookupControls() {
  if (!document.body) return
  const fields = new Set()
  const actions = new Set()
  if (themeNow() !== 'off') {
    document.querySelectorAll('input[placeholder], input[aria-label], input#character, input#plate').forEach((input) => {
      const label = input.getAttribute('placeholder') || input.getAttribute('aria-label') || ''
      if (!/^(character|plate)$/.test(input.id) && !/^\s*search (person|vehicle|plate|name)\s*$/i.test(label)) return
      if (input.closest('.modal, .note-editor, [contenteditable="true"]')) return
      fields.add(input)
    })
    fields.forEach((input) => {
      let node = input
      for (let level = 0; node && node !== document.body && level < 3; level++, node = node.parentElement) {
        const sibling = node.nextElementSibling
        if (!sibling || fields.has(sibling) || sibling.querySelector('input, textarea, select')) continue
        const action = sibling.matches('button, a, [role="button"], input[type="submit"], i.fa-search, i[class*="search"]') ? sibling : sibling.querySelector('.input-group-append > button, .input-group-btn > button, button:has(.fa-search), a:has(.fa-search), i.fa-search')
        const clickable = action && (action.closest('button, a, [role="button"]') || action)
        if (clickable && !clickable.contains(input)) { actions.add(clickable); break }
      }
      const form = input.closest('form')
      if (form && Array.from(fields).filter((field) => form.contains(field)).length === 1) {
        const submit = form.querySelector('button[type="submit"], button:not([type]), input[type="submit"]')
        if (submit) actions.add(submit)
      }
    })
  }
  for (const [attribute, nodes] of [['data-mdt-lookup-field',fields], ['data-mdt-lookup-action',actions]]) {
    document.querySelectorAll('[' + attribute + ']').forEach((node) => { if (!nodes.has(node)) node.removeAttribute(attribute) })
    nodes.forEach((node) => { if (!node.hasAttribute(attribute)) node.setAttribute(attribute,'1') })
  }
}

function applySearchInputs() {
  if (!document.body) return
  markLookupControls()
  if (!searchHidden || themeNow() === 'off') {
    document.querySelectorAll('[data-mdt-search-gone="1"]').forEach((el) => setSearchNodeHidden(el, false))
    if (!searchHidden || themeNow() === 'off') return
  }
  const inputs = document.querySelectorAll('input[placeholder], input[name], input[aria-label]')
  const limit = inputs.length > 200 ? 200 : inputs.length
  for (let i = 0; i < limit; i++) {
    const el = inputs[i]
    if (!el || !el.getAttribute) continue
    const label = String(
      el.getAttribute('placeholder') || el.getAttribute('aria-label') || ''
    )
    if (!SEARCH_FIELD_RE.test(label)) continue
    setSearchNodeHidden(searchWrapper(el), true)
  }
}

function watchPenalLinks() {
  if (!document.addEventListener) return
  document.addEventListener('click', (e) => {
    const t = e && e.target
    if (!t || !t.closest) return
    const hit = t.closest('a, button, .btn')
    if (!hit) return
    if (!PENAL_LINK_RE.test(flatText(hit))) return
    if (e.preventDefault) e.preventDefault()
    if (e.stopPropagation) e.stopPropagation()
    try {
      ipcRenderer.sendToHost('mdt:open-penal')
    } catch (_) {
    }
  }, true)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', watchPenalLinks)
} else {
  watchPenalLinks()
}

const VANILLA_DIALOG_RE = /add arrest report|(?:file|add|submit|edit)\s+(?:(?:arrest|search|electronic surveillance|financial services)\s+)?warrant/i

function markWarrantFields(modal, enabled) {
  if (!enabled) {
    modal.querySelectorAll('[data-mdt-warrant-suspect], [data-mdt-warrant-situation], [data-mdt-warrant-entry]').forEach((node) => {
      node.removeAttribute('data-mdt-warrant-suspect')
      node.removeAttribute('data-mdt-warrant-situation')
      node.removeAttribute('data-mdt-warrant-entry')
    })
    return
  }
  modal.querySelectorAll('input[id^="suspectName"]').forEach((input) => {
    const section = input.closest('.form-group')
    if (section) section.dataset.mdtWarrantSuspect = '1'
  })
  modal.querySelectorAll('input[id$="WarrantDate"]').forEach((input) => {
    const row = input.closest('.form-row')
    if (row) row.dataset.mdtWarrantSituation = '1'
  })
  modal.querySelectorAll('.chargeSelect, textarea[class*="evidence"]').forEach((input) => {
    const row = input.closest('.form-group.row')
    if (row) row.dataset.mdtWarrantEntry = input.tagName === 'TEXTAREA' || row.querySelector('textarea') ? 'evidence' : 'charge'
  })
}

function exemptDialogs() {
  markPaperDocuments()
  const modals = document.querySelectorAll('.modal')
  const live = themeNow() !== 'off'
  for (let i = 0; i < modals.length; i++) {
    const m = modals[i]
    if (!m || !m.dataset || !m.querySelector) continue
    const head = m.querySelector('.modal-title') || m.querySelector('.modal-header')
    const label = flatText(head)
    const wanted = live && !!label && label.length < 120 && VANILLA_DIALOG_RE.test(label)
    if (wanted && /warrant/i.test(label)) m.dataset.mdtNativeForm = '1'
    else delete m.dataset.mdtNativeForm
    markWarrantFields(m, m.dataset.mdtNativeForm === '1')
    if (wanted) {
      if (m.dataset.mdtVanilla === '1') continue
      m.dataset.mdtVanilla = '1'
      {
        m.querySelectorAll('[data-mdt-crow], [data-mdt-ccell], [data-mdt-cbtn], [data-mdt-chost]').forEach((el) => {
          delete el.dataset.mdtCrow
          delete el.dataset.mdtCcell
          delete el.dataset.mdtCbtn
          delete el.dataset.mdtChost
          CROW_PROPS.forEach((key) => el.style.removeProperty(key))
        })
      }
      m.querySelectorAll('[data-mdt-row="1"]').forEach((el) => {
        if (!el.style || !el.dataset) return
        delete el.dataset.mdtRow
        ROW_PROPS.forEach((key) => el.style.removeProperty(key))
      })
      continue
    }
    if (m.dataset.mdtVanilla === '1') delete m.dataset.mdtVanilla
  }
}
