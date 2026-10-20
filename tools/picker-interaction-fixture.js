const assert=require('assert/strict'),fs=require('fs'),path=require('path')
const contrast=(a,b)=>{const lum=c=>{const x=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4);return x[0]*.2126+x[1]*.7152+x[2]*.0722};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
async function source({shell,guest,until}) {
 await shell(`dialogRoots.slice().forEach(closeDialog);setTheme('p1');wv.loadURL('https://mdc.gta.world/source-markup')`)
 await until(async()=>!(await guest()).isLoading()&&await(await guest()).executeJavaScript('window.sourceReady===true'),'source picker/alerts fixture')
 const g=await guest();return {g,read:s=>g.executeJavaScript(s,true)}
}
async function verifyPickerInteractions(ctx) {
 const {shell,until,delay,win,output}=ctx,{g,read}=await source(ctx)
 let checks=0
 const key=async code=>{const input=code==='Control+A'?{keyCode:'A',modifiers:['control']}:{keyCode:code};g.sendInputEvent({type:'keyDown',...input});g.sendInputEvent({type:'keyUp',...input});await delay(140)}
 const click=async selector=>{const point=await read(`(()=>{let r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);g.sendInputEvent({type:'mouseMove',...point});g.sendInputEvent({type:'mouseDown',...point,button:'left',clickCount:1});g.sendInputEvent({type:'mouseUp',...point,button:'left',clickCount:1});await delay(180)}
 for(const theme of (process.argv.includes('--picker-resize-only')?[]:['p1','aero','aerolapd','aerodark'])) {
  await shell(`setTheme('${theme}')`);await delay(220)
  for(const id of ['source-add-arrest','modalAddArrestWarrant']) {
   const host='#'+id,base=host+' .chargeWrapper .bootstrap-select'
   await read(`$('${host}').modal('show');void 0`)
   await until(()=>read(`document.querySelector('${host}.show')&&!$('${host}').data('bs.modal')._isTransitioning`),'source form shown')
   await read(`if(!document.querySelector('${host} .chargeWrapper select'))$('${host} .addCharge').click();void 0`);await delay(200)
   await read(`(()=>{let b=document.querySelector('${host} .modal-body'),r=document.querySelector('${host} .chargeWrapper').getBoundingClientRect(),br=b.getBoundingClientRect();b.scrollTop=Math.max(0,b.scrollTop+r.top-(br.bottom-70))})()`)
   await click(base+' > button');await delay(280)
   const bounds=async()=>{
    const r=await read(`(()=>{let p=document.querySelector('${base}'),m=p.querySelector('.dropdown-menu'),b=p.querySelector('button').getBoundingClientRect(),r=m.getBoundingClientRect(),v=p.closest('.modal-body').getBoundingClientRect();return {menu:r.toJSON(),button:b.toJSON(),view:v.toJSON(),up:p.classList.contains('dropup')}})()`)
    assert.ok(Math.abs(r.menu.width-r.button.width)<1.5&&Math.abs(r.menu.left-r.button.left)<1.5&&r.menu.top>=r.view.top-1&&r.menu.bottom<=r.view.bottom+1&&r.menu.right<=r.view.right+1,theme+' '+id+' menu fits native body and button '+JSON.stringify(r));checks++
    if(r.button.top-r.view.top>r.view.bottom-r.button.bottom+10)assert.ok(r.up,theme+' native dropup when space is above')
   }
   await bounds()
   const bar=await read(`(()=>{let n=document.querySelector('${base} div.inner'),s=getComputedStyle(n,'::-webkit-scrollbar');return {width:s.width,display:s.display,overflow:getComputedStyle(n).overflowY,client:n.clientHeight,scroll:n.scrollHeight}})()`)
   assert.ok(bar.width==='10px'&&bar.display!=='none'&&bar.overflow==='auto'&&bar.scroll>bar.client,theme+' visible native list scrollbar '+JSON.stringify(bar));checks++
   const thumb=await read(`(()=>{let n=document.querySelector('${base} div.inner'),r=n.getBoundingClientRect();n.scrollTop=0;return {x:Math.round(r.right-5),y:Math.round(r.top+8),body:n.closest('.modal-body').scrollTop,page:document.querySelector('.main-panel').scrollTop}})()`)
   g.focus();g.sendInputEvent({type:'mouseMove',x:thumb.x,y:thumb.y});await delay(60)
   g.sendInputEvent({type:'mouseDown',x:thumb.x,y:thumb.y,button:'left',clickCount:1});await delay(40)
   for(let step=1;step<=5;step++){g.sendInputEvent({type:'mouseMove',x:thumb.x,y:thumb.y+12*step,movementY:12});await delay(30)}
   g.sendInputEvent({type:'mouseUp',x:thumb.x,y:thumb.y+60,button:'left',clickCount:1})
   await until(()=>read(`document.querySelector('${base} div.inner').scrollTop>0`),theme+' list scrollbar thumb drags')
   assert.ok(await read(`document.querySelector('${host} .modal-body').scrollTop===${thumb.body}&&document.querySelector('.main-panel').scrollTop===${thumb.page}`),theme+' thumb leaves page and form fixed');checks++
   const badges=await read(`Array.from(document.querySelectorAll('${base} .dropdown-menu .badge')).map(n=>({text:n.textContent,font:parseFloat(getComputedStyle(n).fontSize),ink:getComputedStyle(n).webkitTextFillColor,bg:getComputedStyle(n).backgroundColor,height:n.getBoundingClientRect().height}))`)
   assert.ok(badges.length>3&&badges.every(b=>b.text.trim()&&b.font>=10&&b.height>=15&&contrast(b.ink,b.bg)>=4.5),theme+' code badges readable '+JSON.stringify(badges.filter(b=>!b.text.trim()||b.font<10||b.height<15||contrast(b.ink,b.bg)<4.5).slice(0,8)));checks++
   await click(base+' .bs-searchbox input');await g.insertText(id==='source-add-arrest'?'Treason':'Fixture charge 1');await delay(200)
   await key('Down');await key('Return')
   assert.ok(await read(`(()=>{let p=document.querySelector('${base}');return !!p.querySelector('select').value&&!p.classList.contains('show')})()`),theme+' search/arrow/Enter selects and closes');checks++
   const selected=await read(`document.querySelector('${base} select').value`)
   await click(base+' > button');await delay(180)
   assert.equal(await read(`document.querySelector('${base} select').value`),selected,theme+' reopen retains selection')
   await click(base+' .bs-searchbox input');await key('Control+A');await key('Backspace');await delay(150)
   assert.equal(await read(`document.querySelector('${base} .bs-searchbox input').value`),'',theme+' search fully cleared before wheel')
   const wheel=await read(`(()=>{let n=document.querySelector('${base} div.inner');n.scrollTop=0;let r=n.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+Math.min(45,r.height/2))}})()`)
   await read(`window.lastPickerWheel=null;window.addEventListener('wheel',e=>{window.lastPickerWheel={target:e.target.className,delta:e.deltaY}},{capture:true,once:true})`);g.focus()
   g.sendInputEvent({type:'mouseMove',...wheel});g.sendInputEvent({type:'mouseWheel',...wheel,deltaY:-130,deltaX:0,canScroll:true})
   try {await until(()=>read(`document.querySelector('${base} div.inner').scrollTop>0`),theme+' native list wheel moves')} catch(error){throw new Error(error.message+' '+JSON.stringify(await read(`(()=>{let p=document.querySelector('${base}'),n=p.querySelector('div.inner'),hit=document.elementFromPoint(${wheel.x},${wheel.y});return {wheel:window.lastPickerWheel,top:n.scrollTop,height:n.clientHeight,scroll:n.scrollHeight,overflow:getComputedStyle(n).overflowY,hit:hit?.outerHTML.slice(0,160)}})()`)))};checks++
   await click(base+' .bs-searchbox input')
   for(let step=0;step<12;step++)await key('Down')
   const highlighted=await read(`(()=>{let p=document.querySelector('${base}'),n=p.querySelector('div.inner'),a=p.querySelector('li.active .dropdown-item'),r=n.getBoundingClientRect(),v=a?.getBoundingClientRect();return {top:r.top,bottom:r.bottom,active:v?.toJSON()}})()`)
   assert.ok(highlighted.active&&highlighted.active.top>=highlighted.top-1&&highlighted.active.bottom<=highlighted.bottom+1,theme+' arrow navigation keeps highlight in view '+JSON.stringify(highlighted));checks++
   await click(base+' .bs-searchbox input');await g.insertText('zzzz-not-a-charge');await delay(180)
   assert.ok(await read(`!!document.querySelector('${base} .no-results')`),theme+' no-results state')
   await key('Down');await key('Escape')
   assert.ok(await read(`!document.querySelector('${base}').classList.contains('show')&&document.querySelector('${host}').classList.contains('show')`),theme+' no-results Escape closes only the list');checks++
   await click(base+' > button');await read(`document.querySelector('${host} .modal-header').click();void 0`);await delay(150)
   assert.ok(await read(`!document.querySelector('${base}').classList.contains('show')`),theme+' click away closes');checks++
   const companionCount=await read(`document.querySelectorAll('${base}').length`)
   for(let index=1;index<companionCount;index++) {
    await read(`document.querySelectorAll('${base} > button')[${index}].click();void 0`);await delay(220)
    const r=await read(`(()=>{let p=document.querySelectorAll('${base}')[${index}],b=p.querySelector('button').getBoundingClientRect(),r=p.querySelector('.dropdown-menu').getBoundingClientRect();return {width:r.width,button:b.width,dx:r.left-b.left,right:r.right,limit:innerWidth}})()`)
    assert.ok(Math.abs(r.width-r.button)<1.5&&Math.abs(r.dx)<1.5&&r.right<=r.limit,theme+' companion picker width '+JSON.stringify(r));checks++
    await key('Escape')
    assert.ok(await read(`document.querySelector('${host}').classList.contains('show')&&!document.querySelectorAll('${base}')[${index}].classList.contains('show')`),theme+' companion Escape keeps form open')
   }
   fs.writeFileSync(path.join(output,theme+'-'+id+'-picker.png'),(await g.capturePage()).toPNG())
   await key('Escape');assert.ok(await read(`!document.querySelector('${host}').classList.contains('show')`),theme+' Escape without a picker retains native form close');checks++
   await read(`$('${host}').modal('hide');void 0`);await delay(230)
  }
  console.log('PASS '+theme+' both native charge pickers: badges, search, hover, keyboard select, reopen, wheel, no results, Escape, away and companion widths')
 }
 await shell(`setTheme('p1')`);await read(`$('#source-add-arrest').modal('show');void 0`);await until(()=>read(`!$('#source-add-arrest').data('bs.modal')._isTransitioning`),'resize form settled');await read(`if(!document.querySelector('#source-add-arrest .chargeWrapper select'))$('#source-add-arrest .addCharge').click();void 0`);await delay(180)
 await click('#source-add-arrest .chargeWrapper .bootstrap-select > button')
 const grip=await read(`(()=>{let r=document.querySelector('#source-add-arrest > .modal-dialog > .modal-content > .mdt-grip').getBoundingClientRect(),x=Math.round(r.right-3),y=Math.round(r.bottom-3);window.gripInitialHit=document.elementFromPoint(x,y)?.className;return {x,y}})()`)
 g.focus();g.sendInputEvent({type:'mouseMove',...grip});await delay(50)
 g.sendInputEvent({type:'mouseDown',...grip,button:'left',clickCount:1});await delay(30)
 for(let step=1;step<=5;step++){g.sendInputEvent({type:'mouseMove',x:grip.x-19*step,y:grip.y-9*step,movementX:-19,movementY:-9});await delay(25)}
 g.sendInputEvent({type:'mouseUp',x:grip.x-95,y:grip.y-45,button:'left',clickCount:1});await delay(350)
 const afterGrip=await read(`(()=>{let p=document.querySelector('#source-add-arrest .chargeWrapper .bootstrap-select');if(!p.classList.contains('show'))p.querySelector('button').click();return true})()`);await delay(200)
 const gripWidth=await read(`(()=>{let p=document.querySelector('#source-add-arrest .chargeWrapper .bootstrap-select'),m=p.querySelector('.dropdown-menu').getBoundingClientRect(),b=p.querySelector('button').getBoundingClientRect();return {menu:m.width,button:b.width,dx:m.left-b.left,sized:!!p.closest('.modal-dialog[data-mdt-sized]'),hit:window.gripInitialHit}})()`)
 assert.ok(gripWidth.sized&&Math.abs(gripWidth.menu-gripWidth.button)<1.5&&Math.abs(gripWidth.dx)<1.5,'real popup resize aligns the menu '+JSON.stringify(gripWidth));checks++
 win.setSize(1100,820);await delay(350)
 const resized=await read(`(()=>{const p=document.querySelector('#source-add-arrest .chargeWrapper .bootstrap-select'),m=p.querySelector('.dropdown-menu').getBoundingClientRect(),b=p.querySelector('button').getBoundingClientRect(),v=p.closest('.modal-body').getBoundingClientRect();return {width:m.width,button:b.width,dx:m.left-b.left,top:m.top,bottom:m.bottom,min:v.top,max:v.bottom}})()`)
 assert.ok(Math.abs(resized.width-resized.button)<1.5&&Math.abs(resized.dx)<1.5&&resized.top>=resized.min-1&&resized.bottom<=resized.max+1,'open menu follows window resize '+JSON.stringify(resized));checks++
 await read(`$('#source-add-arrest').modal('hide');void 0`);await delay(200);win.setSize(1440,980)
 return checks
}
async function verifyStatusPanels(ctx) {
 const {shell,until,delay,win,output}=ctx,{g,read}=await source(ctx)
 await shell(`setTheme('off')`);await delay(200)
 const original=await read(`Array.from(document.querySelectorAll('#navbarDropdownNotifications ~ .dropdown-menu b[class]')).map(n=>({tone:n.className,color:getComputedStyle(n).color}))`)
 assert.ok(original.some(n=>n.tone==='text-warning'&&n.color==='rgb(255, 152, 0)')&&original.some(n=>n.tone==='text-success'&&n.color==='rgb(76, 175, 80)'),'source original MDC warning/success hues')
 await read(`document.querySelector('#navbarDropdownNotifications ~ .dropdown-menu').insertAdjacentHTML('beforeend','<a class="dropdown-item" href="#"><p>Submission <b class="text-danger">REJECTED</b> <b class="text-warning">CUSTOM STATUS</b></p></a>');void 0`)
 let checks=1
 const open=async()=>{await shell(`headerCtlClick('bell')`);await until(()=>shell(`!!document.querySelector('#hdr-popup.open .hdrpop-colored[data-tone="success"]')`),'native notification parts received')}
 const closed=async label=>{await until(()=>shell(`hdrOpen===''&&!document.querySelector('#hdr-popup.open')`),label);checks++}
 for(const theme of ['p1','aero','aerolapd','aerodark']) {
  await shell(`setTheme('${theme}')`);await delay(200);await open()
  const rows=await shell(`Array.from(document.querySelectorAll('.hdrpop-colored')).map(n=>({tone:n.dataset.tone,text:n.textContent,color:getComputedStyle(n).color,bg:getComputedStyle(document.querySelector('#hdr-popup')).backgroundColor}))`)
  assert.ok(rows.some(n=>n.tone==='warning'&&n.text==='PENDING')&&rows.some(n=>n.tone==='success'&&n.text==='ACCEPTED')&&rows.some(n=>n.text==='CUSTOM STATUS')&&rows.every(n=>contrast(n.color,n.bg)>=4.5),theme+' source color spans survive with contrast '+JSON.stringify(rows));checks++
  const point=await shell(`(()=>{let n=document.querySelector('.hdrpop-colored[data-tone="warning"]'),r=n.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
  win.webContents.sendInputEvent({type:'mouseMove',...point});await delay(200)
  const hover=await shell(`(()=>{let n=document.querySelector('.hdrpop-colored[data-tone="warning"]');return {color:getComputedStyle(n).color,bg:getComputedStyle(n.closest('.hdrpop-item')).backgroundColor,expected:getComputedStyle(document.body).getPropertyValue('--hover'),ink:getComputedStyle(n.closest('.hdrpop-item')).color}})()`)
  assert.ok(contrast(hover.color,hover.bg)>=4.5&&contrast(hover.ink,hover.bg)>=4.5&&hover.bg!=='rgb(0, 0, 0)',theme+' notification hover contrast '+JSON.stringify(hover));checks++
  fs.writeFileSync(path.join(output,theme+'-notifications.png'),(await win.webContents.capturePage()).toPNG())
  await read(`document.body.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));void 0`);await closed(theme+' guest click dismisses')
  await open();await read(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));void 0`);await closed(theme+' guest Escape dismisses')
  await open();await shell(`window.dispatchEvent(new Event('blur'))`);await closed(theme+' window blur dismisses')
  await open();await shell(`document.querySelector('.menu-label').click()`);await closed(theme+' another menu dismisses');await shell('closeMenus()')
  await open();await shell(`document.getElementById('hb-history').click()`);await closed(theme+' History dismisses');await shell(`dialogRoots.slice().forEach(closeDialog)`)
  await open();await shell(`headerCtlClick('bell')`);await closed(theme+' bell toggle')
  await open();await shell(`showTab('penal')`);await closed(theme+' switch main tab');await shell(`showTab('mdc')`)
  console.log('PASS '+theme+' native notification class colors, hover contrast and shared status-panel dismissal')
 }
 return checks
}
module.exports={verifyPickerInteractions,verifyStatusPanels}
