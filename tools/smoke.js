#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(root, 'renderer', 'index.html'), 'utf8')
const code = fs.readFileSync(path.join(root, 'renderer', 'renderer.js'), 'utf8')

const ids = new Set()
for (const m of html.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1])

const countClass = (cls) => {
  const re = new RegExp('class="[^"]*\\b' + cls + '\\b[^"]*"', 'g')
  return (html.match(re) || []).length
}

const MENU_COUNT = countClass('menu')
const MENU_ITEM_COUNT = countClass('menu-item')

const WEBVIEW_METHODS = [
  'send', 'loadURL', 'reload', 'stop', 'goBack', 'goForward', 'print',
  'setZoomLevel', 'findInPage', 'stopFindInPage', 'openDevTools', 'getURL',
  'focus', 'select', 'scrollIntoView', 'appendChild', 'removeChild',
  'setAttribute', 'insertBefore'
]

function classList(node) {
  const set = new Set()
  return {
    _set: set,
    add: (c) => set.add(c),
    remove: (c) => set.delete(c),
    contains: (c) => set.has(c),
    toggle: (c, force) => {
      const want = force === undefined ? !set.has(c) : !!force
      if (want) set.add(c)
      else set.delete(c)
      return want
    }
  }
}

function makeNode(desc) {
  const node = {
    id: typeof desc === 'string' ? desc : '',
    tagName: 'DIV',
    style: { setProperty() { }, getPropertyValue: () => '' },
    dataset: {},
    textContent: '',
    innerHTML: '',
    value: '',
    checked: false,
    disabled: false,
    listeners: {},
    children: [],
    addEventListener(ev, fn) {
      ; (this.listeners[ev] = this.listeners[ev] || []).push(fn)
    },
    removeEventListener() { },
    dispatch(ev, payload) {
      ; (this.listeners[ev] || []).forEach((fn) => fn(Object.assign({ stopPropagation() { }, preventDefault() { } }, payload)))
    },
    getAttribute(name) { return this.attrs && this.attrs[name] !== undefined ? this.attrs[name] : null },
    setAttribute(name, v) { this.attrs = this.attrs || {}; this.attrs[name] = v },
    querySelector() { return makeNode('') },
    querySelectorAll() { return [] },
    canGoBack: () => false,
    canGoForward: () => false
  }
  node.classList = classList(node)
  WEBVIEW_METHODS.forEach((m) => { if (!node[m]) node[m] = () => { } })
  return node
}

const nodes = new Map()
const missing = []

const menuNodes = []
for (let i = 0; i < MENU_COUNT; i++) {
  const menu = makeNode('menu-' + i)
  const label = makeNode('menu-label-' + i)
  menu.querySelector = (sel) => (sel === '.menu-label' ? label : null)
  menu._label = label
  menuNodes.push(menu)
}

const menuItems = []
for (let i = 0; i < MENU_ITEM_COUNT; i++) {
  const item = makeNode('menu-item-' + i)
  item.attrs = { 'data-action': 'about' }
  menuItems.push(item)
}

const documentListeners = {}

const document = {
  title: '',
  body: makeNode('body'),
  listeners: documentListeners,
  getElementById(id) {
    if (!ids.has(id)) { missing.push(id); return null }
    if (!nodes.has(id)) nodes.set(id, makeNode(id))
    return nodes.get(id)
  },
  querySelector(sel) {
    if (sel === '.menu') return menuNodes[0] || null
    return null
  },
  querySelectorAll(sel) {
    if (sel === '.menu') return menuNodes
    if (sel === '.menu-item') return menuItems
    return []
  },
  addEventListener(ev, fn) { (documentListeners[ev] = documentListeners[ev] || []).push(fn) },
  createElement: () => makeNode(''),
  createTextNode: () => ({}),
  dispatchEvent: () => true
}

const store = {}
const sandbox = {
  console,
  document,
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] }
  },
  setInterval: () => 0,
  dispatchEvent: () => true,
  clearInterval: () => { },
  setTimeout: () => 0,
  Promise,
  Date,
  Math,
  JSON,
  String,
  Number,
  Object,
  Array
}
sandbox.window = sandbox
sandbox.addEventListener = () => { }
sandbox.removeEventListener = () => { }
sandbox.Event = function Event(type) { this.type = type }
sandbox.innerWidth = 1280
sandbox.innerHeight = 860
sandbox.mdt = {
  getInfo: () => Promise.resolve({ version: '1.0.0', electron: '31.0.0', chrome: '126' }),
  clearSession: () => Promise.resolve(),
  openExternal: () => { },
  quit: () => { },
  messageBox: () => Promise.resolve(1)
}

const failures = []
const warnings = []
const realWarn = console.warn
console.warn = (...a) => warnings.push(a.join(' '))

try {
  vm.runInNewContext(code, sandbox, { filename: 'renderer.js' })
} catch (err) {
  failures.push('renderer.js threw at load: ' + (err && err.stack ? err.stack : err))
}

console.warn = realWarn

if (missing.length) {
  failures.push('renderer.js looked up ids absent from index.html: ' + [...new Set(missing)].join(', '))
}

if (MENU_COUNT === 0) failures.push('index.html has no .menu elements')

const unwiredLabels = menuNodes.filter((m) => !(m._label.listeners.click || []).length).length
if (unwiredLabels) failures.push(unwiredLabels + ' of ' + MENU_COUNT + ' menu labels have no click handler')

const unwiredItems = menuItems.filter((i) => !(i.listeners.click || []).length).length
if (unwiredItems) failures.push(unwiredItems + ' of ' + MENU_ITEM_COUNT + ' menu items have no click handler')

if (!(documentListeners.keydown || []).length) failures.push('no global keydown handler (shortcuts dead)')
if (!(documentListeners.click || []).length) failures.push('no global click handler (menus would never close)')

if (menuNodes.length) {
  menuNodes[0]._label.dispatch('click')
  if (!menuNodes[0].classList.contains('open')) failures.push('clicking a menu label did not open the menu')
    ; (documentListeners.click || []).forEach((fn) => fn({}))
  if (menuNodes[0].classList.contains('open')) failures.push('clicking elsewhere did not close the menu')
}

if (warnings.length) {
  console.log('warnings from renderer.js:')
  warnings.forEach((w) => console.log('  ' + w))
}

if (failures.length) {
  console.error('SMOKE TEST FAILED')
  failures.forEach((f) => console.error('  - ' + f))
  process.exit(1)
}

console.log('SMOKE TEST PASSED')
console.log('  menus wired:      ' + MENU_COUNT)
console.log('  menu items wired: ' + MENU_ITEM_COUNT)
console.log('  ids resolved:     ' + nodes.size)