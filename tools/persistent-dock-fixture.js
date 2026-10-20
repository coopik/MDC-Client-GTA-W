"use strict"
const assert=require('assert/strict')
const {popupFixture}=require('./popup-fixture')
function persistentDockFixture(pathname) {
  const title=pathname.includes('warrants')?'Warrants':pathname.includes('lookup')?'Person Lookup':'Dashboard'
  let html=popupFixture().replace('<main class="content">',`<main class="content"><h2>${title}</h2><nav><a href="/dock-dashboard">Dashboard</a> | <a href="/dock-warrants">Warrants</a> | <a href="/dock-person-lookup">Person Lookup</a></nav><p><span name="viewRecord" id="406471" role="button">Open Lucy Summers #406471</span> | <span name="viewRecord" id="406472" role="button">Open Harrison Leung #406472</span></p>`)
  if(pathname.includes('unavailable')) return html.replace('window.popupReady=true','window.popupReady=true')
  return html.replace('</body>',`<script>
    window.recordRequests=[];
    $(document).on('click','span[name=viewRecord]',function(){const id=this.id;window.recordRequests.push(id);$.ajax({url:'/dock-record',type:'POST',data:{id,type:'getRecord'},success:data=>{
      $('#viewRecordID').text(data.id);$('#viewRecordSuspectName').text(data.name);$('#viewRecordType').text('Arrest Report').css('color','#9b59b6');$('#viewRecordReport').html(paperTemplate+'<p>'+('Record '+data.id+' narrative<br>').repeat(80)+'</p>');$('#modalViewRecord').modal('show');
    }});});window.dockReady=true;
  </script></body>`)
}
async function verifyPersistentDock({shell,guest,until,delay,win}) {
  const host=code=>shell(code)
  await host(`clearRecordDocks();setTheme('p1');wv.loadURL('https://mdc.gta.world/dock-dashboard')`)
  await until(async()=>!(await guest()).isLoading()&&await (await guest()).executeJavaScript('window.dockReady===true'),'persistent dock fixture')
  let g=await guest();const read=code=>g.executeJavaScript(code,true)
  const count=n=>until(()=>host(`document.querySelectorAll('.record-tab').length===${n}`),'persistent dock '+n)
  const click=async id=>{await read(`document.querySelector('span[name="viewRecord"][id="${id}"]').click()`);await until(()=>read(`document.querySelector('#modalViewRecord.show .mdt-minimize')&&!$('#modalViewRecord').data('bs.modal')._isTransitioning`),'native record open');await delay(200)}
  const min=async()=>{await read(`document.querySelector('#modalViewRecord .mdt-minimize').click()`);await delay(250)}
  await click('406471')
  await read(`(()=>{const d=document.querySelector('#modalViewRecord .modal-dialog');d.setAttribute('data-mdt-sized','1');d.style.width='520px';d.querySelector('.modal-content').style.height='340px';})()`);await delay(150)
  await read(`document.querySelector('#modalViewRecord .modal-body').scrollTop=110`)
  const saved=await read(`(()=>{const n=document.querySelector('#modalViewRecord'),r=n.querySelector('.modal-header').getBoundingClientRect();return {left:r.left,top:r.top,width:n.querySelector('.modal-dialog').getBoundingClientRect().width,height:n.querySelector('.modal-content').getBoundingClientRect().height,scroll:n.querySelector('.modal-body').scrollTop}})()`)
  await min();await count(1)
  await click('406472');await min();await count(2)
  for(const route of ['dock-warrants','dock-person-lookup']) {
    await read(`document.querySelector('a[href="/${route}"]').click()`)
    await until(async()=>!(await guest()).isLoading()&&(await guest()).getURL().endsWith('/'+route),'navigate '+route)
    await count(2)
  }
  await host(`wv.reload()`);await until(async()=>!(await guest()).isLoading(),'MDC reload');await count(2)
  for(const theme of ['aero','aerolapd','aerodark','off','p1']) {await host(`setTheme('${theme}')`);await delay(150);await count(2)}
  await host(`Array.from(document.querySelectorAll('.record-restore')).find(n=>n.title.includes('406471')).click()`)
  await count(1);await delay(250)
  const restored=await read(`(()=>{const n=document.querySelector('#modalViewRecord'),r=n.querySelector('.modal-header').getBoundingClientRect();return {left:r.left,top:r.top,width:n.querySelector('.modal-dialog').getBoundingClientRect().width,height:n.querySelector('.modal-content').getBoundingClientRect().height,scroll:n.querySelector('.modal-body').scrollTop,id:document.querySelector('#viewRecordID').textContent,requests:window.recordRequests}})()`)
  for(const k of ['left','top','width','height','scroll']) assert.ok(Math.abs(saved[k]-restored[k])<2,'navigation restore '+k+' '+JSON.stringify({saved,restored}))
  assert.equal(restored.id,'406471');assert.deepEqual(restored.requests,['406471'],'native record opener runs on current page')
  const requests=restored.requests.length
  await host(`document.querySelector('.record-close').click()`);await count(0)
  assert.equal(await read('window.recordRequests.length'),requests,'closing a navigation-surviving tab does not reopen it')
  await read(`$('#modalViewRecord').modal('hide')`);await delay(350)
  await click('406472');await min();await count(1)
  await host(`wv.loadURL('https://mdc.gta.world/dock-unavailable')`);await until(async()=>!(await guest()).isLoading(),'page without record opener');await count(1)
  await host(`document.querySelector('.record-restore').click()`)
  await until(async()=>(await guest()).getURL().endsWith('/dock-person-lookup')&&!(await guest()).isLoading(),'source page fallback')
  await count(0)
  assert.equal(await read(`document.querySelector('#viewRecordID').textContent`),'406472','fallback opens record on its saved source page')
  await read(`document.querySelector('#modalViewRecord .modal-body').insertAdjacentHTML('beforeend','<textarea>Unsaved draft</textarea>')`)
  win.fixtureMessageBoxResponse=1
  await read(`document.querySelector('#modalViewRecord .mdt-minimize').click()`)
  await until(()=>!!win.fixtureMessageBox,'editable minimize warning')
  assert.ok(win.fixtureMessageBox.detail.includes('lose unsaved edits'),'warning explains navigation loss')
  await count(0)
  win.fixtureMessageBoxResponse=0
  await min();await count(1)
  await host(`wv.loadURL('https://mdc.gta.world/dock-unavailable')`);await until(async()=>!(await guest()).isLoading(),'unavailable viewer again')
  await host(`findPage(activePageId).recordDock[0].url=wv.getURL();document.querySelector('.record-restore').click()`)
  await until(()=>host(`findPage(activePageId).recordDock.length===1&&!findPage(activePageId).recordDock[0].pending`),'failed reopen leaves a usable tab')
  await count(1)
  await read(`const signout=document.createElement('a');signout.href='/logout';signout.textContent='Sign Out';document.body.append(signout);signout.click()`)
  await count(0)
  console.log('PASS shell dock across Dashboard > Warrants > Person Lookup, reload and all skin switches; native reopen, geometry, scroll, dock close source-page fallback, editor warning, retryable failure and sign-out cleanup')
  return 13
}
module.exports={persistentDockFixture,verifyPersistentDock}
