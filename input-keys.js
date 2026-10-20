'use strict'

;(function (root) {
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
  const api = { comboOf }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.mdtInput = api
})(globalThis)
