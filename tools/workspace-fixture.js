'use strict'

const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')

function workspaceFixture(base) {
  const dialog = (id, title) => `<div class="modal" id="${id}" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">${title}</h4><button class="close" data-dismiss="modal" aria-label="Close"><span>&times;</span></button></div><div class="modal-body"><label>Notes<input class="form-control" id="${id}-field"></label></div><div class="modal-footer"><button class="btn btn-primary" data-dismiss="modal">Done</button></div></div></div></div>`
  return base.replace('</head>', `<link rel="stylesheet" href="/vendor/bootstrap.css"><script src="/vendor/jquery.js"></script><script src="/vendor/bootstrap.js"></script><style>.modal-dialog{width:380px;max-width:380px}.workspace-controls{position:absolute;top:150px;left:12px;width:140px}.workspace-controls input{width:130px}</style></head>`).replace('</body>', `<div class="workspace-controls"><button id="open-two" class="btn btn-primary" data-toggle="modal" data-target="#floatTwo">Open second</button><label>Background<input id="background-field"></label></div>${dialog('floatOne','First record')}${dialog('floatTwo','Second record')}<div data-notify="container" id="test-notice" class="alert alert-success" style="position:absolute;top:20px;right:20px;width:340px"><span data-notify="icon" class="fas fa-check">✓</span><span data-notify="title">Success</span><span data-notify="message">Mugshot reset. The original MDC notification stays in its assigned position.</span><button data-notify="dismiss" class="close" onclick="this.parentElement.remove()">×</button></div><script>$('#floatOne,#floatTwo').modal({show:false});</script></body>`)
}

function forumFixture() {
  return `<html><head><style>[data-focus-post-header] .cPost::before{content:"";display:block;height:40px;background:#333;position:absolute;left:0;right:0;top:0}body{margin:0}.original-bar{height:40px;background:#333}.seal{height:40px;overflow:hidden;margin-top:-30px}.seal img{max-height:200px;transform:translateY(-20px)}h2{color:black}</style></head><body data-focus-post-header><div id="elPostFeed"><article class="cPost"><div class="ipsType_richText"><h2>San Andreas Penal Code</h2><blockquote><p><b>101. Tax Evasion</b></p><p>Any person who willfully attempts to evade or defeat any tax imposed.</p></blockquote><div class="original-bar"></div><div class="seal"><p><img src="/seal.svg" alt="Great Seal of San Andreas"></p><p>TITLE I - CRIMES AGAINST PUBLIC PEACE</p></div><h2>Crimes against public peace</h2><blockquote><p><b>104. Domestic Threats</b></p><p>Any person who threatens to commit a crime that results in injury.</p></blockquote><table><tr><th>Offence</th><th>Class</th></tr><tr><td>Tax evasion</td><td>Felony</td></tr></table></div></article></div></body></html>`
}

async function verifyWorkspace({shell, guest, until, delay, win, output}) {
  await shell(`setTheme('p1'); closeDialog(); wv.loadURL('https://mdc.gta.world/workspace')`)
  await until(async () => !(await guest()).isLoading() && await (await guest()).executeJavaScript(`!!window.jQuery && !!jQuery.fn.modal`),'Bootstrap workspace loaded')
  const g = await guest()
  const read = (code) => g.executeJavaScript(code,true)
  const click = async (selector) => {
    const r = await read(`(() => {const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
    g.sendInputEvent({type:'mouseDown',...r,button:'left',clickCount:1})
    g.sendInputEvent({type:'mouseUp',...r,button:'left',clickCount:1})
    await delay(100)
  }
  const drag = async (selector,dx,dy) => {
    const r = await read(`(() => {const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:Math.round(r.x+70),y:Math.round(r.y+r.height/2)}})()`)
    g.sendInputEvent({type:'mouseDown',...r,button:'left',clickCount:1})
    for (let i=1;i<=5;i++) {g.sendInputEvent({type:'mouseMove',x:r.x+Math.round(dx*i/5),y:r.y+Math.round(dy*i/5),movementX:dx/5,movementY:dy/5});await delay(20)}
    g.sendInputEvent({type:'mouseUp',x:r.x+dx,y:r.y+dy,button:'left',clickCount:1})
    await delay(100)
  }
  for (const theme of ['p1','aero','aerolapd','aerodark']) {
    await shell(`setTheme('${theme}')`)
    await delay(150)
    await read(`$('#floatOne').modal('show')`)
    await delay(100)
    assert.equal(await read(`getComputedStyle(document.getElementById('test-notice')).position`),'absolute',theme+': toast library owns positioning')
    assert.equal(await read(`getComputedStyle(document.getElementById('test-notice')).right`),'20px',theme+': toast anchor unchanged')
    assert.ok(await read(`(() => {const b=document.querySelector('#floatOne .close'),s=getComputedStyle(b,'::before');return s.content==='""'&&parseFloat(s.width)===10&&parseFloat(s.height)===2})()`),theme+': centered geometric close symbol')
    await read(`document.getElementById('test-notice').style.display='none'`)
    assert.equal(await read(`getComputedStyle(document.getElementById('test-notice')).display`),'none',theme+': notification library can hide its container')
    await read(`document.getElementById('test-notice').style.removeProperty('display')`)
    const toast = await read(`(() => {const title=document.querySelector('[data-notify=title]').getBoundingClientRect(),message=document.querySelector('[data-notify=message]').getBoundingClientRect(),icon=getComputedStyle(document.querySelector('[data-notify=icon]'));return {stacked:message.top>=title.bottom,titleWidth:title.width,iconPosition:icon.position,iconWidth:icon.width}})()`)
    assert.ok(toast.stacked && toast.titleWidth>150,theme+': toast title and message form readable rows '+JSON.stringify(toast))
    assert.equal(toast.iconPosition,'absolute',theme+': toast icon beside text')
    assert.equal(toast.iconWidth,'23px',theme+': toast icon badge')
    await drag('#floatOne .modal-header',180,160)
    assert.ok(await read(`document.documentElement.classList.contains('mdt-workspace')`),theme+': dragging enables background access')
    await click('#background-field')
    assert.equal(await read(`document.activeElement.id`),'background-field',theme+': real background focus escapes Bootstrap trap')
    await click('#open-two')
    assert.equal(await read(`document.querySelectorAll('#floatOne.show,#floatTwo.show').length`),2,theme+': two Bootstrap dialogs stay open')
    await drag('#floatTwo .modal-header',-160,10)
    await click('#floatOne-field')
    await read(`document.getElementById('floatOne-field').value='first unsaved record'`)
    assert.equal(await read(`document.activeElement.id`),'floatOne-field',theme+': earlier window can be focused')
    assert.ok(await read(`Number(getComputedStyle(document.getElementById('floatOne')).zIndex)>Number(getComputedStyle(document.getElementById('floatTwo')).zIndex)`),theme+': focused dialog comes forward')
    await click('#floatTwo-field')
    await read(`document.getElementById('floatTwo-field').value='second unsaved record'`)
    assert.equal(await read(`document.getElementById('floatOne-field').value`),'first unsaved record',theme+': separate form values retained')
    fs.writeFileSync(path.join(output,theme+'-workspace.png'),(await win.webContents.capturePage()).toPNG())
    await click('#floatOne .close')
    assert.equal(await read(`document.getElementById('floatTwo').classList.contains('show')`),true,theme+': closing one retains the other')
    await shell(`setTheme('off')`)
    await delay(150)
    assert.equal(await read(`document.documentElement.classList.contains('mdt-workspace')`),false,'Original MDC disables custom workspace')
    assert.equal(await read(`$('#floatTwo').data('bs.modal')._config.focus`),true,'Original MDC restores Bootstrap focus configuration')
    await read(`$('#floatTwo').modal('hide')`)
    console.log('PASS '+theme+' pointer dragging, real Bootstrap focus, independent windows and native restoration')
  }
  await shell(`setTheme('p1'); showHistory()`)
  const shellTitle = await shell(`(() => {const r=document.querySelector('#modal-backdrop .dialog-title').getBoundingClientRect();return {x:Math.round(r.x+60),y:Math.round(r.y+r.height/2)}})()`)
  win.webContents.sendInputEvent({type:'mouseDown',...shellTitle,button:'left',clickCount:1})
  win.webContents.sendInputEvent({type:'mouseMove',x:shellTitle.x-150,y:shellTitle.y+50,movementX:-150,movementY:50})
  win.webContents.sendInputEvent({type:'mouseUp',x:shellTitle.x-150,y:shellTitle.y+50,button:'left',clickCount:1})
  await delay(100)
  assert.equal(await shell(`getComputedStyle(document.getElementById('modal-backdrop')).backgroundColor`),'rgba(0, 0, 0, 0)','shell windows do not dim the client below native caption controls')
  assert.equal(await shell(`getComputedStyle(document.getElementById('modal-backdrop')).pointerEvents`),'none','shell window does not block page or navigation')
  assert.ok(await shell(`document.querySelector('#modal-backdrop .dialog').classList.contains('dragged')`),'shell pointer drag')
  fs.writeFileSync(path.join(output,'history-window.png'),(await win.webContents.capturePage()).toPNG())
  await shell(`el('hist-q').value='Lucy'; el('hist-q').dispatchEvent(new Event('input',{bubbles:true})); showOptions()`)
  assert.equal(await shell(`document.querySelectorAll('.modal-backdrop:not(.hidden)').length`),2,'History and Options stay open independently')
  assert.equal(await shell(`new Set(Array.from(document.querySelectorAll('[id]')).map((n)=>n.id)).size === document.querySelectorAll('[id]').length`),true,'floating tool windows have unique element ids')
  assert.equal(await shell(`dialogRoots.find((r)=>r.dataset.dialogTitle==='History').querySelector('[data-dialog-id="hist-q"]').value`),'Lucy','History search survives opening Options')
  await shell(`dialogRoots.find((r)=>r.dataset.dialogTitle==='History').querySelector('.dialog-close').click()`)
  assert.equal(await shell(`document.querySelectorAll('.modal-backdrop:not(.hidden)').length`),1,'closing History keeps Options open')
  assert.ok(await shell(`dialogTitle.textContent==='Options'`),'remaining tool window becomes active')
  await shell(`closeDialog()`)
  return 5
}

async function verifyPenal({shell,until,delay,win,output,webContents}) {
  await shell(`showTab('penal')`)
  const g = webContents.fromId(await shell(`pcv.getWebContentsId()`))
  const read = (code) => g.executeJavaScript(code,true)
  await until(() => read(`!!document.querySelector('.seal img') && document.querySelector('.seal img').complete`),'forum seal loaded')
  for (const theme of ['p1','aero','aerolapd','aerodark']) {
    await shell(`setTheme('${theme}')`)
    await delay(150)
    assert.equal(await read(`getComputedStyle(document.querySelector('.cPost'),'::before').display`),'none',theme+': forum decorative header pseudo-element removed')
    const geometry = await read(`(() => {const image=document.querySelector('.seal img').getBoundingClientRect(),block=document.querySelector('.seal').getBoundingClientRect(),bar=document.querySelector('.original-bar').getBoundingClientRect();return {height:image.height,inside:image.top>=block.top&&image.bottom<=block.bottom,separate:image.top>=bar.bottom,barHeight:bar.height}})()`)
    assert.ok(geometry.height<=160&&geometry.height>100,theme+': seal capped')
    assert.ok(geometry.inside&&geometry.separate,theme+': seal and divider do not overlap '+JSON.stringify(geometry))
    assert.ok(geometry.barHeight<=2,theme+': empty decorative bar becomes a divider')
    if (theme==='p1') assert.equal(await read(`getComputedStyle(document.querySelector('h2')).color`),'rgb(255, 255, 255)','default Penal Code heading is legible on black')
    await shell(`pcSearch.value='tax'; penalFilter()`)
    await delay(80)
    assert.ok(await read(`Array.from(document.querySelectorAll('[data-mdt-penal-hit]')).some((n)=>/tax/i.test(n.textContent))`),theme+': Penal Code filtering')
    await shell(`pcSearch.value=''; penalFilter()`)
    await until(() => read(`document.querySelector('.seal').getBoundingClientRect().height>100`),'cleared Penal Code filter')
    fs.writeFileSync(path.join(output,theme+'-penal.png'),(await win.webContents.capturePage()).toPNG())
    console.log('PASS '+theme+' Penal Code seal, headings, divider and search')
  }
  await shell(`setTheme('off')`)
  await delay(100)
  assert.equal(await read(`document.querySelectorAll('[data-mdt-penal-art],[data-mdt-penal-divider]').length`),0,'Original forum layout restored')
  for (const key of ['depa','shaft']) {
    await shell(`document.getElementById('tab-${key}').click()`)
    await until(() => shell(`laws.${key}.el.getURL()===laws.${key}.url`),key+': supplied forum topic loads')
    const lawGuest=webContents.fromId(await shell(`laws.${key}.el.getWebContentsId()`))
    const lawRead=(code)=>lawGuest.executeJavaScript(code,true)
    await until(()=>lawRead(`!!document.querySelector('.seal img')&&document.querySelector('.seal img').complete`),key+': topic ready')
    for (const theme of ['p1','aero','aerolapd','aerodark']) {
      await shell(`setTheme('${theme}')`)
      await delay(150)
      assert.equal(await lawRead(`getComputedStyle(document.querySelector('.cPost'),'::before').display`),'none',key+': '+theme+' shares Penal Code skin')
      await shell(`pcSearch.value='tax';pcSearch.dispatchEvent(new Event('input'))`)
      await until(()=>lawRead(`document.querySelectorAll('[data-mdt-penal-hit]').length>0`),key+': '+theme+' law filtering')
      assert.equal(await shell(`activeView()===laws.${key}.el`),true,key+': toolbar targets this law')
      assert.ok(await shell(`document.getElementById('tab-${key}').classList.contains('active')&&!document.getElementById('tab-mdc').classList.contains('active')`),key+': selected tab')
      await shell(`pcSearch.value='';penalFilter()`)
      fs.writeFileSync(path.join(output,theme+'-'+key+'.png'),(await win.webContents.capturePage()).toPNG())
    }
    await shell(`pcSearch.value='tax';penalFilter();showTab('penal');pcSearch.value='threats';penalFilter();showTab('${key}')`)
    assert.equal(await shell(`pcSearch.value`),'tax',key+': independent query restored when returning')
    await shell(`pcSearch.value='';penalFilter()`)
    console.log('PASS '+key+' topic URL, all skins, search and independent tab state')
  }
  await shell(`setTheme('p1'); showTab('mdc')`)
  return 6
}

module.exports = {workspaceFixture,forumFixture,verifyWorkspace,verifyPenal}
