'use strict'

const { app, BrowserWindow, session, ipcMain, webContents } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const assert = require('assert/strict')
const { vendorResponse, widgetFixture, verifyWidgets } = require('./widget-fixture')
const {workspaceFixture,forumFixture,verifyWorkspace,verifyPenal} = require('./workspace-fixture')
const {regressionFixture,verifyRegressions} = require('./regression-fixture')
const {performanceFixture,verifyPerformance} = require('./performance-fixture')
const {siteAsset,siteSourceFixture,verifySiteSource} = require('./site-source-fixture')
const {verifyInteractions} = require('./interaction-fixture')
const {authoringFixture, documentFixture, verifyDocumentLayouts} = require('./document-layout-fixture')
const {popupFixture, verifyPopups} = require('./popup-fixture')
const {verifyMinimized} = require('./minimized-fixture')
const {scrollbarFixture,verifyScrollbars} = require('./scrollbar-fixture')
const {persistentDockFixture,verifyPersistentDock} = require('./persistent-dock-fixture')
const {recordSurfaceFixture,verifyRecordSurfaces}=require('./record-surface-fixture')
const {verifyModalForms}=require('./modal-form-fixture')
const {verifyPickerInteractions,verifyStatusPanels}=require('./picker-interaction-fixture')
const {verifyRelease110}=require('./release110-fixture')
const {release111Fixture,verifyRelease111}=require('./release111-fixture')
const {release112Fixture,verifyRelease112}=require('./release112-fixture')
const root = path.resolve(__dirname, '..')
const output = path.join(root, 'dist', 'verification')
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'patrolone-verify-')))
app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('disable-renderer-backgrounding')
if ((process.argv.includes('--inspect-popups') || process.argv.includes('--review-fixes'))) app.commandLine.appendSwitch('remote-debugging-port','9222')
let win
let checks = 0
const errors = []
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const destinations = [['Dashboard', '/'], ['Person Lookup', '/lookup'], ['DMV Database', '/dmv'], ['Profile', '/profile'], ['Incident Database', '/incidents'], ['Vehicle Map', '/map/vehicles'], ['Online Warrants', '/warrants/online'], ['Warrants Database', '/warrants/database'], ['Active Warrants', '/warrants'], ['Emergency Map', '/map/emergency'], ['Paperwork Generators', '/paperwork']]

function fixture(url) {
  return `<!doctype html><html><head><title>Mobile Data Computer</title>
  <script>
  window.bootHidden = document.documentElement.classList.contains('mdt-hide-sidebar');
  window.samples = [];
  function sample() {
    const side = document.querySelector('.sidebar');
    if (side) samples.push(getComputedStyle(side).display);
    if (samples.length < 120) requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
  </script>
  <style>
  body { margin: 0; font: 14px Arial; background: white; }
  .sidebar { position: fixed; width: 260px; inset: 0 auto 0 0; background: pink; }
  .sidebar a { display: block; padding: 10px; }
  .main-panel { margin-left: 260px; }
  .navbar { padding: 12px; } .content { padding: 24px; }
  .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .card { margin: 16px 0; border: 1px solid gray; } .card-header { margin: -10px 12px 0; }
  .table { width: 100%; border-collapse: collapse; }
  .modal { display: none; z-index: 1050; position: fixed; inset: 0; background: transparent; }
  .modal.show { display: block; } .modal-dialog { width: 520px; margin: 50px auto; }
  .modal-content { background: white; } .modal-body { padding: 14px; }
  .dropdown-menu { display: none; max-height: 175px; overflow-y: auto; }
  .dropdown-menu.show { display: block; } .collapse { transition: height .35s ease; }
  </style></head><body>
  <aside class="sidebar"><h3>Mobile Data Computer</h3><ul class="nav">${destinations.map(([name, href]) => `<li class="nav-item"><a class="nav-link" href="${href}">${name}</a></li>`).join('')}</ul></aside>
  <div class="main-panel"><nav class="navbar">Police Officer II - Harlan McClane #225373 <li class="nav-item"><a id="navbarDropdownNotifications">Notifications <span class="badge">2</span></a><div class="dropdown-menu"><a class="unread" href="/record/406471" onclick="event.preventDefault(); this.classList.remove('unread'); document.querySelector('#navbarDropdownNotifications .badge').textContent='1'; window.notificationOpened=true">New report available <span>Today 14:10</span></a><a href="/incidents/911">Incident updated <span>Today 13:05</span></a></div></li><form><input id="character" placeholder="Search Person"></form><form><input id="plate" placeholder="Search Vehicle"></form></nav>
  <main class="content"><section class="card card-profile"><div class="card-body"><h3 class="characterDetailsName">Harlan McClane</h3><p>Los Santos Police Department / Police Officer II</p><a id="inside" href="/profile">View Profile</a> / <a id="new-record" href="/record/225373">Open Record</a></div></section>
  <div class="columns">${['Licenses', 'Registered vehicles', 'Related incidents', 'Caution codes'].map((title, index) => `<section class="card"><div class="card-header"><h4 class="card-title">${title}</h4><button class="btn btn-collapse">${index % 2 ? '-' : '+'}</button></div><div class="card-body"><table class="table"><thead><tr><th>Record</th><th>State</th></tr></thead><tbody><tr><td><a href="/dmv/LCY209">LCY209</a></td><td>Valid</td></tr><tr><td>MOE812</td><td>Valid</td></tr></tbody></table><button class="btn btn-primary" onclick="document.querySelector('.modal').classList.add('show')">Actions</button></div></section>`).join('')}</div>
  <p>${new URL(url).pathname}</p><img src="/slow.svg" width="1" height="1"></main></div>
  <div class="modal"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">Record details</h4><button class="close" onclick="document.querySelector('.modal').classList.remove('show')">x</button></div><div class="modal-body"><label>Name</label><input class="form-control" value="Harlan McClane"><input type="file"><div class="bootstrap-select"><button class="btn dropdown-toggle">Options</button><div class="dropdown-menu">${Array.from({length:40}, (_, i) => `<div class="dropdown-item">Option ${i + 1}</div>`).join('')}</div></div></div><div class="modal-footer"><button class="btn btn-primary">Save</button></div></div></div></div>
  </body></html>`
}

async function until(fn, label) {
  const end = Date.now() + 10000
  while (Date.now() < end) {
    try { if (await fn()) return } catch (_) {}
    await delay(35)
  }
  throw new Error('Timed out: ' + label)
}
const shell = (code) => win.webContents.executeJavaScript(code, true)
async function guest() { return webContents.fromId(await shell('wv.getWebContentsId()')) }
async function inspect(label, hidden = true) {
  await until(async () => {
    const g = await guest()
    return !g.isLoading() && await g.executeJavaScript('document.readyState === "complete" && samples.length >= 2')
  }, label)
  await delay(80)
  const state = await (await guest()).executeJavaScript(`({boot: bootHidden, samples: samples.slice(), hidden: document.documentElement.classList.contains('mdt-hide-sidebar'), width: document.querySelector('.main-panel').getBoundingClientRect().width, viewport: document.documentElement.clientWidth})`)
  assert.equal(state.boot, hidden, label + ': document-start preference')
  assert.equal(state.hidden, hidden, label + ': final class')
  assert.ok(state.samples.every((value) => (value === 'none') === hidden), label + ': sidebar changed during a frame: ' + state.samples)
  if (hidden) assert.ok(Math.abs(state.width - state.viewport) <= 1, label + ': main panel width ' + JSON.stringify(state))
  checks++
  console.log('PASS ' + label)
}
async function navigate(code, label, hidden = true) {
  await (await guest()).executeJavaScript('document.body.click()', true)
  const before = (await guest()).getURL()
  await shell(code)
  await until(async () => { const next = await guest(); return next.isLoading() || next.getURL() !== before }, label + ' started')
  await inspect(label, hidden)
}

app.whenReady().then(async () => {
  fs.mkdirSync(output, { recursive: true })
  await session.fromPartition('persist:gtaw-mdc').protocol.handle('https', async (request) => {
    const url = new URL(request.url)
    if(url.pathname==='/webfonts/fa-solid-900.woff2')return siteAsset(new URL('https://mdc.gta.world/site-vendor/fa-solid-900.woff2'))
    const vendor = vendorResponse(url) || siteAsset(url)
    if (vendor) return vendor
    if (url.pathname === '/review-fixes') return new Response(popupFixture().replace('</main>', fs.readFileSync(path.join(__dirname,'fixtures/person-record.html'),'utf8')+fs.readFileSync(path.join(__dirname,'fixtures/badge-menus.html'),'utf8')+'<textarea id=review-editor></textarea></main>').replace('window.popupReady=true;',"$('#review-editor').summernote({height:180});window.popupReady=true;"),{headers:{'content-type':'text/html'}})
    if (url.pathname === '/dock-record') {const body=await request.text();const id=new URLSearchParams(body).get('id');return new Response(JSON.stringify({id,name:id==='406471'?'Lucy Summers':'Harrison Leung'}),{headers:{'content-type':'application/json'}})}
    if (url.pathname.startsWith('/dock-')) return new Response(persistentDockFixture(url.pathname),{headers:{'content-type':'text/html; charset=utf-8'}})
    if (url.pathname === '/scrollbars') return new Response(scrollbarFixture(),{headers:{'content-type':'text/html; charset=utf-8'}})
    if (url.pathname === '/popup-fixture') return new Response(popupFixture(), {headers:{'content-type':'text/html; charset=utf-8'}})
    if (url.pathname === '/fixture-map') return new Response('<html><body style="margin:0;background:#c4d6b2">Local map fixture</body></html>', {headers:{'content-type':'text/html'}})
    if (/^\/(incident|apb|warrant|report|arrest|custom)\/(create|edit)\/layout-fixture$/.test(url.pathname)) return new Response(authoringFixture(url.pathname.split('/')[1]), {headers:{'content-type':'text/html; charset=utf-8'}})
    if (url.pathname === '/release111') return new Response(release111Fixture(),{headers:{'content-type':'text/html; charset=utf-8'}})
    if (url.pathname === '/incident/create/release112') return new Response(release112Fixture(),{headers:{'content-type':'text/html; charset=utf-8'}})
    if (url.pathname === '/post-arrest') return new Response(siteSourceFixture(true),{headers:{'content-type':'text/html; charset=utf-8'}})
    if (url.pathname === '/record-surfaces') return new Response(recordSurfaceFixture(),{headers:{'content-type':'text/html; charset=utf-8'}})
    if (url.pathname === '/document-layout') return new Response(documentFixture(), {headers:{'content-type':'text/html; charset=utf-8'}})
    if (url.hostname === 'mdc.gta.world' && url.pathname === '/source-markup') return new Response(siteSourceFixture(), { headers: { 'content-type': 'text/html; charset=utf-8' } })
    if (url.pathname === '/seal.svg') return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="100" cy="100" r="98" fill="gold"/><circle cx="100" cy="100" r="80" fill="#294d75"/><text x="100" y="105" text-anchor="middle" fill="white">SAN ANDREAS</text></svg>',{headers:{'content-type':'image/svg+xml'}})
    if (url.pathname === '/slow.svg') {
      await delay(350)
      return new Response('<svg xmlns="http://www.w3.org/2000/svg"/>', { headers: { 'content-type': 'image/svg+xml' } })
    }
    if (url.hostname === 'mdc.gta.world') return new Response(url.pathname === '/performance' ? performanceFixture(fixture(request.url)) : url.pathname === '/widgets' ? widgetFixture(fixture(request.url)) : url.pathname === '/workspace' ? workspaceFixture(fixture(request.url)) : url.pathname === '/regressions' ? regressionFixture(fixture(request.url)) : fixture(request.url), { headers: { 'content-type': 'text/html; charset=utf-8' } })
    if (url.hostname === 'forum.gta.world') return new Response(forumFixture(), { headers: { 'content-type': 'text/html; charset=utf-8' } })
    return new Response('<html><body><form>Sign in<input type="password"></form></body></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } })
  })
  await session.defaultSession.protocol.handle('https', () => new Response('', { headers: { 'content-type': 'text/css' } }))
  for (const channel of ['app:setTray', 'app:setPresence', 'app:setWindowTheme']) ipcMain.handle(channel, () => {})
  ipcMain.handle('app:messageBox',(_event,options)=>{win.fixtureMessageBox=options;return win.fixtureMessageBoxResponse??1})
  ipcMain.handle('app:info', () => ({ version: require(path.join(root, 'package.json')).version }))
  ipcMain.handle('app:startupOnce', () => false)
  app.on('web-contents-created', (_event, contents) => {
    contents.on('console-message', (_ev, level, message) => {
      if (level >= 3 && !/Content Security Policy|ERR_|Failed to load resource/.test(message)) errors.push(message)
    })
    if (contents.getType() === 'webview') contents.setWindowOpenHandler(({ url }) => {
      win.webContents.send('app:openPage', url)
      return { action: 'deny' }
    })
  })
  win = new BrowserWindow({ width: 1440, height: 980, show: process.argv.includes('--review-fixes'), titleBarStyle: 'hidden', titleBarOverlay: { color: '#252525', symbolColor: '#FFFFFF', height: 36 }, webPreferences: { preload: path.join(root, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false, webviewTag: true, backgroundThrottling: false, offscreen: !process.argv.includes('--review-fixes') } })
  await win.loadFile(path.join(root, 'renderer', 'index.html'))
  await inspect('first launch')
  await until(() => shell('navItems.length >= 9'), 'navigation discovered')
  if (process.argv.includes('--review-fixes')) {
    await shell(`setTheme('p1');wv.loadURL('https://mdc.gta.world/review-fixes')`)
    console.log('REVIEW READY')
    while(!(await shell('window.finishReview===true'))) await delay(500)
    return
  }
  if (process.argv.includes('--popups-only')) {
    checks += await verifyPopups({shell,guest,until,delay,win,output})
    assert.deepEqual(errors, [], 'renderer/preload errors')
    console.log('POPUP VERIFICATION PASSED: '+checks+' checks')
    return
  }
  if(process.argv.includes('--picker-interactions-only')||process.argv.includes('--picker-resize-only')) {checks+=await verifyPickerInteractions({shell,guest,until,delay,win,output});assert.deepEqual(errors,[]);console.log('PICKER INTERACTIONS PASSED: '+checks+' checks');return}
  if(process.argv.includes('--keys-only')) {checks+=await verifyInteractions({shell,guest,until,delay,win,output,webContents});assert.deepEqual(errors,[]);console.log('KEYS PASSED: '+checks+' checks');return}
  if(process.argv.includes('--release111-only')) {if(process.argv.includes('--after110'))checks+=await verifyRelease110({shell,guest,until,delay,win,output});checks+=await verifyRelease111({shell,guest,until,delay,win,output});assert.deepEqual(errors,[]);console.log('RELEASE 1.1.1 PASSED: '+checks+' checks');return}
  if(process.argv.includes('--release112-only')) {checks+=await verifyRelease112({shell,guest,until,delay,win,output});assert.deepEqual(errors,[]);console.log('RELEASE 1.1.2 PASSED: '+checks+' checks');return}
  if(process.argv.includes('--release110-only')) {checks+=await verifyRelease110({shell,guest,until,delay,win,output});assert.deepEqual(errors,[]);console.log('RELEASE 1.1.0 PASSED: '+checks+' checks');return}
  if(process.argv.includes('--status-panels-only')) {checks+=await verifyStatusPanels({shell,guest,until,delay,win,output});assert.deepEqual(errors,[]);console.log('STATUS PANELS PASSED: '+checks+' checks');return}
  if(process.argv.includes('--modal-forms-only')) {checks+=await verifyModalForms({shell,guest,until,delay,win,output,colors:process.argv.includes('--colors')});assert.deepEqual(errors,[]);console.log('MODAL FORMS PASSED: '+checks+' checks');return}
  if(process.argv.includes('--record-surfaces-only')) {checks+=await verifyRecordSurfaces({shell,guest,until,delay});assert.deepEqual(errors,[]);console.log('RECORD SURFACES PASSED: '+checks+' checks');return}
  if (process.argv.includes('--documents-only')) {
    checks += await verifyDocumentLayouts({shell,guest,until,delay,win,output})
  checks += await verifyRecordSurfaces({shell,guest,until,delay})
    assert.deepEqual(errors, [], 'renderer/preload errors')
    console.log('DOCUMENT LAYOUT VERIFICATION PASSED: '+checks+' checks')
    return
  }
  if (process.argv.includes('--performance-only')) {
    checks += await verifyPerformance({shell,guest,until,delay,output,baseline:process.argv.includes('--baseline')})
    assert.deepEqual(errors, [], 'renderer/preload errors')
    console.log('PERFORMANCE VERIFICATION PASSED: '+checks+' checks')
    return
  }
  if (process.argv.includes('--source-only')) {
    checks += await verifySiteSource({shell,guest,until,delay,win,output})
  checks += await verifyModalForms({shell,guest,until,delay,win,output,colors:true})
    assert.deepEqual(errors, [], 'renderer/preload errors')
    console.log('SOURCE MARKUP VERIFICATION PASSED: '+checks+' checks')
    return
  }
  if (process.argv.includes('--interactions-only')) {
    checks += await verifyPickerInteractions({shell,guest,until,delay,win,output})
  checks += await verifyStatusPanels({shell,guest,until,delay,win,output})
  checks += await verifyInteractions({shell,guest,until,delay,win,output,webContents})
    assert.deepEqual(errors, [], 'renderer/preload errors')
    console.log('INTERACTION VERIFICATION PASSED: '+checks+' checks')
    return
  }
  if (process.argv.includes('--widgets-only')) {
    checks += await verifyWidgets({shell,guest,until,delay,win,output})
    assert.deepEqual(errors, [], 'renderer/preload errors')
    console.log('WIDGET VERIFICATION PASSED: '+checks+' checks')
    return
  }
  if (process.argv.includes('--persistent-dock-only')) {
    checks += await verifyPersistentDock({shell,guest,until,delay,win})
    assert.deepEqual(errors, [], 'renderer/preload errors')
    console.log('PERSISTENT DOCK VERIFICATION PASSED: '+checks+' checks')
    return
  }
  if (process.argv.includes('--scrollbars-only')) {
    checks += await verifyScrollbars({shell,guest,until,delay,win})
    assert.deepEqual(errors, [], 'renderer/preload errors')
    console.log('SCROLLBAR VERIFICATION PASSED: '+checks+' checks')
    return
  }
  if (process.argv.includes('--minimized-only')) {
    checks += await verifyMinimized({shell,guest,until,delay,win,output})
    assert.deepEqual(errors, [], 'renderer/preload errors')
    console.log('MINIMIZED RECORD VERIFICATION PASSED: '+checks+' checks')
    return
  }
  if (process.argv.includes('--regressions-only')) {
    checks += await verifyRegressions({shell,guest,until,delay,win,output})
    assert.deepEqual(errors, [], 'renderer/preload errors')
    console.log('TARGETED REGRESSIONS PASSED: '+checks+' checks')
    return
  }
  await navigate(`Array.from(document.querySelectorAll('.navchip')).find((n) => n.textContent.includes('DMV')).click()`, 'navigation chip')
  await shell(`histAdd({url:'https://mdc.gta.world/record/225373',label:'Harlan McClane',kind:'Record'}); histAdd({url:'https://mdc.gta.world/record/406471',label:'Lucy Summers',kind:'Record'}); histAdd({url:'https://mdc.gta.world/incidents/911',label:'Incident #911',kind:'Incident'})`)
  await navigate(`Array.from(document.querySelectorAll('.quickbtn')).find((n) => n.textContent.includes('Lucy')).click()`, 'recent record rail')
  await navigate(`wv.executeJavaScript("document.getElementById('inside').click()")`, 'in-page link')
  await navigate(`actions.back()`, 'back')
  await navigate(`actions.forward()`, 'forward')
  await navigate(`actions.reload()`, 'reload')
  await navigate(`actions.focusname(); document.getElementById('ask-q').value = 'Harlan McClane'; document.getElementById('ask-go').click()`, 'name check without toolbar')
  await navigate(`actions.focusplate(); document.getElementById('ask-q').value = 'LCY209'; document.getElementById('ask-go').click()`, 'plate check without toolbar')
  await navigate(`openPage('https://mdc.gta.world/dmv')`, 'new page')
  await navigate(`Array.from(document.querySelectorAll('.navchip')).find((n) => n.textContent.includes('Profile')).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))`, 'navigation chip new page')
  await navigate(`Array.from(document.querySelectorAll('.quickbtn')).find((n) => n.textContent.includes('Harlan')).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))`, 'recent record new page')
  await navigate(`wv.executeJavaScript("document.getElementById('new-record').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))")`, 'in-page link new page')
  await navigate(`wv.executeJavaScript("window.open('/profile', '_blank')")`, 'site popup new page')
  await shell(`setTheme('off')`)
  await navigate(`wv.loadURL('https://mdc.gta.world/dmv')`, 'Original MDC stock sidebar', false)
  await shell(`view.navBar = false; view.sidebar = true; savePref('sidebar', true); applyView()`)
  await navigate(`wv.loadURL('https://mdc.gta.world/profile')`, 'visible sidebar preference', false)
  await shell(`setTheme('p1'); view.sidebar = false; savePref('sidebar', false); view.navBar = true; applyView()`)
  await navigate(`wv.loadURL('https://mdc.gta.world/dmv')`, 'hidden preference restored')
  assert.equal(await shell(`document.querySelector('.navchip.active').textContent`), 'DMV Database')
  for (const theme of ['p1', 'aero', 'aerolapd', 'aerodark', 'off']) {
    await shell(`setTheme('${theme}')`)
    await delay(150)
    const layout = await shell(`(() => {
      const box = (selector) => { const n = document.querySelector(selector); const r = n.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height,display:getComputedStyle(n).display } };
      return { nav:box('#tab-nav'), rail:box('#quick-bar'), content:box('.content'), status:box('#p1-status'), actions:box('#p1-actions'), body:innerWidth, webview:box('webview:not(.wv-off)') }
    })()`)
    if (theme !== 'off') {
      const frameBlock = fs.readFileSync(path.join(root,'main.js'),'utf8').split('const frames = {')[1].split('}')[0]
      const color = /'([^']+)'/.exec(frameBlock.split(/\r?\n/).find((line)=>line.trim().startsWith(theme+':')))[1]
      const rgb = 'rgb(' + [1,3,5].map((i)=>parseInt(color.slice(i,i+2),16)).join(', ') + ')'
      assert.equal(await shell(`getComputedStyle(document.querySelector('.titlebar')).backgroundColor`),rgb,theme+': caption surface matches native button color')
      assert.equal(await shell(`getComputedStyle(document.querySelector('.titlebar')).backgroundImage`),'none',theme+': no gradient seam at native controls')
      assert.ok(layout.nav.width >= layout.body - 4, theme + ': full-width icon bar')
      assert.ok(layout.rail.x < layout.content.x && layout.rail.height > 100, theme + ': shortcut rail')
      assert.ok(layout.content.height > 300 && layout.webview.height > 300, theme + ': embedded view fills content')
      assert.equal(layout.status.display, 'flex', theme + ': status strip')
      assert.equal(layout.actions.display, 'flex', theme + ': action bar')
      const palette = await (await guest()).executeJavaScript(`({ header:getComputedStyle(document.querySelector('.card-header')).backgroundImage, scheme:getComputedStyle(document.documentElement).colorScheme })`)
      assert.ok(palette.header.includes('gradient'), theme + ': panel header')
      assert.equal(palette.scheme, theme === 'aerodark' || theme === 'aerolapd' ? 'dark' : 'light', theme + ': native field palette')
      assert.ok(!palette.header.includes('undefined'), theme + ': valid palette')
      assert.ok(await shell(`Array.from(document.querySelectorAll('#p1-actions img')).length === 6 && Array.from(document.querySelectorAll('#p1-actions img')).every((n) => n.complete && n.naturalWidth > 0)`), theme + ': bottom action icons')
      assert.equal(await shell(`new Set(Array.from(document.querySelectorAll('.navchip')).filter((n) => /Online Warrants|Warrants Database|Active Warrants/.test(n.textContent)).map((n) => n.querySelector('img').src)).size`),3,theme + ': distinct warrant icons')
      assert.ok(await shell(`document.getElementById('hdr-ctl').getBoundingClientRect().y >= document.getElementById('p1-status').getBoundingClientRect().y && document.getElementById('hdr-ctl').getBoundingClientRect().y > document.querySelector('.titlebar').getBoundingClientRect().bottom`),theme + ': history and alerts clear of native controls')
      assert.ok(await shell(`Array.from(document.querySelectorAll('#tab-nav img')).every((n) => n.complete && n.naturalWidth > 0)`), theme + ': bundled navigation icons')
      const collapseGuest = await guest()
      await collapseGuest.executeJavaScript(`document.querySelector('.btn-collapse').innerHTML='<i class="fa fa-plus"></i>'`)
      await delay(150)
      assert.equal(await collapseGuest.executeJavaScript(`document.querySelector('.btn-collapse').dataset.mdtCollapse`),'plus',theme + ': plus state')
      await collapseGuest.executeJavaScript(`document.querySelector('.btn-collapse i').className='fa fa-minus'`)
      await delay(50)
      assert.equal(await collapseGuest.executeJavaScript(`document.querySelector('.btn-collapse').dataset.mdtCollapse`),'minus',theme + ': glyph follows native icon class updates')
      assert.ok(await collapseGuest.executeJavaScript(`(() => {const button=document.querySelector('.btn-collapse'),rect=button.getBoundingClientRect(),bar=getComputedStyle(button,'::before');return bar.content === '""' && parseFloat(bar.width)===8 && Math.abs(parseFloat(bar.left)-rect.width/2)<2})()`),theme + ': collapse symbol is geometrically centered')
      assert.ok(await (await guest()).executeJavaScript(`Array.from(document.querySelectorAll('.columns .card-header .btn-collapse')).every((n) => { const a=n.getBoundingClientRect(), b=n.closest('.card-header').getBoundingClientRect(); return Math.abs(a.y + a.height / 2 - b.y - b.height / 2) <= 1 })`), theme + ': plus/minus controls centered')
    } else {
      assert.equal(layout.status.display, 'none')
      assert.equal(layout.actions.display, 'none')
    }
    if (theme !== 'off') {
      const g = await guest()
      await g.executeJavaScript(`document.querySelector('.modal').classList.add('show')`)
      const dialog = await g.executeJavaScript(`({ background: getComputedStyle(document.querySelector('.modal')).backgroundColor, frame: getComputedStyle(document.querySelector('.modal-content')).boxShadow, width: document.querySelector('.modal-content').getBoundingClientRect().width })`)
      assert.equal(dialog.background, 'rgba(0, 0, 0, 0)', theme + ': modal backdrop is transparent')
      assert.ok(dialog.width > 100 && dialog.frame !== 'none', theme + ': dialog frame')
      await delay(100)
      fs.writeFileSync(path.join(output, theme + '-dialog.png'), (await win.webContents.capturePage()).toPNG())
      await g.executeJavaScript(`document.querySelector('.modal').classList.remove('show')`)
    }
    await shell(`actions.options()`)
    assert.equal(await shell(`document.querySelectorAll('input[name="opt-theme"]').length`), 5)
    assert.equal(await shell(`document.querySelector('#dialog-body').textContent.includes('undefined')`), false)
    await shell(`closeDialog()`)
    win.webContents.invalidate()
    await delay(200)
    fs.writeFileSync(path.join(output, theme + '.png'), (await win.webContents.capturePage()).toPNG())
    checks++
    console.log('PASS ' + theme + ' layout, Options and native palette')
  }
  await shell(`setTheme('p1'); document.getElementById('hb-history').click()`)
  assert.ok(await shell(`document.querySelector('#modal-backdrop .dialog-title').textContent.includes('History')`))
  await shell(`document.getElementById('hist-kind').value='incidents'; document.getElementById('hist-kind').dispatchEvent(new Event('change'))`)
  assert.ok(await shell(`Array.from(document.querySelectorAll('.hist-row')).every((n) => /Incident|Warrant|APB/.test(n.querySelector('.hist-kind').textContent))`))
  await shell(`closeDialog(); document.getElementById('hb-bell').click()`)
  await until(() => shell(`document.querySelectorAll('.hdrpop-item').length === 2`),'notifications from actual page links')
  assert.equal(await shell(`alertCount`),2,'opening alerts preserves actual unread count')
  assert.ok(await shell(`document.querySelector('.hdrpop-item.unread').textContent.includes('New report available')`))
  await shell(`document.querySelector('.hdrpop-item').click()`)
  await until(() => shell(`alertCount === 1`),'native notification handler refreshes unread count')
  assert.ok(await (await guest()).executeJavaScript(`window.notificationOpened === true`),'notification executes site handler')
  await shell(`actions.zoomreset()`)
  const zoomGuest = await guest()
  const sendZoom = async (keyCode,modifiers) => {
    zoomGuest.sendInputEvent({type:'keyDown',keyCode,modifiers})
    zoomGuest.sendInputEvent({type:'keyUp',keyCode,modifiers})
    await delay(100)
  }
  await sendZoom('=', ['control'])
  assert.equal(await shell(`Math.round(Math.pow(1.2,zoom)*100)`),110,'Ctrl+= inside MDC')
  await sendZoom('+',['control','shift'])
  assert.equal(await shell(`Math.round(Math.pow(1.2,zoom)*100)`),120,'Ctrl+Shift++ inside MDC')
  await sendZoom('-',['control'])
  assert.equal(await shell(`Math.round(Math.pow(1.2,zoom)*100)`),110,'Ctrl+- inside MDC')
  assert.ok(Math.abs(zoomGuest.getZoomFactor()-1.1)<.01,'guest zoom actually applied')
  await navigate(`wv.reload()`,'zoom after reload')
  assert.ok(Math.abs((await guest()).getZoomFactor()-1.1)<.01,'zoom retained on reload')
  await navigate(`openPage('https://mdc.gta.world/record/900')`,'zoom on new page')
  assert.ok(Math.abs((await guest()).getZoomFactor()-1.1)<.01,'zoom inherited by new page')
  await shell(`actions.zoomreset()`)
  checks++
  console.log('PASS searchable History, live Alerts, distinct icons and zoom keys across pages')
  checks += await verifyWidgets({ shell, guest, until, delay, win, output })
  checks += await verifySiteSource({shell,guest,until,delay,win,output})
  checks += await verifyModalForms({shell,guest,until,delay,win,output,colors:true})
  checks += await verifyPickerInteractions({shell,guest,until,delay,win,output})
  checks += await verifyStatusPanels({shell,guest,until,delay,win,output})
  checks += await verifyInteractions({shell,guest,until,delay,win,output,webContents})
  checks += await verifyDocumentLayouts({shell,guest,until,delay,win,output})
  checks += await verifyRecordSurfaces({shell,guest,until,delay})
  checks += await verifyPopups({shell,guest,until,delay,win,output})
  checks += await verifyWorkspace({ shell, guest, until, delay, win, output })
  checks += await verifyPenal({shell,until,delay,win,output,webContents})
  checks += await verifyRegressions({shell,guest,until,delay,win,output})
  checks += await verifyMinimized({shell,guest,until,delay,win,output})
  checks += await verifyScrollbars({shell,guest,until,delay,win})
  checks += await verifyPersistentDock({shell,guest,until,delay,win})
  checks += await verifyPerformance({shell,guest,until,delay,output,baseline:false})
  for (const [width, height] of [[900, 600], [1920, 1080]]) {
    await shell(`setTheme('aero')`)
    win.setSize(width, height)
    await delay(200)
    assert.ok(await shell(`document.querySelector('.content').getBoundingClientRect().height > 150`))
    assert.ok(await shell(`document.querySelector('.content').getBoundingClientRect().right <= innerWidth`))
    assert.ok(await shell(`document.getElementById('hdr-ctl').getBoundingClientRect().right <= innerWidth && document.getElementById('p1-status').scrollWidth <= innerWidth`),'status controls fit at ' + width)
    checks++
    console.log('PASS window width ' + width)
  }
  await shell(`setTheme('p1'); view.quickLinks = false; applyView()`)
  assert.equal(await shell(`document.querySelector('.content').getBoundingClientRect().x`), 0)
  await shell(`view.quickLinks = true; applyView(); showTab('penal')`)
  await until(() => shell(`pcv.getURL().includes('/topic/')`), 'penal tab')
  await delay(400)
  assert.ok(await shell(`document.querySelector('.content').getBoundingClientRect().height > 300`))
  await shell(`showTab('mdc'); wv.loadURL('https://ucp.gta.world/login')`)
  await until(async () => (await guest()).getURL().includes('ucp.gta.world') && !(await guest()).isLoading(), 'sign in')
  assert.equal(await (await guest()).executeJavaScript(`document.documentElement.classList.contains('mdt-hide-sidebar') || document.documentElement.classList.contains('mdt-p1') || document.documentElement.classList.contains('mdt-aero')`), false)
  console.log('PASS optional rail, Penal Code and unskinned sign-in')
  checks++
  for (const saved of ['light', 'dark', 'lapd']) {
    await shell(`localStorage.setItem('mdc.theme', '${saved}')`)
    await win.loadFile(path.join(root, 'renderer', 'index.html'))
    await inspect(saved + ' shell migration')
    assert.equal(await shell(`view.theme`), 'p1')
    await (await guest()).executeJavaScript(`localStorage.setItem('mdtViewPrefs', JSON.stringify({theme:'${saved}', sidebar:true, search:false}))`)
    await navigate(`wv.reload()`, saved + ' preload migration')
    assert.equal(await (await guest()).executeJavaScript(`JSON.parse(localStorage.getItem('mdtViewPrefs')).theme`), 'p1')
  }
  assert.deepEqual(errors, [], 'renderer/preload errors')
  checks+=await verifyRelease110({shell,guest,until,delay,win,output})
  checks+=await verifyRelease111({shell,guest,until,delay,win,output})
  checks+=await verifyRelease112({shell,guest,until,delay,win,output})
  assert.deepEqual(errors, [], 'release renderer/preload errors')
  console.log('ELECTRON VERIFICATION PASSED: ' + checks + ' checks; screenshots: ' + output)
}).then(() => { win.destroy(); app.quit() }).catch((err) => {
  console.error(err.stack)
  if (errors.length) console.error(errors)
  if (win) win.destroy()
  app.exit(1)
})
