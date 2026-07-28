'use strict'

const { ipcRenderer } = require('electron')

const STYLE_ID = 'mdt-classic-skin'

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
  ':not(.bi):not([class^="bi-"]):not([class*=" bi-"])'

const BOX_SEL = [
  'html', 'body', 'main', 'section', 'article', 'aside', 'header', 'footer', 'nav',
  '.wrapper', '.main-panel', '.content', '.container', '.container-fluid',
  '.row', '.col', '[class^="col-"]',
  '.navbar', '.navbar-transparent', '.navbar-absolute', '.navbar-collapse', '.navbar-wrapper',
  '.sidebar', '.sidebar-wrapper', '.sidebar-submenu', '.menu-collapsed',
  '.nav', '.nav-tabs', '.nav-pills', '.tab-content', '.tab-pane',
  '.card', '.card-dashboard', '.card-stats', '.card-body', '.card-header', '.card-footer',
  '.accordion', '.panel', '.panel-body', '.box', '.well',
  '.modal-dialog', '.modal-content', '.modal-body', '.modal-header', '.modal-footer',
  '.swal2-popup', '.swal2-content', '.swal2-header', '.swal2-actions',
  '.dropdown-menu', '.dropdown-item', '.list-group', '.list-group-item',
  '.toast', '.toast-body', '.popover', '.tooltip-inner',
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
  dark: {
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
  /* LAPD / PremierOne Mobile Client livery: deep navy panels, bright blue
     chrome, white text and pale blue rules. */
  lapd: {
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

function buildCss(p) {
  return `

:root, html, body {
  color-scheme: ${p !== PALETTES.light ? 'dark' : 'light'} !important;
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

body, body *${NOT_ICON} {
  font-family: "Segoe UI", Tahoma, "MS Shell Dlg 2", sans-serif !important;
}

.main-panel { overflow-x: hidden !important; }
.sidebar, .sidebar-wrapper { overflow-x: hidden !important; }

${BOX_SEL} {
  background-image: none !important;
  background-color: ${p.panel} !important;
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

/* The collapse toggle is absolutely positioned near the centre of its header,
   so on cards with a centred title (Message of the Day, the profile card) the
   dash landed on top of the text. Pin it to the right edge and keep the title
   clear of it. */
html body .card-header, html body .panel-heading, html body .card > .card-header {
  position: relative !important;
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

/* Dashboard stat cards: the header used to sit inset with its own tinted bar. */
.card-stats, .card-dashboard {
  background-color: ${p.panel} !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: hidden !important;
  margin-top: 14px !important;
}

/* Filter strips mix plain inputs with bootstrap-select pickers. The picker
   keeps its own margins and taller toggle, so on the DMV filter row it sat a
   few pixels below the text fields instead of on their baseline. */
.bootstrap-select:not(.form-control) {
  margin: 1px !important;
  vertical-align: middle !important;
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

/* Search widgets and their buttons ship with a near black pill behind them
   (DMV filter strip, map overlay), which reads as a hole in the classic skin. */
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

html body [class*="search"]:not(input):not(button):not(a):not(.btn):not(.form-control):not(table):not(thead):not(tbody):not(tr):not(td):not(th) {
  background-image: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}
html body .search-bar, html body .search-box, html body .searchbox,
html body .search-wrapper, html body .search-container, html body .search-panel,
html body .map-search, html body .leaflet-control-search, html body .leaflet-control-search form {
  background-color: ${p.panel} !important;
  color: ${p.text} !important;
  border: 1px solid ${p.border} !important;
  padding: 2px !important;
}

/* Filter strips (Incident Database and friends) mix text fields, pickers and
   action buttons across Material's column grid, which dropped some controls a
   line below their neighbours at mismatched sizes. Each grid cell and the row
   holding it are marked, so the run lays out as one flat wrapping line. */
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

/* Leaflet maps. The skin's borders, backgrounds and scroll trimming break the
   tile panes and clip the layer control, so keep the map surface near stock and
   only skin the chrome around it. */
/* The water surround is part of the map surface, not chrome: the vanilla page
   shows cyan around the island on both the vehicle and emergency maps. */
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
  /* The icon tile used to sit flush against the top-left corner of the card.
     The header is now a centred flex row with real breathing room, so the
     tile is inset and lines up with the middle of the figure + label. */
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
  /* Figure and label sit together beside the icon instead of being pushed to
     opposite ends of the card. */
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

/* Tab panels: the frame used to break out past the tab strip. */
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

/* Lookup pages: one centred column of fields with the button underneath. */
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
/* Wrappers at any depth become full-width centring columns, so a half-width
   grid column can no longer drag the field stack off centre. */
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
/* Every field and the button share one 320px column, so they line up exactly. */
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

button, .btn, input[type="button"], input[type="submit"], input[type="reset"] {
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
  color: ${p !== PALETTES.light ? '#FF6B6B' : '#C00000'} !important;
  background-color: ${p.btnFace} !important;
  border: 1px solid ${p.border} !important;
  font-weight: bold !important;
  text-shadow: none !important;
}
.modal-header .close span, .modal-header button.close span,
.modal-header .close i, .modal-content > .close span, .modal-content > .close i {
  color: ${p !== PALETTES.light ? '#FF6B6B' : '#C00000'} !important;
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

/* Arrest report dialog: keep the charge rows inside the frame instead of
   letting the absolutely positioned time badge stretch them past the edge. */
.modal:not([data-mdt-vanilla="1"]) .modal-body .card,
.modal:not([data-mdt-vanilla="1"]) .modal-body .card-body {
  overflow: visible !important;
  max-width: 100% !important;
  margin: 0 0 4px 0 !important;
  padding: 2px !important;
}
/* The arrest dialog keeps its own spacing, it just must not overflow. */
.modal[data-mdt-vanilla="1"] .modal-body .card,
.modal[data-mdt-vanilla="1"] .modal-body .card-body {
  max-width: 100% !important;
}
.modal-body select, .modal-body .dropdown-toggle { max-width: 100% !important; }
.modal:not([data-mdt-vanilla="1"]) .modal-body .bootstrap-select {
  max-width: 100% !important;
  width: auto !important;
}

/* Narrative editor (summernote) was rendering as a black slab. */
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
.note-placeholder { color: ${p.textMuted} !important; }
.note-statusbar, .note-resizebar {
  background-color: ${p.header} !important;
  border-top: 1px solid ${p.border} !important;
}
.note-btn, .note-editor .btn { background-color: ${p.btnFace} !important; color: ${p.text} !important; border: 1px solid ${p.border} !important; }

/* The summernote toolbar carries class="card-header", so it was picking up the
   card/collapse header rules and stacking every button group on its own line.
   Give the toolbar its own horizontal layout at higher specificity. */
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
html body .note-toolbar .note-current-fontname {
  max-width: 96px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
/* Toolbar dropdowns: font list, style list, and the colour palettes. */
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
/* The colour dropdown holds two palettes side by side. */
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
/* Swatches keep their inline background-color; only the box is restyled. */
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
/* The editing surface itself was rendering as a black slab inside dialogs. */
html body .note-editor .note-editing-area,
html body .note-editor .note-editing-area > .note-editable,
html body .note-editor .note-editing-area > .note-codable {
  background-color: ${p.field} !important;
  color: ${p.text} !important;
}

/* Person Lookup and ID Lookup. The fields are not inside a <form>, so the
   earlier form-scoped rules never matched: the real markup is
   .tab-content > .tab-pane > .row.justify-content-center > .col-xl-4.
   Pin every row to one centred column so the fields and the Search button
   share the same axis and width. */
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

/* Licence cards: Revoke / Suspend used to float out of the card. */
.card-license {
  background-color: ${p.panel} !important;
  border: 1px solid ${p.border} !important;
  padding: 4px 6px !important;
  margin: 0 0 4px 0 !important;
  overflow: hidden !important;
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
/* Revoke and Suspend sat in block level wrappers, which stacked them. */
.card-license .btn-group, .card-license .dropdown, .card-license .dropup {
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

/* "Show 10 entries" length picker was rendering as a big square box. */
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

/* Charge rows in the arrest dialog: single line, uniform control sizing. */
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

/* Perfect Scrollbar wraps several containers (.ps-container, and the arrest
   dialog's .modal-body.modal-scroll) in its own rails while the element also
   scrolls natively, which is where the doubled scrollbars and the grey rail
   floating over the interface came from. The rails go, native scrolling stays. */
.ps-scrollbar-x-rail, .ps-scrollbar-y-rail,
.ps-scrollbar-x, .ps-scrollbar-y {
  display: none !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
}
.ps-container, .modal-scroll {
  overflow-x: hidden !important;
  overflow-y: auto !important;
  -ms-overflow-style: auto !important;
}

/* The dialog itself is the only scroller: header and footer stay put and the
   body takes the remaining height. */
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

/* Arrest dialog charge rows. The site builds each row as
     .form-group.row.col-12 > .input-group.col-5 | .col-3 | .col-3 | .col-1
   with a bootstrap-select in each group, so the row is laid out as a grid with
   the remove button in a fixed last column. */
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

/* Charge rows are appended into .input-group-addon.chargeWrapper, which shares
   a class with the button strip above it, so that wrapper must stay a vertical
   stack: one row per line, newest underneath. */
html body .modal .modal-body .chargeWrapper {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  justify-content: flex-start !important;
  gap: 0 !important;
  width: 100% !important;
  margin: 0 0 6px 0 !important;
  /* Its own panel: the list scrolls inside these bounds so a long charge list
     can never spill over the Narrative editor underneath it. */
  position: relative !important;
  float: none !important;
  clear: both !important;
  z-index: 1 !important;
  height: auto !important;
  min-height: 34px !important;
  max-height: 190px !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  border: 1px solid ${p.border} !important;
  background-color: ${p.panelAlt} !important;
  padding: 5px !important;
}
/* Whatever follows the charge list starts on its own line. */
html body .modal .modal-body .chargeWrapper + * {
  clear: both !important;
  position: relative !important;
}
html body .modal .modal-body .chargeWrapper > * {
  width: 100% !important;
  max-width: 100% !important;
  flex: 0 0 auto !important;
}

/* The Penal Code and Add Charge buttons are inline-styled to 15% width and
   stacked; they belong side by side above the rows. */
/* The infraction dialog uses the same pattern with a different wrapper class,
   so any addon that actually holds rows is matched by shape rather than name
   and gets the same stacked panel. */
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

/* Header field columns (Type / Location / Status / Confidential Level, and the
   same strip in Add Record). The site centres the caption with .text-center but
   leaves the control in a .btn-group that sits wherever it lands, so the label
   and its control were off-axis from each other. */
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

/* Summernote toolbars inside a modal (Edit Record, Add Record). The header
   column rules above match every .btn-group in the column, and the toolbar's
   groups are .btn-group as well, which stacked and centred them one per row.
   They are excluded above; the layout is restated here so it also wins on
   specificity inside modals. */
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

/* Dashboard statistics. Each card is
     .card.card-stats > .card-header.card-header-icon.card-header-<colour>
       > .card-icon > i, h4.card-title, h6
   and Material Design lifts .card-icon out of the header with a negative
   offset so it overhangs the card. In a flat skin there is nothing to overhang,
   so the tile is pinned inside the header next to the figure and label. */
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
  line-height: 34px !important;
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

/* Leaflet Search control on the map pages. The plugin emits
     .leaflet-control-search.search-exp
       > label.search-input (hidden) + input.search-input
       + ul.search-tooltip + a.search-cancel > span + a.search-button
       + div.search-alert
   The label shares the input's class, and the input carries an inline
   max-width in the thousands of pixels, which is what made the field sprawl. */
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
  align-items: center !important;
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
  line-height: 22px !important;
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

/* Scrolling pickers (Caution Code, Profiling Sample facility). Markup is
     .dropdown-menu.dropdown-menu-scroll.ps-container
       > a.dropdown-item[name="cautionCodeOption"] > span.badge.badge-pill
   They rely on Perfect Scrollbar for their scrollbar, which is now suppressed,
   so they need a real height limit and native scrolling of their own. */
html body .dropdown-menu.dropdown-menu-scroll {
  display: block !important;
  box-sizing: border-box !important;
  min-width: 240px !important;
  max-width: 420px !important;
  max-height: 230px !important;
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
.imgareaselect-outer, .imgareaselect-selection, .imgareaselect-border1,
.imgareaselect-border2, .imgareaselect-border3, .imgareaselect-border4,
.imgareaselect-handle, .cropper-container, .cropper-container *,
.cropper-canvas, .cropper-drag-box, .cropper-crop-box, .cropper-view-box,
.cropper-face, .cropper-line, .cropper-point, .cropper-modal {
  all: revert !important;
}

h3.characterDetailsName { font-size: 14px !important; font-weight: bold !important; }
.characterDetailsTitle, h4.characterDetailsTitle {
  background-color: ${p.header} !important;
  border: 1px solid ${p.border} !important;
  color: ${p.text} !important;
  font-size: 11px !important;
  font-weight: bold !important;
  padding: 1px 5px !important;
  margin: 4px 0 2px !important;
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
.alert-success { background-color: ${p.successSoft} !important; color: ${p.successInk} !important; border: 1px solid ${p.success} !important; }

html body div[data-notify="container"], html body .alert[data-notify] {
  display: block !important;
  padding: 6px 32px 6px 40px !important;
  min-height: 36px !important;
  max-width: 420px !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background-image: none !important;
  opacity: 1 !important;
  visibility: visible !important;
  z-index: 3000 !important;
}
html body div[data-notify="container"][style*="position"] {
  position: fixed !important;
}
html body div[data-notify="container"]::before,
html body div[data-notify="container"]::after,
html body .alert[data-notify]::before, html body .alert[data-notify]::after {
  display: none !important;
  content: none !important;
}
html body div[data-notify="container"].alert-success,
html body .alert[data-notify].alert-success {
  background-color: ${p.successSoft} !important;
  border: 1px solid ${p.success} !important;
  color: ${p.successInk} !important;
}
html body div[data-notify="container"].alert-danger,
html body .alert[data-notify].alert-danger {
  background-color: ${p.dangerSoft} !important;
  border: 1px solid ${p.danger} !important;
  color: ${p.dangerInk} !important;
}
html body div[data-notify="container"].alert-warning,
html body .alert[data-notify].alert-warning {
  background-color: ${p.warningSoft} !important;
  border: 1px solid ${p.warning} !important;
  color: ${p.warningInk} !important;
}
html body div[data-notify="container"].alert-info,
html body .alert[data-notify].alert-info {
  background-color: ${p.info} !important;
  border: 1px solid ${p.infoStrong} !important;
  color: ${p.text} !important;
}
html body [data-notify="icon"] {
  position: absolute !important;
  left: 9px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  margin: 0 !important;
  padding: 0 !important;
  width: 18px !important;
  height: 18px !important;
  font-size: 18px !important;
  line-height: 18px !important;
  background: none !important;
  border: none !important;
}
html body [data-notify="title"] {
  display: block !important;
  font-weight: bold !important;
  font-size: 12px !important;
  line-height: 15px !important;
  margin: 0 !important;
}
html body [data-notify="message"] {
  display: block !important;
  font-size: 12px !important;
  line-height: 15px !important;
  margin: 0 !important;
}
html body div[data-notify="container"] .close,
html body div[data-notify="container"] button.close,
html body [data-notify="dismiss"],
html body .alert[data-notify] .close {
  position: absolute !important;
  right: 5px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  float: none !important;
  margin: 0 !important;
  opacity: 1 !important;
}
html body .text-success, html body .text-success * { color: ${p.successInk} !important; }

html body .badge-primary, html body .bg-primary,
html body .btn-primary:not(.btn-collapse), html body .btn.btn-primary:not(.btn-collapse) {
  background-color: ${p.primary} !important; color: #FFFFFF !important; border: 1px solid ${p.primary} !important;
}
html body .badge-primary *, html body .btn-primary:not(.btn-collapse) * { color: #FFFFFF !important; }
html body .badge-info, html body .bg-info { background-color: ${p.info} !important; color: ${p.text} !important; border: 1px solid ${p.fieldBorder} !important; }
html body .btn-info, html body .btn.btn-info { background-color: ${p.infoStrong} !important; color: #FFFFFF !important; border: 1px solid ${p.infoStrong} !important; }
html body .btn-info * { color: #FFFFFF !important; }

::-webkit-scrollbar { width: 12px; height: 12px; }
html body .main-panel, html body .modal, html body .modal-body, html body .table-responsive { scrollbar-gutter: stable; }
::-webkit-scrollbar-track { background: ${p.scrollTrack}; }
::-webkit-scrollbar-thumb { background: ${p.scrollThumb}; border: 1px solid ${p.border}; }
::-webkit-scrollbar-thumb:hover { background: ${p.scrollThumbHover}; }
::-webkit-scrollbar-corner { background: ${p.scrollTrack}; }
`
}

let theme = 'light'

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

/* Every skin except "Original MDC" has an entry in PALETTES. */
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

function keepLast() {
  try {
    const el = styleEl()
    const wanted = paletteNow()
    const css = themeNow() === 'off' ? '' : buildCss(wanted)
    if (el.textContent !== css) el.textContent = css
    const host = document.body || document.head || document.documentElement
    if (host && host.lastElementChild !== el) host.appendChild(el)
    el.disabled = themeNow() === 'off'
  } catch (_) {
  }
}

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
  if (!el || !el.style || !el.dataset) return
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

/* The MDC page header carries three icon controls, with these exact ids in the
   site's own markup:
     #navbarDropdownHistory        search history
     #navbarDropdownNotifications  notifications
     #navbarDropdownProfile        profile / account menu
   On a custom skin the whole nav-item is hidden here and never revealed again.
   Instead the client asks for the contents of a dropdown, renders them in its
   own menu next to Help, and asks us to follow the chosen link. That keeps the
   site dropdown from popping open half-way down the page and from bringing the
   original icons back. */
const HDR_SEL = {
  history: '#navbarDropdownHistory',
  bell: '#navbarDropdownNotifications',
  menu: '#navbarDropdownProfile'
}

function findHeaderCtl(kind) {
  const sel = HDR_SEL[kind]
  if (!sel) return null
  const nodes = document.querySelectorAll(sel)
  for (let i = 0; i < nodes.length; i++) {
    // The sidebar carries a second copy of the profile menu; prefer the one in
    // the top navigation bar.
    if (nodes[i].closest('.navbar')) return nodes[i]
  }
  return nodes[0] || null
}

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

/* The client owns appearance on a custom skin, so the site's own Day Mode /
   Night Mode switch (#darkMode) is left out of the mirrored menu. */
function isDayModeItem(node) {
  if (!node) return false
  if (node.id === 'darkMode') return true
  return /^(day|night)\s*mode$/i.test(labelText(node))
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
    // History and notification rows carry a title line plus a small timestamp
    // or source line; split them so the client can show both.
    const small = link.querySelector('span')
    const sub = small ? flatText(small) : ''
    let label = flatText(link)
    if (sub && label.endsWith(sub)) label = label.slice(0, label.length - sub.length).trim()
    if (!label && !sub) continue
    out.push({ index: i, label: label, sub: sub, href: link.getAttribute('href') || '' })
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
  const href = link.getAttribute('href') || ''
  // A real destination is followed directly; anything script-driven is clicked
  // on the hidden node, which still fires its handlers.
  if (href && href !== '#' && href.charAt(0) !== '#') {
    try {
      window.location.assign(link.href)
      return
    } catch (_) {
    }
  }
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
    const t = flatText(el)
    if (!t || t.length > 40) continue
    const isBanner = BANNER_RE.test(t)
    const isPoints = POINTS_RE.test(t)
    const isAge = AGE_RE.test(t)
    if (!isBanner && !isPoints && !isAge) continue

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
  if (el.closest('#cautionCodes')) return true
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

function markRow(el, props) {
  if (!el || !el.style || !el.dataset || el.dataset.mdtRow === '1') return
  if (el.closest && el.closest('[data-mdt-vanilla="1"]')) return
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
        // Keep the charge host block-level. Forcing flex here turned every
        // charge row into a flex item, which is what pushed the Charge /
        // Addition / Class fields outside the arrest report dialog.
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

// The "Time: 0 Days 0 Hours 0 Mins" readout sits on top of the Penal Code /
// Charge buttons and the first charge row. It needs a line of its own even in
// the arrest dialog, which is otherwise left on its vanilla layout, so this
// uses its own marker that exemptDialogs() does not clear.
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

// True for a wrapper whose only content is a single unlabelled icon button,
// which is how the red "remove charge" button is rendered.
function isLoneIconButton(el) {
  if (!el || !el.querySelectorAll) return false
  if (hasSelectish(el)) return false
  const btns = el.querySelectorAll('.btn, button')
  if (btns.length !== 1) return false
  return labelText(btns[0]).length === 0
}

// Each charge is laid out with Bootstrap columns that no longer fit the dialog,
// so the fields stretch unevenly and the red remove button wraps onto a line of
// its own. Lay every charge out as one nowrap flex line: the select columns
// share the free space and the icon buttons keep their intrinsic width. Uses
// its own markers because the arrest dialog is exempt from markRow().
function fixChargeRows() {
  if (themeNow() === 'off') {
    restoreChargeRows()
    return
  }
  const bodies = document.querySelectorAll('.modal-body')
  for (let b = 0; b < bodies.length; b++) {
    const body = bodies[b]
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
      // A charge is Charge + Addition + Class, so anything holding more than
      // four pickers is a wrapper around several charges, not one charge row.
      if (count < 2 || count > 4) continue
      if (flatText(row).length > 200) continue
      // Only take the innermost qualifying container.
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
          // A zero flex basis collapses the pickers, because their own width is
          // a percentage of the cell. Give them a real basis and a floor.
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
      // Pull a remove button that wrapped below the charge back onto its line.
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

// Revoke and Suspend each sit in their own block level wrapper, so they stacked
// vertically. Turn their shared wrapper into one centred row and make every
// wrapper between it and the buttons inline so they sit side by side.
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
          position: 'static'
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

// The MDC side panel is replaced by chips in the app's own tab strip, so its
// links are scraped here and handed to the shell.
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
    // Group headers such as Person Database only toggle a submenu, so they have
    // no target of their own and are dropped in favour of their children.
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

function navGo(url) {
  if (!url) return
  const links = document.querySelectorAll('a')
  for (let i = 0; i < links.length; i++) {
    if (links[i].href === url) {
      links[i].click()
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
let sidebarHidden = false

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
  if (!document.documentElement) return
  sidebarStyleEl()
  document.documentElement.classList.toggle('mdt-hide-sidebar', sidebarHidden)
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
  if (!document.documentElement) return
  searchStyleEl()
  document.documentElement.classList.toggle('mdt-hide-search', searchHidden)
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

function fixSingleScroller() {
  try {
    const html = document.documentElement
    const body = document.body
    if (!body) return

    if (themeNow() === 'off') {
      html.style.removeProperty('overflow-y')
      body.style.removeProperty('overflow-y')
      return
    }

    const panel = document.querySelector('.main-panel')
    const panelScrolls = !!panel && panel.scrollHeight - panel.clientHeight > 4

    if (panelScrolls) {
      html.style.setProperty('overflow-y', 'hidden', 'important')
      body.style.setProperty('overflow-y', 'hidden', 'important')
    } else {
      html.style.removeProperty('overflow-y')
      body.style.removeProperty('overflow-y')
    }
  } catch (_) {
  }
}

let scrollerTimer = null
function scheduleScrollerFix() {
  if (scrollerTimer) clearTimeout(scrollerTimer)
  scrollerTimer = setTimeout(() => {
    fixSingleScroller()
    exemptDialogs()
    fixContrast()
    deframeBanners()
    hideColourControls()
    colorEmotes()
    fixChargeBars()
    fixChargeRows()
    fixLicenseButtons()
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

function backgroundLuminance(el) {
  let node = el
  let hops = 0
  while (node && node.nodeType === 1 && hops < 40) {
    const c = parseRgb(getComputedStyle(node).backgroundColor)
    if (c && c.a > 0.2) return luminance(c)
    node = node.parentElement
    hops++
  }
  return themeNow() !== 'light' ? 0.16 : 0.94
}

function hasDirectText(el) {
  for (const n of el.childNodes) {
    if (n.nodeType === 3 && n.textContent && n.textContent.trim()) return true
  }
  return false
}

function fixContrast() {
  try {
    if (!document.body) return
    const p = paletteNow()

    document.body.querySelectorAll('*').forEach((el) => {
      if (!el.style || !el.dataset) return

      if (themeNow() === 'off') {
        if (el.dataset.mdtInk !== undefined) {
          if (el.dataset.mdtInk) el.style.setProperty('color', el.dataset.mdtInk)
          else el.style.removeProperty('color')
          delete el.dataset.mdtInk
        }
        return
      }

      if (!hasDirectText(el)) return

      const col = parseRgb(getComputedStyle(el).color)
      if (!col || col.a < 0.1) return

      const inkL = luminance(col)
      const bgL = backgroundLuminance(el)
      if (Math.abs(inkL - bgL) > 0.34) return

      if (el.dataset.mdtInk === undefined) {
        el.dataset.mdtInk = el.style.getPropertyValue('color') || ''
      }
      el.style.setProperty('color', bgL > 0.5 ? p.text : '#FFFFFF', 'important')
    })
  } catch (_) {
  }
}

function restoreInk() {
  document.querySelectorAll('[data-mdt-ink]').forEach((el) => {
    if (!el.style || !el.dataset) return
    const prev = el.dataset.mdtInk
    if (prev) el.style.setProperty('color', prev)
    else el.style.removeProperty('color')
    delete el.dataset.mdtInk
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

// Every painter below caches its work with a data-mdt-* marker and skips nodes
// it has already touched. That cache is palette specific, so switching skins
// left stale light-palette paint behind: on a WANTED record the banner host
// kept its light panel/border and rendered as a white box in dark mode.
// Dropping the markers on a skin change forces a clean repaint.
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
    restoreInlineColors()
  } catch (_) {
  }
}

// Filter strips: runs of fields and action buttons laid out on Material's
// column grid, which on Incident Database dropped Search Faction and the two
// buttons onto their own lines at odd sizes.
//
// The first attempt looked for one container holding the whole strip, but the
// card body that holds those fields also holds the results table, so nothing
// ever matched. Work per control instead: mark each control's own grid cell
// and the row that holds it, and let the CSS flatten just those.
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
    if (themeNow() === 'off' || document.documentElement.classList.contains('mdt-lookup')) {
      restoreFilterStrips()
      return
    }

    const byRow = new Map()
    document.body.querySelectorAll(FSTRIP_FIELD_SEL).forEach((field) => {
      if (!field.closest || field.closest(FSTRIP_SKIP_SEL)) return
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
      // A single control is just a field on the page; a strip is a run of them.
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

// The lookup pages are the only ones whose tab forms get recentred.
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

// The skin and the layout settings are remembered inside the page so a fresh
// navigation can paint them at document start, before anything else renders,
// instead of flashing the vanilla page while waiting for the host to report in.
const PREFS_KEY = 'mdtViewPrefs'
const BOOT_STYLE_ID = 'mdt-boot-cloak'
let lastPrefsJson = ''
let uncloaked = false

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
    if (saved.theme === 'dark' || saved.theme === 'light' || saved.theme === 'off') theme = saved.theme
    sidebarHidden = !!saved.sidebar
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
  } catch (_) {
  }
}

function cloak() {
  if (uncloaked || !document.documentElement || themeNow() === 'off') return
  cloakStyleEl()
  document.documentElement.classList.add('mdt-cloak')
  // Never leave the page hidden, whatever happens to the rest of the pass.
  setTimeout(uncloak, 1500)
}

function earlyBoot() {
  if (!document.documentElement) return false
  try {
    cloak()
    keepLast()
    watchStyles()
    applySidebarState()
    applySearchState()
  } catch (_) {
  }
  return true
}

function applyTheme(next) {
  const prev = theme
  // Any skin with a palette entry is valid; only "off" means leave the page alone.
  theme = PALETTES[next] ? next : next === 'off' ? 'off' : 'light'
  if (prev !== theme) resetPaintedState()
  keepLast()
  normalizeInlineColors()
  fixSingleScroller()
  fixContrast()
  deframeBanners()
  hideColourControls()
  colorEmotes()
  fixChargeBars()
  fixChargeRows()
  fixLicenseButtons()
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
  savePrefs()
}

// The stylesheet watcher used to start at DOMContentLoaded, so every stylesheet
// the site loaded before that point landed after our skin and the page painted
// vanilla for a frame. It now starts as soon as documentElement exists.
let styleObserver = null

function watchStyles() {
  if (styleObserver || !document.documentElement) return
  try {
    styleObserver = new MutationObserver((records) => {
      let restyle = false
      let recolor = false
      for (const r of records) {
        for (const n of r.addedNodes) {
          if (n.nodeType !== 1) continue
          if ((n.tagName === 'LINK' || n.tagName === 'STYLE') && n.id !== STYLE_ID) restyle = true
          if (n.id === 'cautionCodes' || n.closest === undefined) continue
          if (n.closest('#cautionCodes')) recolor = true
        }
      }
      if (restyle) keepLast()
      if (recolor) normalizeInlineColors()
      if (document.body) scheduleScrollerFix()
    })
    styleObserver.observe(document.documentElement, { childList: true, subtree: true })
  } catch (_) {
  }
}

loadPrefs()

// documentElement may not exist yet when this preload runs. readystatechange
// only fires at "interactive", by which point the vanilla page is already on
// screen, so poll on a zero delay until the element shows up instead.
if (!earlyBoot()) {
  const bootTimer = setInterval(() => {
    if (earlyBoot()) clearInterval(bootTimer)
  }, 0)
  setTimeout(() => clearInterval(bootTimer), 3000)
  document.addEventListener('readystatechange', earlyBoot)
}

document.addEventListener('DOMContentLoaded', () => {
  keepLast()
  normalizeInlineColors()
  reportPageInfo()
  scheduleScrollerFix()
  markLookupPage()
  setTimeout(uncloak, 200)
  window.addEventListener('resize', scheduleScrollerFix)

  watchStyles()
})

window.addEventListener('load', () => {
  keepLast()
  normalizeInlineColors()
  scheduleScrollerFix()
  uncloak()
})

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
  if (e.ctrlKey || e.metaKey) {
    if (e.altKey || e.shiftKey) return
    action = CTRL_HOTKEYS[String(e.key || '').toLowerCase()] || ''
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

/* Right-click a link (a nav entry, a record, a warrant) to open it as another
   page in the client instead of replacing the current one. */
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

function watchErrors() {
  if (!document.body) return
  try {
    errorObserver.observe(document.body, { childList: true, subtree: true })
  } catch (_) {}
}

if (document.body) watchErrors()
else document.addEventListener('DOMContentLoaded', watchErrors)

ipcRenderer.on('mdt:nav-go', (_e, url) => {
  navGo(String(url || ''))
})

ipcRenderer.on('mdt:set-sidebar', (_e, hidden) => {
  setSidebarHidden(hidden)
})

ipcRenderer.on('mdt:set-skin', (_e, value) => {
  if (typeof value === 'boolean') applyTheme(value ? 'light' : 'off')
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

function applySearchInputs() {
  if (!document.body) return
  if (!searchHidden || themeNow() === 'off') {
    document.querySelectorAll('[data-mdt-search-gone="1"]').forEach((el) => setSearchNodeHidden(el, false))
    if (!searchHidden) return
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

const VANILLA_DIALOG_RE = /add arrest report/i

function exemptDialogs() {
  const modals = document.querySelectorAll('.modal')
  const live = themeNow() !== 'off'
  for (let i = 0; i < modals.length; i++) {
    const m = modals[i]
    if (!m || !m.dataset || !m.querySelector) continue
    const head = m.querySelector('.modal-title') || m.querySelector('.modal-header')
    const label = flatText(head)
    const wanted = live && !!label && label.length < 120 && VANILLA_DIALOG_RE.test(label)
    if (wanted) {
      if (m.dataset.mdtVanilla === '1') continue
      m.dataset.mdtVanilla = '1'
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
