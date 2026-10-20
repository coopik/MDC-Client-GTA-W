'use strict'

const fs = require('fs')
const path = require('path')
const [dashboardPath, warrantPath, incidentPath] = process.argv.slice(2)
if (!dashboardPath || !warrantPath) throw new Error('Supply dashboard and warrant source paths')
const dashboard = fs.readFileSync(dashboardPath, 'utf8')
const warrant = fs.readFileSync(warrantPath, 'utf8')
const output = path.join(__dirname, 'fixtures')
fs.mkdirSync(output, { recursive: true })

function divAt(source, start) {
  const tokens = /<\/?div\b[^>]*>/gi
  tokens.lastIndex = start
  let depth = 0
  let token
  while ((token = tokens.exec(source))) {
    depth += /^<\//.test(token[0]) ? -1 : 1
    if (!depth) return source.slice(start, tokens.lastIndex)
  }
  throw new Error('Unbalanced fixture markup')
}

const searches = ['character', 'plate'].map((id) => {
  const field = dashboard.indexOf('id="' + id + '"')
  const start = dashboard.lastIndexOf('<div class="input-group', field)
  return divAt(dashboard, start).replace(/ on(?:click|keypress)="[^"]*"/g, '')
})
fs.writeFileSync(path.join(output, 'dashboard-search.html'), searches.map((html) => '<li>' + html + '</li>').join('\n'))
const stats = Array.from(dashboard.matchAll(/<div class="card card-stats">/g), (match) => divAt(dashboard, match.index))
fs.writeFileSync(path.join(output, 'dashboard-stats.html'), stats.join('\n'))
const recordStart = dashboard.search(/<div[^>]+id="modalViewRecord"/)
if (recordStart >= 0) fs.writeFileSync(path.join(output, 'record-view.html'), divAt(dashboard, recordStart).replace(/<!--[\s\S]*?-->/g, ''))
const ids = ['modalAddArrestWarrant', 'modalAddSearchWarrant', 'modalAddElectronicWarrant', 'modalAddFinancialWarrant']
const forms = ids.map((id) => {
  const start = warrant.search(new RegExp('<div[^>]+id="' + id + '"'))
  if (start < 0) throw new Error('Missing source form: ' + id)
  return divAt(warrant, start)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<select\b([^>]*)>[\s\S]*?<\/select>/g, (_all, attrs) => '<select' + attrs + '><option value="" disabled selected>Choose</option><option value="fixture">Fixture option</option></select>')
    .replace(/<img\b[^>]*>/g, '<img class="personPhotograph mx-auto" src="/seal.svg">')
    .replace(/<div class="collapse" id="collapseExample">[\s\S]*?(?=<textarea)/, '<div class="collapse" id="collapseExample"><p>Fixture narrative guide.</p></div>')
})
fs.writeFileSync(path.join(output, 'warrant-forms.html'), forms.join('\n'))
if (incidentPath) {
  const incident = fs.readFileSync(incidentPath, 'utf8')
  const actions = ['linkAPB','linkWarrant','linkCall','linkIncident','affiliationButton'].map(id => {
    const button = Array.from(incident.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g), match=>match[0]).find(html=>html.includes('id="'+id+'"'))
    if (!button) throw new Error('Missing incident action: '+id)
    return button
  })
  fs.writeFileSync(path.join(output, 'incident-actions.html'), actions.join('\n'))
  const start = incident.indexOf('<div class="card card-profile-elements ')
  if (start < 0) throw new Error('Missing incident source card')
  fs.writeFileSync(path.join(output, 'incident-create.html'), divAt(incident, start)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('src="/emergency/map"', 'src="/fixture-map"'))
}
console.log('Prepared dashboard search markup and four warrant forms without page scripts or account data')
