"use strict"

const assert=require('assert/strict')

async function verifyMinimized({shell,guest,until,delay,win,output}) {
  let checks=0
  for(const theme of ['p1','aero']) {
    await shell(`setTheme('${theme}');wv.loadURL('https://mdc.gta.world/regressions')`)
    await until(async()=>!(await guest()).isLoading()&&await (await guest()).executeJavaScript(`typeof openSharedReport==='function'`),'minimize fixture')
    const g=await guest(),read=code=>g.executeJavaScript(code,true)
    const host=code=>shell(code)
    const open=async(id)=>{await read(`openSharedReport('${id}','Report ${id}')`);await until(()=>read(`document.querySelector('#sharedViewer.show .mdt-minimize')&&!$('#sharedViewer').data('bs.modal')._isTransitioning`),'record '+id).catch(async e=>{console.log(await read(`({html:document.querySelector('#sharedViewer').outerHTML,shown:$('#sharedViewer').data('bs.modal')._isShown,transition:$('#sharedViewer').data('bs.modal')._isTransitioning})`));throw e});await delay(220)}
    const minimize=async()=>{await read(`document.querySelector('#sharedViewer .mdt-minimize').click()`);await delay(300)}
    const restore=async(id)=>{await host(`Array.from(document.querySelectorAll('.record-restore')).find(n=>n.title.includes('${id}')).click()`);await delay(300)}
    const count=async(n)=>until(()=>host(`document.querySelectorAll('.record-tab').length===${n}`),'dock count '+n)
    await open('406471')
    const controls=await read(`Array.from(document.querySelector('#sharedViewer .modal-header').querySelectorAll('.mdt-minimize,.mdt-maximize,.close')).map(n=>{let r=n.getBoundingClientRect();return [r.width,r.height,r.top+r.height/2]})`)
    assert.equal(controls.length,3)
    controls.forEach(r=>assert.deepEqual(r,controls[0],theme+': matched title controls'))
    const layout=await host(`({height:document.querySelector('.content').clientHeight,top:document.querySelector('.content').getBoundingClientRect().top})`)
    await read(`(()=>{const n=document.querySelector('#sharedViewer'),b=n.querySelector('.modal-body');b.insertAdjacentHTML('beforeend','<p>'+('Long record<br>'.repeat(150))+'</p>');const d=n.querySelector('.modal-dialog'),c=n.querySelector('.modal-content');d.setAttribute('data-mdt-sized','1');d.style.width='420px';c.style.height='320px';b.style.overflowY='auto';})()`)
    await delay(250)
    await read(`document.querySelector('#sharedViewer .modal-body').scrollTop=120`)
    const saved=await read(`(()=>{const n=document.querySelector('#sharedViewer'),d=n.querySelector('.modal-header').getBoundingClientRect(),c=n.querySelector('.modal-content').getBoundingClientRect();return {x:d.x,y:d.y,width:c.width,height:c.height,scroll:n.querySelector('.modal-body').scrollTop}})()`)
    assert.ok(saved.scroll>0,theme+': native report scroll exercised')
    await minimize();await count(1)
    const dock=await host(`(()=>{let c=document.querySelector('.content').getBoundingClientRect(),d=document.querySelector('#record-dock').getBoundingClientRect(),v=wv.getBoundingClientRect();return {bottom:c.bottom,top:d.top,height:c.height,view:v.height,dock:d.height}})()`)
    assert.ok(Math.abs(dock.top-dock.bottom)<1&&Math.abs(dock.height-dock.view)<1&&dock.dock>=26,theme+': dock reserves space outside webview')
    assert.ok(layout.height>dock.height,theme+': viewport shrinks for dock')
    await read(`document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`)
    await count(1)
    await open('406472');await read(`document.querySelector('#sharedViewer .mdt-maximize').click()`);await minimize();await count(2)
    await open('406473');await minimize();await count(3)
    assert.equal(await read(`document.querySelectorAll('.modal.show[data-mdt-minimized]').length`),3,theme+': independent minimized records')
    await restore('406472');await count(2)
    assert.ok(await read(`Array.from(document.querySelectorAll('.modal.show:not([data-mdt-minimized])')).some(n=>n.querySelector('.modal-title').textContent.includes('#406472')&&n.querySelector('[data-mdt-maximized]'))`),theme+': maximize state survives viewer reuse and minimize')
    await read(`Array.from(document.querySelectorAll('.modal.show:not([data-mdt-minimized])')).find(n=>n.querySelector('.modal-title').textContent.includes('#406472')).querySelector('.mdt-maximize').click()`)
    await restore('406471');await count(1)
    const back=await read(`(()=>{const n=Array.from(document.querySelectorAll('.modal.show')).find(n=>n.querySelector('.modal-title').textContent.includes('#406471')),d=n.querySelector('.modal-header').getBoundingClientRect(),c=n.querySelector('.modal-content').getBoundingClientRect();return {x:d.x,y:d.y,width:c.width,height:c.height,scroll:n.querySelector('.modal-body').scrollTop,text:n.querySelector('.modal-body').textContent,top:Number(n.style.zIndex)}})()`)
    for(const k of ['x','y','width','height','scroll']) assert.ok(Math.abs(back[k]-saved[k])<2,theme+': restores '+k+' '+JSON.stringify({saved,back}))
    assert.ok(back.text.includes('Report 406471 original narrative'),theme+': preserved record content')
    assert.ok(await read(`Number(Array.from(document.querySelectorAll('.modal.show')).find(n=>n.querySelector('.modal-title').textContent.includes('#406471')).style.zIndex)>Number(Array.from(document.querySelectorAll('.modal.show:not([data-mdt-minimized])')).find(n=>n.querySelector('.modal-title').textContent.includes('#406472')).style.zIndex)`),theme+': restored record comes to front')
    await host(`document.querySelector('.record-close').click()`);await count(0)
    assert.ok(await host(`document.querySelector('#record-dock').classList.contains('hidden')`),theme+': empty dock hidden')
    await until(()=>read(`!$('#sharedViewer').data('bs.modal')._isShown&&!$('#sharedViewer').data('bs.modal')._isTransitioning`),'minimized close finishes native lifecycle');await delay(300)
    await open('406473')
    assert.equal(await read(`getComputedStyle(document.querySelector('#sharedViewer')).visibility`),'visible',theme+': closed minimized viewer reopens')
    await minimize();await count(1)
    await read(`location.hash='preserved'`);await delay(150);await count(1)
    await host(`wv.loadURL('https://mdc.gta.world/regressions')`);await count(1);await host(`document.querySelector('.record-close').click()`);await count(0)
    console.log('PASS '+theme+' matched minimize controls, three records, reserved dock, scroll/geometry, stacking, Escape and shell-owned navigation persistence')
    checks+=9
  }
  return checks
}

module.exports={verifyMinimized}
