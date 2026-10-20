'use strict'

const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')

function page(content, script = '') {
  return `<!doctype html><html><head><title>Document layout checks</title>
    <link rel="stylesheet" href="/site-vendor/material-dashboard.css"><link rel="stylesheet" href="/site-vendor/custom.css">
    <link rel="stylesheet" href="/vendor/summernote-bs4.css"><script src="/vendor/jquery.js"></script>
    <script src="/vendor/bootstrap.js"></script><script src="/vendor/summernote-bs4.js"></script>
    <style>.main-panel{float:none;width:100%}.fas{font-family:Arial}#callMap{width:260px;height:280px}.modal-body{max-height:65vh;overflow-y:auto}</style>
    </head><body><div class="main-panel"><main class="content">${content}</main></div>
    <script>${script};window.layoutReady=true</script></body></html>`
}

function authoringFixture(kind) {
  const incident = fs.readFileSync(path.join(__dirname, 'fixtures', 'incident-create.html'), 'utf8')
  const actions = '<section class="card"><div class="card-body compact-actions">'+fs.readFileSync(path.join(__dirname,'fixtures','incident-actions.html'),'utf8')+'</div></section>'
  const form = `<section class="card"><div class="card-header">${kind}</div><div class="card-body"><form>
    <div class="row author-row"><div class="col-md-8"><div class="form-group"><label>Subject</label><input class="form-control" value="Fixture subject"></div>
    <div class="form-group"><label>Classification</label><select class="custom-select"><option>General</option></select></div></div>
    <div class="col-md-4"><label>Details</label><input class="form-control"></div></div><hr style="width:110%;margin-inline:-15px;height:8px;background:gray">
    <h3>Narrative</h3><textarea class="summernote" id="narrative"></textarea></form></div></section>`
  const arrest = `<div class="modal" id="arrest-editor"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">Add Arrest Report and Charges</h4><button class="close" data-dismiss="modal">x</button></div><div class="modal-body">
    <div class="row native-charge-row"><div class="col-8"><select><option>Charge</option></select></div><div class="col-3"><select><option>Class</option></select></div>
    <button class="btn btn-danger position-absolute native-remove" style="right:5px;top:2px">Remove</button></div></div></div></div></div>`
  return page((kind === 'incident' ? incident : form) + actions + arrest, `$('#narrative').summernote({height:250})`)
}

function documentFixture() {
  const rows = [['ARRESTEE NAME (FIRST, MIDDLE, LAST)', 'SEX (M/F/O)', 'HAIR', 'EYES'], ['RESIDENCE', 'AGE', 'HEIGHT', 'DESCENT'], ['DATE', 'TIME', 'LOCATION', 'OFFICER']]
  const report = `<table class="table" style="width:90%;font-family:'Times New Roman';background:white" border="1"><tbody>
    <tr><th colspan="4">LOS SANTOS POLICE DEPARTMENT<br>ARREST REPORT</th></tr>
    ${rows.map((labels, index) => '<tr>' + labels.map(label => '<th>' + label + '</th>').join('') + '</tr><tr>' + Array.from({length:4}, (_, i) => '<td>' + (index === 1 && i === 1 ? '38' : 'Fixture value') + '</td>').join('') + '</tr>').join('')}
    ${['SOURCE OF ACTIVITY', 'INVESTIGATION'].map(label => '<tr><th colspan="4">' + label + '</th></tr><tr><td colspan="4"><p>' + ('Long report narrative with clear spacing and preserved field structure. '.repeat(35)) + '</p><p>Second paragraph.</p></td></tr>').join('')}
    </tbody></table>`
  const cards = ['Registered Vehicles', 'Phones', 'Licenses', 'Related Incidents', 'Garages', 'Businesses', 'Residences'].map(title => `<section class="card divider-card"><div class="card-header">${title}</div><div class="card-body"><div class="row"><div class="col-12">First row</div><hr class="col-12" style="width:110%;margin:0 -15px;height:8px;background:gray"><div class="col-12">Second row</div></div></div></section>`).join('')
  return page(cards + `<div class="modal" id="paper-view"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">View Record - #100 - Fixture Subject</h4><button class="close" data-dismiss="modal">x</button></div><div class="modal-body"><p>Remark</p><h5>Report</h5><div id="report-document">${report}</div></div></div></div></div>`, `window.paperTemplate=document.getElementById('report-document').innerHTML`)
}

async function verifyDocumentLayouts({shell, guest, until, delay, win, output}) {
  let checks = 0
  const load = async (url) => {
    await shell(`showTab('mdc');dialogRoots.slice().forEach(closeDialog);wv.loadURL(${JSON.stringify(url)})`)
    await until(async () => !(await guest()).isLoading() && await (await guest()).executeJavaScript('window.layoutReady===true'), 'layout fixture ready')
    await delay(180)
  }
  const read = async (code) => (await guest()).executeJavaScript(code, true)
  const themes = ['p1', 'aero', 'aerolapd', 'aerodark']
  for (const theme of [...themes, 'off']) {
    await shell(`setTheme('${theme}')`)
    for (const width of [1440, 720, 320]) {
      win.setSize(width, 980)
      await until(()=>shell('innerWidth').then(value=>value===width), 'native window resize to '+width)
      await delay(120)
      const tabs = await shell(`(()=>{const n=document.getElementById('tabs'),buttons=Array.from(n.querySelectorAll('.tab')),bar=document.getElementById('tab-nav');return {width:n.clientWidth,scroll:n.scrollWidth,buttons:buttons.map(b=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b);return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height,font:parseFloat(s.fontSize),padding:parseFloat(s.paddingLeft)}}),bar:bar.getBoundingClientRect().top}})()`)
      assert.ok(tabs.scroll <= tabs.width + 1, theme + ': wrapped strip fits at ' + width)
      assert.ok(tabs.buttons.every(b => b.height >= 27.5 && b.font >= 10.99 && b.padding >= 15.5 && b.left >= -.5 && b.right <= width + 1), theme + ': larger aligned tab targets ' + JSON.stringify(tabs))
      if (theme !== 'off') assert.ok(tabs.bar >= Math.max(...tabs.buttons.map(b => b.bottom)) - .5, theme + ': icon bar follows all wrapped tab rows')
      if (width === 320) fs.writeFileSync(path.join(output, theme + '-wrapped-tabs.png'), (await win.webContents.capturePage()).toPNG())
    }
    checks++
  }
  win.setSize(1440, 980)
  for (const kind of ['incident', 'apb', 'warrant', 'report', 'arrest', 'custom']) {
    for (const mode of ['create', 'edit']) {
      await shell(`setTheme('off')`)
      await load('https://mdc.gta.world/' + kind + '/' + mode + '/layout-fixture')
      const structureCode = `Array.from(document.querySelectorAll('.content *')).filter(n=>!n.closest('.note-editor, .mdt-grip')).map(n=>({tag:n.tagName,id:n.id,parent:n.parentElement.tagName+'#'+n.parentElement.id,name:n.getAttribute('name')}))`
      const structure = await read(structureCode)
      const native = await read(`(()=>{const row=document.querySelector('#arrest-editor .native-charge-row'),button=document.querySelector('#arrest-editor .native-remove');return {row:getComputedStyle(row).display,align:getComputedStyle(row).alignItems,position:getComputedStyle(button).position,right:getComputedStyle(button).right,order:getComputedStyle(button).order}})()`)
      for (const theme of themes) {
        await shell(`setTheme('${theme}')`)
        await delay(200)
        assert.equal(await read(`document.querySelectorAll('[data-mdt-frow],[data-mdt-fcell]').length`), 0, theme + ': authoring form is never a filter strip')
        const geometry = await read(`(()=>{const row=document.querySelector('#arrest-editor .native-charge-row'),button=document.querySelector('#arrest-editor .native-remove');return {row:getComputedStyle(row).display,align:getComputedStyle(row).alignItems,position:getComputedStyle(button).position,right:getComputedStyle(button).right,order:getComputedStyle(button).order}})()`)
        assert.deepEqual(geometry, native, theme + ': rule 25 preserves arrest grid and absolute remove placement')
        const buttons = await read(`Array.from(document.querySelectorAll('.compact-actions .btn,#statusButton,#classificationButton')).map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {label:n.textContent.trim(),height:r.height,padding:parseFloat(s.paddingLeft),width:r.width}})`)
        assert.ok(buttons.length>=5&&buttons.every(b=>b.height>=20&&b.height<=27&&b.padding<=8.1&&b.width<190),theme+': compact authoring controls '+JSON.stringify(buttons))
        if (kind !== 'incident') assert.ok(await read(`Array.from(document.querySelectorAll('.content hr')).every(n=>{const r=n.getBoundingClientRect(),c=n.closest('.card').getBoundingClientRect(),s=getComputedStyle(n);return r.left>=c.left&&r.right<=c.right&&r.height<=1.01&&parseFloat(s.marginLeft)>=0&&parseFloat(s.marginRight)>=0})`), theme + ': authoring page dividers stay thin and contained '+JSON.stringify(await read(`Array.from(document.querySelectorAll('.content hr')).map(n=>({rect:n.getBoundingClientRect().toJSON(),card:n.closest('.card').getBoundingClientRect().toJSON(),margin:getComputedStyle(n).margin,height:getComputedStyle(n).height}))`)))
        if (kind === 'incident') {
          const layout = await read(`(()=>{const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}};const form=document.getElementById('mainData'),labels=Array.from(form.querySelectorAll(':scope > strong')).slice(0,5),fields=['type','flags','statusButton','DateEntry','classificationButton'].map(id=>document.getElementById(id));return {labels:labels.map(rect),fields:fields.map(rect),info:rect(form.querySelector(':scope > .badge-info')),heading:rect(document.querySelector('h3.card-text')),editor:rect(document.querySelector('.note-editor')),map:rect(document.getElementById('map-card')),footer:rect(document.getElementById('map-card-footer'))}})()`)
          assert.equal(layout.labels.length, 5, 'source labels retained')
          assert.ok(layout.fields.every((field, i) => layout.labels[i].bottom <= field.top + 1), theme + ': each label stays above its field ' + JSON.stringify(layout))
          assert.ok(layout.fields.every((field, i) => !i || field.top > layout.fields[i - 1].bottom), theme + ': fields retain vertical order')
          assert.ok(layout.info.top >= layout.fields[4].bottom && layout.heading.top >= layout.info.bottom && layout.editor.top >= layout.heading.bottom, theme + ': narrative follows classification info')
          assert.ok(layout.map.left >= layout.editor.right - 1 && layout.footer.top > layout.map.top, theme + ': native map stays in its right column')
          if (mode === 'create') fs.writeFileSync(path.join(output, theme + '-incident-create.png'), (await win.webContents.capturePage()).toPNG())
        }
      }
      await shell(`setTheme('off')`)
      await delay(150)
      assert.deepEqual(await read(structureCode), structure, kind + ': original form structure restored')
      checks++
    }
  }
  await shell(`setTheme('p1')`)
  await load('https://mdc.gta.world/custom/create/layout-fixture')
  assert.ok(await read(`document.documentElement.classList.contains('mdt-form-page')&&!document.querySelector('[data-mdt-frow]')`), 'new authoring routes are identified from editor content on initial load')
  await load('https://mdc.gta.world/document-layout')
  for (const theme of themes) {
    await shell(`setTheme('${theme}')`)
    await delay(200)
    const dividers = await read(`Array.from(document.querySelectorAll('.divider-card hr')).map(n=>{const r=n.getBoundingClientRect(),c=n.closest('.card').getBoundingClientRect(),s=getComputedStyle(n);return {left:r.left,right:r.right,boxLeft:c.left,boxRight:c.right,height:r.height,border:parseFloat(s.borderTopWidth),marginLeft:parseFloat(s.marginLeft),marginRight:parseFloat(s.marginRight),padding:parseFloat(s.paddingTop),background:s.backgroundColor}})`)
    assert.ok(dividers.every(d=>d.left>=d.boxLeft&&d.right<=d.boxRight&&d.height<=1.01&&d.border>0&&d.border<=1.01&&d.marginLeft>=0&&d.marginRight>=0&&d.padding===0), theme + ': every card divider is thin and contained ' + JSON.stringify(dividers))
    await read(`document.getElementById('report-document').innerHTML=paperTemplate;$('#paper-view').modal('show')`)
    await until(()=>read(`!!document.querySelector('[data-mdt-paper]')`), 'paper report marked')
    await delay(180)
    const paper = await read(`(()=>{const n=document.querySelector('[data-mdt-paper]'),s=getComputedStyle(n),r=n.getBoundingClientRect(),p=n.parentElement.getBoundingClientRect();return {font:s.fontFamily,width:r.width,parentWidth:p.width,cells:Array.from(n.querySelectorAll('th,td')).map(c=>{const x=getComputedStyle(c);return {ink:x.color,background:x.backgroundColor,image:x.backgroundImage,font:x.fontFamily,size:parseFloat(x.fontSize),border:x.borderTopWidth}}),age:n.querySelectorAll('[data-mdt-deframed]').length,title:getComputedStyle(n.querySelector('[data-mdt-paper-title]')).textAlign,chrome:getComputedStyle(document.querySelector('#paper-view .modal-header')).backgroundImage}})()`)
    const paperFits = await read(`(()=>{const n=document.querySelector('[data-mdt-paper]'),p=n.parentElement,s=getComputedStyle(p),width=p.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight);return Math.abs(n.getBoundingClientRect().width-width)<2})()`)
    assert.ok(paper.font.includes('Times New Roman')&&paperFits, theme + ': paper fills available content width with serif text ' + JSON.stringify(paper))
    assert.ok(paper.cells.every(c=>c.ink==='rgb(0, 0, 0)'&&c.background==='rgb(255, 255, 255)'&&c.image==='none'&&c.font.includes('Times New Roman')&&parseFloat(c.border)>0&&parseFloat(c.border)<=1.01), theme + ': no skin table/header rules enter the document ' + JSON.stringify(paper))
    assert.equal(paper.age, 0, 'AGE is not a profile-banner cell')
    assert.equal(paper.title, 'center', 'paper title centered')
    assert.notEqual(paper.chrome, 'none', 'popup chrome retains the skin')
    fs.writeFileSync(path.join(output, theme + '-paper-report.png'), (await win.webContents.capturePage()).toPNG())
    await read(`document.getElementById('report-document').innerHTML='<article class="document"><h2>Citation</h2><p>Custom printable form.</p><table><tr><th>OFFICER</th><th>DATE</th></tr><tr><td>Fixture officer</td><td>18/OCT/2026</td></tr></table></article>'`)
    await until(()=>read(`!!document.querySelector('article').closest('[data-mdt-paper]')`), 'custom document protected')
    assert.equal(await read(`document.querySelectorAll('[data-mdt-paper]').length`), 1, 'one protected root covers nested custom-form tables')
    await read(`$('#paper-view').modal('hide')`)
    await delay(180)
    checks++
  }
  await read(`document.getElementById('report-document').innerHTML=paperTemplate;$('#paper-view').modal('show')`)
  await delay(200)
  const g = await guest()
  g.debugger.attach('1.3')
  await g.debugger.sendCommand('Runtime.evaluate', {expression:`window.dispatchEvent(new Event('beforeprint'))`})
  await g.debugger.sendCommand('Emulation.setEmulatedMedia', {media:'print'})
  const print = await read(`({header:getComputedStyle(document.querySelector('#paper-view .modal-header')).display,bodyHeight:getComputedStyle(document.querySelector('#paper-view .modal-body')).maxHeight,overflow:getComputedStyle(document.querySelector('#paper-view .modal-body')).overflowY,background:getComputedStyle(document.body).backgroundColor,cards:getComputedStyle(document.querySelector('.divider-card')).display})`)
  assert.deepEqual(print, {header:'none',bodyHeight:'none',overflow:'visible',background:'rgb(255, 255, 255)',cards:'none'}, 'printing removes background cards, popup chrome and native screen clipping only in print media')
  await g.debugger.sendCommand('Emulation.setEmulatedMedia', {media:''})
  g.debugger.detach()
  await read(`window.printStates=[];window.addEventListener('beforeprint',()=>printStates.push({marked:!!document.querySelector('[data-mdt-paper-print]'),cards:getComputedStyle(document.querySelector('.divider-card')).display}));void 0`)
  const pdf = await g.printToPDF({printBackground:true, preferCSSPageSize:true})
  fs.writeFileSync(path.join(output, 'paper-report-print.pdf'), pdf)
  const printStates = await read('printStates')
  assert.ok(printStates.length>0&&printStates.every(s=>s.marked), 'actual PDF printing prepares the document before print media is activated '+JSON.stringify(printStates))
  assert.equal(pdf.subarray(0,4).toString(), '%PDF', 'printable report exports to PDF')
  fs.writeFileSync(path.join(output, 'paper-report-print.pdf'), pdf)
  await read(`window.dispatchEvent(new Event('afterprint'));$('#paper-view').modal('hide')`)
  await shell(`setTheme('off')`)
  await delay(150)
  assert.equal(await read(`document.querySelectorAll('[data-mdt-paper],[data-mdt-paper-title],[data-mdt-paper-print]').length`), 0, 'Original MDC removes paper markers')
  checks++
  console.log('PASS larger wrapped tabs, native create/edit forms, rule 25, contained dividers and printable record documents across skins')
  return checks
}

module.exports = {authoringFixture, documentFixture, verifyDocumentLayouts}
