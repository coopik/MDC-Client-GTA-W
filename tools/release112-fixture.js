const fs=require('fs'),path=require('path'),assert=require('assert/strict')
const {release111Fixture}=require('./release111-fixture')
function release112Fixture(){
 const content=fs.readFileSync(path.join(__dirname,'fixtures/incident-create.html'),'utf8')+fs.readFileSync(path.join(__dirname,'fixtures/incident-details.html'),'utf8')
 return release111Fixture().replace('</head>','<script src="/site-vendor/perfect-scrollbar.jquery.min.js"></script></head>').replace('<main class="content">','<main class="content">'+content).replace('</body>',`<script>document.querySelector('#personsBricklayerClone').removeAttribute('hidden');$('#suspectFurtherDetails').summernote({height:130});window.initNativeRails=()=>$('.inner').perfectScrollbar();window.release112Ready=true</script></body>`)
}
async function verifyRelease112({shell,guest,until,delay,win,output}){
 let checks=0
 const nav=async url=>{await shell(`wv.loadURL('${url}')`);await until(async()=>!(await guest()).isLoading()&&await(await guest()).executeJavaScript(`location.pathname==='${url.replace('https://mdc.gta.world','')}'&&document.readyState==='complete'`),'112 navigation');await delay(300)}
 const pointer=async(selector,type='mouseMove')=>{const r=await shell(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`);win.webContents.sendInputEvent({type,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),...(type==='mouseMove'?{}:{button:'left',clickCount:1})});await delay(100)}
 await shell(`setTheme('aerolapd');openPage('https://mdc.gta.world/regressions')`)
 await until(async()=>await(await guest()).executeJavaScript(`typeof openSharedReport==='function'`),'dock source ready')
 await(await guest()).executeJavaScript(`openSharedReport('407052','Fixture record')`)
 await until(async()=>await(await guest()).executeJavaScript(`!!document.querySelector('#sharedViewer .mdt-minimize')`),'minimize control');await delay(400)
 await(await guest()).executeJavaScript(`document.querySelector('#sharedViewer .modal-body').insertAdjacentHTML('afterbegin','<span id="fixtureRecordType" style="color:#44aa77">Infraction Report</span>')`)
 await(await guest()).executeJavaScript(`document.querySelector('#sharedViewer .mdt-minimize').click()`)
 await until(()=>shell(`!!document.querySelector('.record-tab')`),'shell dock')
 for(const theme of ['aerolapd','aero','aerodark','p1']){
  await shell(`setTheme('${theme}')`);await delay(220)
  await pointer('.pageclose')
  const hover=await shell(`(()=>{let s=getComputedStyle(document.querySelector('.pageclose'));return {bg:s.backgroundImage,ink:s.color}})()`)
  assert.ok(theme==='p1'?hover.ink!=='rgb(255, 255, 255)':hover.bg.includes('gradient'),theme+' page close matches palette');checks++
  fs.writeFileSync(path.join(output,theme+'-112-page-close-hover.png'),(await win.webContents.capturePage()).toPNG())
  await pointer('.pageclose','mouseDown')
  const down=await shell(`getComputedStyle(document.querySelector('.pageclose')).backgroundImage`)
  if(theme!=='p1')assert.notEqual(down,hover.bg,theme+' distinct pressed glass');checks++
  win.webContents.sendInputEvent({type:'mouseMove',x:1,y:1});win.webContents.sendInputEvent({type:'mouseUp',x:1,y:1,button:'left',clickCount:1})
  const dock=await shell(`(()=>{let n=document.querySelector('.record-tab');return {bg:getComputedStyle(n).backgroundImage,ink:getComputedStyle(n.firstChild).color,strip:n.style.borderLeftWidth}})()`)
  assert.equal(dock.strip,'3px');if(theme==='aerolapd')assert.ok(dock.bg.includes('gradient')&&dock.ink==='rgb(255, 255, 255)');checks++
  await pointer('.record-close');if(theme==='aerolapd')assert.equal(await shell(`getComputedStyle(document.querySelector('.record-close')).backgroundImage`),hover.bg);checks++
  fs.writeFileSync(path.join(output,theme+'-112-dock.png'),(await win.webContents.capturePage()).toPNG())
 }
 await nav('https://mdc.gta.world/incident/create/release112')
 const g=await guest(),read=code=>g.executeJavaScript(code,true)
 await read('document.fonts.ready')
 for(const theme of ['aerolapd','aero','aerodark','p1']){
  await shell(`setTheme('${theme}')`);await delay(250)
  const icons=await read(`Array.from(document.querySelectorAll('#addNewPerson,#personsBricklayerClone #deleteButton')).map(n=>({font:getComputedStyle(n).fontFamily,pseudo:getComputedStyle(n,'::before').fontFamily,glyph:getComputedStyle(n,'::before').content}))`)
  assert.ok(icons.length===2&&icons.every(n=>n.font.includes('Font Awesome')&&n.pseudo.includes('Font Awesome')&&!['none','""'].includes(n.glyph)),theme+' real add/delete icon fonts '+JSON.stringify(icons));checks++
  const links=await read(`Array.from(document.querySelectorAll('#linkAPB,#linkWarrant,#linkCall,#linkIncident')).map(n=>{let s=getComputedStyle(n);return {h:n.getBoundingClientRect().height,padding:parseFloat(s.paddingLeft),border:parseFloat(s.borderTopWidth),bg:s.backgroundImage}})`)
  assert.ok(links.length===4&&links.every(n=>n.h>=24&&n.padding>=8&&n.border>0&&n.bg.includes('gradient')),theme+' compact linked buttons '+JSON.stringify(links));checks++
  await read(`document.querySelector('#linkAPB').scrollIntoView({block:'center'});void 0`);await delay(100)
  fs.writeFileSync(path.join(output,theme+'-112-incident-links.png'),(await g.capturePage()).toPNG())
  await read(`document.querySelector('#addNewPerson').scrollIntoView({block:'start'});void 0`);await delay(100)
  fs.writeFileSync(path.join(output,theme+'-112-incident-icons.png'),(await g.capturePage()).toPNG())
  for(const id of ['source-add-arrest','modalAddArrestWarrant']){
   await read(`$('#${id}').modal('show');if(!document.querySelector('#${id} .chargeWrapper select'))$('#${id} .addCharge').click();void 0`);await delay(600)
   const count=await read(`document.querySelectorAll('#${id} .chargeWrapper .bootstrap-select').length`)
   for(let index=0;index<count;index++){
    await read(`document.querySelectorAll('#${id} .chargeWrapper .bootstrap-select')[${index}].querySelector('button').click();void 0`);await delay(400)
    await read(`initNativeRails();void 0`);await delay(100)
    const measure=()=>read(`(()=>{let p=document.querySelector('#${id} .bootstrap-select.show'),m=p.querySelector('.dropdown-menu'),n=m.querySelector('div.inner'),s=m.querySelector('.bs-searchbox');return {h:m.offsetHeight,inner:n.clientHeight,height:n.scrollHeight,scroll:n.scrollTop,gutter:n.offsetWidth-n.clientWidth,outer:getComputedStyle(m).overflowY,search:s?.getBoundingClientRect().top,rails:[...m.querySelectorAll('.ps-scrollbar-y-rail,.ps-scrollbar-y,.ps__rail-y,.ps__thumb-y')].map(r=>getComputedStyle(r).display),body:n.closest('.modal-body').scrollTop}})()`)
    const before=await measure()
    assert.ok(before.rails.length>=2&&before.rails.every(n=>n==='none')&&before.gutter>=8&&before.outer==='hidden',theme+' one native scrollbar with actual vendor rails '+JSON.stringify(before));checks++
    const point=await read(`(()=>{let r=document.querySelector('#${id} .bootstrap-select.show div.inner').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
    g.debugger.attach('1.3');await g.debugger.sendCommand('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:150});g.debugger.detach();await delay(100)
    const after=await measure()
    assert.ok(after.h===before.h&&after.inner===before.inner&&after.search===before.search&&Math.abs(after.body-before.body)<=1,theme+' fixed size, pinned search and contained wheel');checks++
    if(index===0){assert.ok(after.scroll>before.scroll,theme+' long list scrolls');checks++
     const thumb=await read(`(()=>{let n=document.querySelector('#${id} .bootstrap-select.show div.inner'),r=n.getBoundingClientRect();n.scrollTop=0;return {x:Math.round(r.right-5),y:Math.round(r.top+8)}})()`)
     g.focus();g.sendInputEvent({type:'mouseMove',...thumb});g.sendInputEvent({type:'mouseDown',...thumb,button:'left',clickCount:1});await delay(50);g.sendInputEvent({type:'mouseMove',x:thumb.x,y:thumb.y+50,movementY:50});g.sendInputEvent({type:'mouseUp',x:thumb.x,y:thumb.y+50,button:'left',clickCount:1});await delay(120)
     assert.ok((await measure()).scroll>0,theme+' native thumb drags');checks++
     fs.writeFileSync(path.join(output,theme+'-112-'+id+'-single-scrollbar.png'),(await g.capturePage()).toPNG())
     await read(`document.querySelector('#${id} .bootstrap-select.show .bs-searchbox input').focus();void 0`)
     await g.insertText(id==='source-add-arrest'?'Treason':'Fixture charge 1');await delay(180)
     g.sendInputEvent({type:'keyDown',keyCode:'Down'});g.sendInputEvent({type:'keyUp',keyCode:'Down'});await delay(100)
     assert.ok(await read(`(()=>{let p=document.querySelector('#${id} .bootstrap-select.show'),n=p.querySelector('div.inner').getBoundingClientRect(),a=p.querySelector('li.active .dropdown-item')?.getBoundingClientRect();return !!a&&a.top>=n.top-1&&a.bottom<=n.bottom+1})()`),theme+' filtering and keyboard highlight with vendor rails');checks++
     g.sendInputEvent({type:'keyDown',keyCode:'Enter'});g.sendInputEvent({type:'keyUp',keyCode:'Enter'});await delay(180)
     assert.ok(await read(`!!document.querySelectorAll('#${id} .chargeWrapper select')[${index}].value`),theme+' Enter selects filtered charge');checks++
     await read(`document.querySelectorAll('#${id} .chargeWrapper .bootstrap-select')[${index}].querySelector('button').click();void 0`);await delay(350)
    }
    await read(`document.querySelector('#${id} .bootstrap-select.show .dropdown-menu').dispatchEvent(new Event('mdt:picker-dismiss',{bubbles:true}));void 0`);await delay(150)
   }
   await read(`$('#${id}').modal('hide');void 0`);await delay(180)
  }
  console.log('PASS '+theme+' page/dock glass, supplied Incident controls and single native dropdown scrollbar')
 }
 return checks
}
module.exports={release112Fixture,verifyRelease112}
