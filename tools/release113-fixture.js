const fs=require('fs'),path=require('path'),assert=require('assert/strict')
const {siteSourceFixture}=require('./site-source-fixture')
const {release112Fixture}=require('./release112-fixture')
const {verifyRecordSurfaces}=require('./record-surface-fixture')
function recordPerformanceFixture(){return siteSourceFixture().replace('<main class="content">','<main class="content">'+fs.readFileSync(path.join(__dirname,'fixtures/person-record.html'),'utf8'))}
function darkThemeFixture(){return release112Fixture().replace('<main class="content">','<main class="content">'+fs.readFileSync(path.join(__dirname,'fixtures/person-record.html'),'utf8'))}
async function verifyEditorTyping({shell,guest,until,delay,output,baseline=false}){
 let checks=0
 const result={version:require('../package.json').version,label:baseline?'before':'after',method:'Native Electron keyDown/char/keyUp, 30 characters at 35ms cadence, real Summernote BS4 in supplied record/arrest fixture; local only.',samples:[]}
 await shell(`dialogRoots.slice().forEach(closeDialog);showTab('mdc');wv.loadURL('https://mdc.gta.world/record/dark113')`)
 await until(async()=>!(await guest()).isLoading()&&await(await guest()).executeJavaScript('window.release112Ready===true'),'typing fixture')
 const g=await guest(),read=code=>g.executeJavaScript(code,true)
 await shell(`setTheme('off')`);await delay(150)
 await read(`window.nativeTypingToolbar=$('#arrestReport').data('summernote').modules.buttons.updateCurrentStyle;void 0`)
 await read(`$('#source-add-arrest .modal-title').text('Edit Record - #405452');$('#source-add-arrest').modal('show');void 0`);await delay(700)
 g.debugger.attach('1.3')
 const metric=async()=>Object.fromEntries((await g.debugger.sendCommand('Performance.getMetrics')).metrics.map(n=>[n.name,n.value]))
 try{
 await g.debugger.sendCommand('Performance.enable');await g.debugger.sendCommand('Profiler.enable')
 for(const theme of (baseline?['p1dark','p1','aerolapd','off']:['p1dark','p1','aero','aerolapd','aerodark','off'])){
  await shell(`setTheme('${theme}')`);await delay(400)
  for(let sample=0;sample<2;sample++){
   await read(`(()=>{let e=document.querySelector('#source-add-arrest .note-editable');e.innerHTML='<p>Typing:</p>';e.focus();const r=document.createRange();r.selectNodeContents(e.firstChild);r.collapse(false);getSelection().removeAllRanges();getSelection().addRange(r);window.typingInputs=[];window.typingFrames=[];if(!e.dataset.typingObserved){e.dataset.typingObserved='1';e.addEventListener('input',()=>{typingInputs.push(Date.now());requestAnimationFrame(()=>typingFrames.push(Date.now()))})}})()`);await delay(250)
   const before=await metric(),sent=[];await g.debugger.sendCommand('Profiler.start');const start=Date.now()
   const chars='the quick brown fox types here'
   for(const c of chars){sent.push(Date.now());g.sendInputEvent({type:'keyDown',keyCode:c===' '?'Space':c});g.sendInputEvent({type:'char',keyCode:c});g.sendInputEvent({type:'keyUp',keyCode:c===' '?'Space':c});await delay(35)}
   await until(()=>read(`typingInputs.length===${chars.length}&&typingFrames.length===${chars.length}`),'all native typing events painted');await delay(300)
   const after=await metric(),state=await read(`({inputs:typingInputs,frames:typingFrames,text:document.querySelector('#source-add-arrest .note-editable').textContent,code:$('#source-add-arrest #arrestReport').summernote('code')})`),{profile}=await g.debugger.sendCommand('Profiler.stop')
   const row={theme,sample,sent,inputs:state.inputs,frames:state.frames,text:state.text,elapsedMs:Date.now()-start,taskMs:(after.TaskDuration-before.TaskDuration)*1000,scriptMs:(after.ScriptDuration-before.ScriptDuration)*1000,recalcMs:(after.RecalcStyleDuration-before.RecalcStyleDuration)*1000,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000,recalcs:after.RecalcStyleCount-before.RecalcStyleCount}
   row.inputDelayMs=state.inputs.map((t,i)=>t-sent[i]);row.frameDelayMs=state.frames.map((t,i)=>t-sent[i]);result.samples.push(row)
   assert.equal(state.text.replace(/\u00a0/g,' '),'Typing:'+chars,'native editor keeps every character '+JSON.stringify(state));assert.ok(state.code.replace(/&nbsp;|\u00a0/g,' ').includes(chars),'native Summernote retains typed content')
   if(!baseline){const delays=row.frameDelayMs.slice().sort((a,b)=>a-b);assert.ok(delays[Math.floor(delays.length*.95)]<150,'typing frame delay stays responsive '+JSON.stringify(row.frameDelayMs));assert.ok(row.recalcMs<200,'plain typing avoids repeated toolbar style recalculation '+row.recalcMs);checks+=2}
   checks++
   if(sample===0)fs.writeFileSync(path.join(output,'typing-113-'+result.label+'-'+theme+'.cpuprofile'),JSON.stringify(profile))
   console.log('TYPING '+result.label+' '+JSON.stringify(row))
  }
  if(!baseline){
   const fn=await read(`$('#arrestReport').data('summernote').modules.buttons.updateCurrentStyle===nativeTypingToolbar`)
   assert.equal(fn,theme==='off','Original restores exact native toolbar method');checks++
   await read(`$('#arrestReport').summernote('focus');$('#arrestReport').summernote('bold');$('#arrestReport').summernote('fontName','Arial');void 0`)
   g.sendInputEvent({type:'char',keyCode:'Z'});await delay(100)
   const formatting=await read(`(()=>{let c=$('#arrestReport').data('summernote');return {bold:document.querySelector('#source-add-arrest .note-btn-bold').classList.contains('active'),nativeBold:document.queryCommandState('bold'),font:document.querySelector('#source-add-arrest .note-current-fontname').textContent,nativeFont:document.queryCommandValue('fontName'),style:c.invoke('editor.currentStyle')['font-family'],code:$('#arrestReport').summernote('code')}})()`)
   assert.ok(formatting.bold===formatting.nativeBold&&formatting.font==='Arial','native toolbar follows changed formatting immediately '+JSON.stringify(formatting));checks++
   await read(`$('#arrestReport').summernote('bold');$('#arrestReport').summernote('undo');void 0`);await delay(80)
   assert.ok(await read(`$('#arrestReport').summernote('code').includes('the quick brown fox types here')`),'native undo preserves typed narrative');checks++
  }
 }
 if(!baseline){
  await shell(`setTheme('p1dark')`);await delay(150)
  await read(`document.querySelector('#source-add-arrest .modal-body').insertAdjacentHTML('beforeend','<textarea id="dynamic-typing-editor"></textarea>');$('#dynamic-typing-editor').summernote({height:120});window.dynamicTypingButtons=$('#dynamic-typing-editor').data('summernote').modules.buttons;window.dynamicTypingNative=Object.getPrototypeOf(dynamicTypingButtons).updateCurrentStyle;void 0`)
  assert.ok(await read(`dynamicTypingButtons.updateCurrentStyle!==dynamicTypingNative`),'late editor receives shared toolbar hook');checks++
  await read(`$('#dynamic-typing-editor').summernote('reset');void 0`);await delay(100)
  assert.ok(await read(`dynamicTypingButtons.updateCurrentStyle===dynamicTypingNative&&$('#dynamic-typing-editor').data('summernote').modules.buttons.updateCurrentStyle!==dynamicTypingNative`),'reset releases old module and hooks replacement');checks++
  await read(`window.dynamicTypingButtons=$('#dynamic-typing-editor').data('summernote').modules.buttons;$('#dynamic-typing-editor').summernote('destroy');void 0`)
  assert.ok(await read(`dynamicTypingButtons.updateCurrentStyle===dynamicTypingNative&&!$('#dynamic-typing-editor').data('summernote')`),'destroy restores native method and releases cache');checks++
 }
 }finally{g.debugger.detach()}
 fs.writeFileSync(path.join(output,'typing-113-'+result.label+'.json'),JSON.stringify(result,null,2))
 return checks
}
async function profileRelease113({shell,guest,until,delay,output,label='after'}){
 const result={version:require('../package.json').version,label,method:'Isolated Electron profile; supplied person-record and warrant markup; 350 generated charge options; local responses exclude server/network delay.',record:[],picker:[],duplicateSkin:[]}
 const outputFile=name=>path.join(output,'release-1.1.3-'+label+'-'+name)
 await shell(`setTheme('p1')`)
 const g=await guest()
 g.debugger.attach('1.3')
 const metric=async()=>Object.fromEntries((await g.debugger.sendCommand('Performance.getMetrics')).metrics.map(n=>[n.name,n.value]))
 const measure=async(fn,profileName)=>{
  const before=await metric();await g.debugger.sendCommand('Profiler.start');const start=Date.now()
  const data=await fn();const elapsedMs=Date.now()-start,after=await metric(),{profile}=await g.debugger.sendCommand('Profiler.stop')
  if(profileName)fs.writeFileSync(outputFile(profileName+'.cpuprofile'),JSON.stringify(profile))
  const rows=new Map(profile.nodes.map(n=>[n.id,n.callFrame])),self={}
  profile.samples.forEach((id,i)=>{const n=rows.get(id);if(!n||!n.url||!/(webview-preload|renderer|bootstrap-select|VM\d+|mdc\.gta)/.test(n.url))return;const key=n.functionName+' '+n.url.split('/').pop()+':'+(n.lineNumber+1);self[key]=(self[key]||0)+(profile.timeDeltas[i]||0)/1000})
  return {...data,elapsedMs,scriptMs:(after.ScriptDuration-before.ScriptDuration)*1000,recalcMs:(after.RecalcStyleDuration-before.RecalcStyleDuration)*1000,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000,taskMs:(after.TaskDuration-before.TaskDuration)*1000,recalcs:after.RecalcStyleCount-before.RecalcStyleCount,top:Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,10)}
 }
 const navigate=async url=>{await shell(`wv.loadURL('${url}')`);await until(async()=>!g.isLoading()&&g.getURL()===url&&await g.executeJavaScript('window.sourceReady===true&&!document.documentElement.classList.contains("mdt-cloak")'),'profile navigation');await delay(250)}
 try{
  await g.debugger.sendCommand('Performance.enable');await g.debugger.sendCommand('Profiler.enable')
  for(let i=0;i<3;i++){
   result.record.push(await measure(async()=>{await navigate('https://mdc.gta.world/record/perf113');return {}},i===0?'record':null))
   result.duplicateSkin.push(await measure(async()=>{await shell(`wv.send('mdt:set-skin','p1');wv.send('mdt:set-skin','p1');wv.send('mdt:set-skin','p1')`);await delay(450);return {}},i===0?'duplicate-skin':null))
   await navigate('https://mdc.gta.world/source-markup')
   await g.executeJavaScript(`$('#modalAddArrestWarrant').modal('show');$('#modalAddArrestWarrant .addCharge').click();void 0`);await delay(650)
   result.picker.push(await measure(async()=>{const synchronousMs=await g.executeJavaScript(`(()=>{let n=document.querySelector('#modalAddArrestWarrant .bootstrap-select > button');n.scrollIntoView({block:'center'});let t=performance.now();n.click();return performance.now()-t})()`);await delay(350);return {synchronousMs}},i===0?'picker':null))
  }
 }finally{g.debugger.detach()}
 fs.writeFileSync(outputFile('metrics.json'),JSON.stringify(result,null,2))
 console.log('RELEASE 1.1.3 PROFILE '+JSON.stringify(result))
 return 1
}
async function verifyRelease113({shell,guest,until,delay,win,output}){
 let checks=0
 const contrast=(a,b)=>{const lum=c=>{const x=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4);return x[0]*.2126+x[1]*.7152+x[2]*.0722};const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
 await shell(`dialogRoots.slice().forEach(closeDialog);actions.themep1dark()`)
 assert.equal(await shell(`view.theme`),'p1dark');assert.equal(await shell(`localStorage.getItem('mdc.theme')`),'p1dark');checks++
 await shell(`actions.options()`)
 assert.ok(await shell(`!!document.querySelector('input[name="opt-theme"][value="p1dark"]:checked')`),'Dark in Options');checks++
 await shell(`dialogRoots.slice().forEach(closeDialog);setTheme('p1');cycleTheme()`)
 assert.equal(await shell('view.theme'),'p1dark','F8 reaches PatrolOne Dark');checks++
 await shell(`wv.loadURL('https://mdc.gta.world/record/dark113')`)
 await until(async()=>!(await guest()).isLoading()&&await(await guest()).executeJavaScript('window.release112Ready===true&&document.documentElement.classList.contains("mdt-p1dark")'),'dark source ready')
 const g=await guest(),read=s=>g.executeJavaScript(s,true)
 await read('document.fonts.ready');await delay(400)
 const colors=await read(`(()=>{const pair=n=>{let s=getComputedStyle(n);return [s.color,s.backgroundColor]};return {body:pair(document.body),fields:[...document.querySelectorAll('input.form-control')].slice(0,3).map(pair),plate:pair(document.querySelector('.badge-light:has([data-clipboard-target^="#plate"])')),icons:[...document.querySelectorAll('#addNewPerson,#personsBricklayerClone #deleteButton')].map(n=>getComputedStyle(n,'::before').fontFamily)}})()`)
 assert.ok(contrast(...colors.body)>=4.5&&colors.fields.every(n=>contrast(...n)>=4.5)&&contrast(...colors.plate)>=4.5,'Dark body/field/plate contrast '+JSON.stringify(colors));checks++
 assert.ok(colors.icons.every(n=>n.includes('Font Awesome')),'Dark keeps native icon fonts');checks++
 assert.ok(await shell(`document.body.classList.contains('theme-p1')&&document.body.classList.contains('theme-p1dark')&&!document.body.classList.contains('glass-layout')`),'Dark uses PatrolOne geometry');checks++
 await read(`document.querySelector('.badge-light:has([data-clipboard-target^="#plate"])').scrollIntoView({block:'center'});void 0`);await delay(100)
 fs.writeFileSync(path.join(output,'p1dark-113-record.png'),(await g.capturePage()).toPNG())
 await read(`document.querySelector('.content').insertAdjacentHTML('beforeend','<p id="late-dark-contrast" style="color:#222222">Late visible content</p>');void 0`)
 await until(()=>read(`getComputedStyle(document.querySelector('#late-dark-contrast')).color==='rgb(255, 255, 255)'`),'late dynamic contrast repair');checks++
 await shell(`wv.send('mdt:set-skin','p1dark');wv.send('mdt:set-skin','p1dark')`);await delay(150)
 assert.equal(await read(`getComputedStyle(document.querySelector('#late-dark-contrast')).color`),'rgb(255, 255, 255)','same-skin no-op preserves late repairs');checks++
 await read(`document.body.insertAdjacentHTML('beforeend','<div class="modal" id="late-contrast-modal"><div class="modal-dialog"><div class="modal-content"><div class="modal-header">Contrast fixture</div><div class="modal-body"><p id="hidden-dark-contrast" style="color:#222222">Newly opened content</p></div></div></div></div>');$('#late-contrast-modal').modal('show');void 0`)
 await until(()=>read(`getComputedStyle(document.querySelector('#hidden-dark-contrast')).color==='rgb(255, 255, 255)'`),'newly shown modal contrast repair');checks++
 await read(`$('#late-contrast-modal').modal('hide');void 0`);await delay(250)
 const key=async keyCode=>{g.sendInputEvent({type:'keyDown',keyCode});g.sendInputEvent({type:'keyUp',keyCode});await delay(80)}
 for(const id of ['source-add-arrest','modalAddArrestWarrant']){
  await read(`$('#${id}').modal('show');if(!document.querySelector('#${id} .chargeWrapper select'))$('#${id} .addCharge').click();void 0`);await delay(600)
  await read(`document.querySelector('#${id} .bootstrap-select > button').click();void 0`);await delay(400)
  await read(`initNativeRails();void 0`)
  const buttons=await read(`Array.from(document.querySelectorAll('#${id} .bootstrap-select > button,#${id} .note-toolbar .note-btn:not(.note-color-btn):not(.note-current-color-button):not(.note-recent-color)')).map(n=>{let s=getComputedStyle(n),stops=s.backgroundImage.match(/rgba?\\([^)]+\\)/g)||[s.backgroundColor];return {ink:s.webkitTextFillColor,stops}})`)
  assert.ok(buttons.length>4&&buttons.every(n=>n.stops.every(bg=>contrast(n.ink,bg)>=4.5)),'Dark picker and editor faces keep readable icon/text contrast '+JSON.stringify(buttons));checks++

  const state=()=>read(`(()=>{let p=document.querySelector('#${id} .bootstrap-select.show'),m=p.querySelector('.dropdown-menu'),n=m.querySelector('div.inner'),instance=$(p.querySelector('select')).data('selectpicker'),s=getComputedStyle(m.querySelector('.bs-searchbox input'));return {h:m.offsetHeight,scroll:n.scrollTop,body:n.closest('.modal-body').scrollTop,search:m.querySelector('.bs-searchbox').getBoundingClientRect().top,virtual:instance.options.virtualScroll,total:instance.selectpicker.main.data.length,rendered:n.querySelectorAll('li').length,gutter:n.offsetWidth-n.clientWidth,ink:s.color,field:s.backgroundColor,rails:[...m.querySelectorAll('.ps-scrollbar-y-rail,.ps-scrollbar-y')].map(n=>getComputedStyle(n).display)}})()`)
  const first=await state()
  assert.ok(first.virtual===80&&first.rendered<first.total&&first.rendered>0,'native virtualization bounds mounted rows '+JSON.stringify(first));checks++
  assert.ok(contrast(first.ink,first.field)>=4.5&&first.gutter>=8&&first.rails.every(n=>n==='none'),'Dark search contrast and one scrollbar');checks++
  const point=await read(`(()=>{let r=document.querySelector('#${id} .bootstrap-select.show div.inner').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
  g.debugger.attach('1.3');await g.debugger.sendCommand('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaY:240,deltaX:0});g.debugger.detach();await delay(150)
  const after=await state()
  assert.ok(after.scroll>first.scroll&&after.h===first.h&&after.search===first.search&&Math.abs(after.body-first.body)<=1,'Dark native scrolling stays contained and fixed');checks++
  await read(`document.querySelector('#${id} .bootstrap-select.show .bs-searchbox input').focus();void 0`)
  for(let i=0;i<20;i++){g.sendInputEvent({type:'keyDown',keyCode:'Down'});g.sendInputEvent({type:'keyUp',keyCode:'Down'})}await delay(160)
  assert.ok(await read(`(()=>{let p=document.querySelector('#${id} .bootstrap-select.show'),r=p.querySelector('div.inner').getBoundingClientRect(),a=p.querySelector('li.active .dropdown-item')?.getBoundingClientRect();return !!a&&a.top>=r.top-1&&a.bottom<=r.bottom+1})()`),'virtualized arrow navigation stays in view');checks++
  fs.writeFileSync(path.join(output,'p1dark-113-'+id+'-picker.png'),(await g.capturePage()).toPNG())
  await g.insertText(id==='source-add-arrest'?'Treason':'Fixture charge 1');await delay(180);await key('Down');await key('Enter')
  assert.ok(await read(`!!document.querySelector('#${id} .chargeWrapper select').value`),'Dark filtered Enter selection');checks++
  await until(()=>read(`(()=>{let n=$('#${id} .chargeWrapper select').first().data('selectpicker');return n.options.virtualScroll===600&&!Object.hasOwn(n,'mdtVirtualScroll')&&!n.mdtFixedMenu})()`),'original picker options restored on close');checks++
  await read(`$('#${id}').modal('hide');void 0`);await delay(220)
 }
 await read(`$('#source-add-arrest').modal('show');document.querySelector('#source-add-arrest .bootstrap-select > button').click();void 0`);await delay(500)
 await shell(`setTheme('off')`);await delay(350)
 assert.ok(await read(`(()=>{let n=$('#source-add-arrest .chargeWrapper select').first().data('selectpicker');return n.options.virtualScroll===600&&!Object.hasOwn(n,'mdtVirtualScroll')&&!n.mdtFixedMenu&&!document.documentElement.classList.contains('mdt-p1dark')})()`),'Original restores native sizing/rendering while open');checks++
 await read(`$('#source-add-arrest').modal('hide');void 0`)
 checks+=await verifyRecordSurfaces({shell,guest,until,delay,themes:['p1dark']})
 fs.writeFileSync(path.join(output,'p1dark-113-paper.png'),(await(await guest()).capturePage()).toPNG())
 await shell(`setTheme('p1dark');showTab('depa')`)
 await until(()=>shell(`laws.depa.el.getURL().includes('/topic/')&&!laws.depa.el.isLoading()`),'dark law topic')
 await until(()=>shell(`laws.depa.el.executeJavaScript('!!document.getElementById("mdt-penal-skin")')`),'dark law stylesheet')
 const law=await shell(`laws.depa.el.executeJavaScript('getComputedStyle(document.body).backgroundColor')`)
 assert.equal(law,'rgb(34, 37, 41)','law topic matches PatrolOne Dark');checks++
 await shell(`showTab('mdc');wv.loadURL('https://ucp.gta.world/login')`)
 await until(async()=>!(await guest()).isLoading()&&(await guest()).getURL().includes('ucp.'),'unskinned authentication')
 assert.equal(await(await guest()).executeJavaScript(`document.documentElement.matches('.mdt-p1,.mdt-p1dark,.mdt-aero')`),false,'authentication stays native');checks++
 await win.loadFile(path.join(__dirname,'..','renderer/index.html'))
 await until(()=>shell(`view.theme==='p1dark'&&document.body.classList.contains('theme-p1dark')`),'persisted dark skin after shell reload');checks++
 console.log('PASS PatrolOne Dark menu/options/F8/persistence, record/forms, dynamic contrast, native virtualized picker input, Original restoration, paper documents, law topic and authentication')
 return checks
}
module.exports={recordPerformanceFixture,darkThemeFixture,profileRelease113,verifyRelease113,verifyEditorTyping}
