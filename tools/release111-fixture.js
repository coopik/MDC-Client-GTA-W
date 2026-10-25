const assert=require('assert/strict'),fs=require('fs'),path=require('path')
const {siteSourceFixture}=require('./site-source-fixture')
function release111Fixture() {
 const bars=['Active Warrants','Warrant search','Person Lookup','DMV Database','Incident Database','APB Database'].map((title,i)=>'<section class="card fixture-search"><h4>'+title+'</h4><div class="card-header card-header-dark"><input class="form-control d-inline-block" style="width:150px" placeholder="'+(i<2?'Suspect Name':i===3?'Plate':'Name / Search')+'"><input class="form-control d-inline-block" style="width:150px" placeholder="Filed By"><input class="form-control d-inline-block" style="width:150px" placeholder="Handled by"><button class="btn btn-secondary btn-actions"><i class="fas fa-search"></i>Search</button><button class="btn btn-secondary btn-actions"><i class="fas fa-eraser"></i>Clear Fields</button></div></section>').join('')
 const menu=fs.readFileSync(path.join(__dirname,'fixtures/warrant-menu.html'),'utf8')
 return siteSourceFixture(true).replace('<script src="/vendor/bootstrap.js"></script>','<script src="/vendor/popper.js"></script><script src="/site-vendor/bootstrap-material-design.min.js"></script>').replace('</head>','<script>$(function(){$("#fixture-file-warrant .dropdown-toggle").bmdRipples()})</script></head>').replace('<main class="content">','<main class="content">'+bars+'<section id="fixture-file-warrant" class="card">'+menu+'</section>')
}
async function verifyRelease111({shell,guest,until,delay,win,output}) {
 await shell(`dialogRoots.slice().forEach(closeDialog);setTheme('p1');wv.loadURL('https://mdc.gta.world/release111')`)
 await until(async()=>!(await guest()).isLoading()&&await(await guest()).executeJavaScript('window.sourceReady===true'),'release111 source ready')
 const g=await guest(),read=code=>g.executeJavaScript(code,true)
 let checks=0
 const click=async selector=>{const point=await read(`(()=>{let n=document.querySelector(${JSON.stringify(selector)});n.scrollIntoView({block:'nearest'});let r=n.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);g.focus();g.sendInputEvent({type:'mouseMove',...point});g.sendInputEvent({type:'mouseDown',...point,button:'left',clickCount:1});g.sendInputEvent({type:'mouseUp',...point,button:'left',clickCount:1});await delay(180)}
 const key=async keyCode=>{g.sendInputEvent({type:'keyDown',keyCode});g.sendInputEvent({type:'keyUp',keyCode});await delay(80)}
 for(const theme of ['p1','aero','aerolapd','aerodark']) {
  await shell(`setTheme('${theme}')`);await delay(300)
  const bars=await read(`Array.from(document.querySelectorAll('.fixture-search')).map(row=>Array.from(row.querySelectorAll('input,button')).map(n=>({r:n.getBoundingClientRect().toJSON(),font:getComputedStyle(n).fontSize,border:getComputedStyle(n).borderWidth,borderColor:getComputedStyle(n).borderColor})))`)
  assert.ok(bars.length===6&&bars.every(row=>row.every(n=>Math.abs(n.r.height-26)<.6&&Math.abs(n.r.top-row[0].r.top)<.6&&n.font===row[0].font&&n.border===row[0].border&&n.borderColor===row[0].borderColor)),theme+' shared search controls have equal height/baseline/font/border '+JSON.stringify(bars));checks++
  await read(`document.querySelector('.fixture-search').scrollIntoView({block:'start'});void 0`);await delay(200)
  fs.writeFileSync(path.join(output,theme+'-111-search-rows.png'),(await g.capturePage()).toPNG())
  await read(`document.querySelector('#fixture-file-warrant .dropdown-toggle').scrollIntoView({block:'center'});void 0`);await delay(150)
  const point=await read(`(()=>{let r=document.querySelector('#fixture-file-warrant .dropdown-toggle').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
  g.focus();g.sendInputEvent({type:'mouseMove',...point});g.sendInputEvent({type:'mouseDown',...point,button:'left',clickCount:1});await delay(300)
  const ripple=await read(`(()=>{let b=document.querySelector('#fixture-file-warrant .dropdown-toggle'),n=b.querySelector('.ripple-decorator'),s=getComputedStyle(b);return {opacity:n&&getComputedStyle(n).opacity,bg:s.backgroundColor,image:s.backgroundImage,ink:s.color}})()`)
  const surface=(ripple.image.match(/rgba?\([^)]+\)/)||[ripple.bg])[0],lum=value=>{const c=value.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722},contrast=(Math.max(lum(surface),lum(ripple.ink))+.05)/(Math.min(lum(surface),lum(ripple.ink))+.05)
  assert.ok(ripple.opacity!==null&&Number(ripple.opacity)<=.11&&contrast>=4.5,theme+' real Material ripple preserves readable palette button '+JSON.stringify(ripple));checks++
  g.sendInputEvent({type:'mouseUp',...point,button:'left',clickCount:1});await delay(250)
  assert.ok(await read(`document.querySelector('#fixture-file-warrant .dropdown-toggle').getAttribute('aria-expanded')==='true'`),theme+' File Warrant opens');checks++
  fs.writeFileSync(path.join(output,theme+'-111-file-warrant.png'),(await g.capturePage()).toPNG())
  await key('Escape');await read(`if(document.querySelector('#fixture-file-warrant .dropdown.show'))$('#fixture-file-warrant .dropdown-toggle').dropdown('toggle');void 0`)
  for(const id of ['source-add-arrest','modalAddArrestWarrant']) {
   await read(`$('#${id}').modal('show');void 0`)
   await until(()=>read(`document.querySelector('#${id}.show')&&!$('#${id}').data('bs.modal')._isTransitioning`),id+' shown');await delay(500)
   await read(`if(!document.querySelector('#${id} .chargeWrapper select'))$('#${id} .addCharge').click();void 0`);await delay(180)
   const count=await read(`document.querySelectorAll('#${id} .chargeWrapper .bootstrap-select').length`)
   for(let index=0;index<count;index++) {
    const base='#'+id+' .chargeWrapper .bootstrap-select:nth-of-type('+(index+1)+')'
    await read(`(()=>{let p=document.querySelectorAll('#${id} .chargeWrapper .bootstrap-select')[${index}];p.dataset.fixturePicker='current'})()`)
    await click('[data-fixture-picker=current] > button')
    await until(()=>read(`!!document.querySelector('[data-fixture-picker=current] div.inner[data-mdt-picker-list]')`),'fixed picker ready')
    await delay(400)
    const state=()=>read(`(()=>{let p=document.querySelector('[data-fixture-picker=current]'),m=p.querySelector('.dropdown-menu'),n=m.querySelector('div.inner'),input=m.querySelector('.bs-searchbox'),b=p.closest('.modal-body');return {h:m.getBoundingClientRect().height,inner:n.getBoundingClientRect().height,search:input?.getBoundingClientRect().top,top:n.scrollTop,body:b.scrollTop,page:document.scrollingElement.scrollTop,overflow:getComputedStyle(n).overflowY,bar:getComputedStyle(n,'::-webkit-scrollbar').width,gutter:n.offsetWidth-n.clientWidth}})()`)
    const first=await state()
    fs.writeFileSync(path.join(output,theme+'-111-'+id+'-picker-'+index+'.png'),(await g.capturePage()).toPNG())
    assert.ok(first.overflow==='auto'&&first.bar==='10px'&&first.gutter>=8,theme+' visible scrollbar gutter '+JSON.stringify(first));checks++
    await read(`window.fitCount=0;window.fitListener=e=>{if(e.detail!=='null')window.fitCount++};document.addEventListener('mdt:picker-fit',window.fitListener);void 0`)
    const p=await read(`(()=>{let r=document.querySelector('[data-fixture-picker=current] div.inner').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
    await read(`window.wheelLog=[];window.wheelTrace=e=>{let r={target:e.target.outerHTML.slice(0,220),x:e.clientX,y:e.clientY,delta:e.deltaY,ctrl:e.ctrlKey,cancelable:e.cancelable,skin:document.documentElement.className};window.wheelLog.push(r);setTimeout(()=>{r.prevented=e.defaultPrevented;r.body=document.querySelector('#${id} .modal-body').scrollTop},50)};window.addEventListener('wheel',window.wheelTrace,{capture:true});void 0`)
    assert.ok(await read(`!!document.elementFromPoint(${p.x},${p.y})?.closest('[data-fixture-picker=current]')`),theme+' wheel point hits the visible picker');checks++
    g.sendInputEvent({type:'mouseMove',...p});await delay(120)
    if(!g.debugger.isAttached())g.debugger.attach('1.3')
    for(const dy of [-160,-220,100,200,-120]){await g.debugger.sendCommand('Input.dispatchMouseEvent',{type:'mouseWheel',...p,deltaY:-dy,deltaX:0});await delay(110)}
    g.debugger.detach()
    await read(`window.dispatchEvent(new Event('scroll'));void 0`);await delay(100)
    const after=await state()
    assert.ok(await read(`window.wheelLog.length===5&&window.wheelLog.every(n=>n.cancelable&&n.prevented)`),theme+' native wheel stays cancelable and contained');checks++
    if(index===0){assert.ok(after.top>first.top,theme+' native wheel moves long list content');checks++}
    assert.ok(Math.abs(after.h-first.h)<.6&&Math.abs(after.inner-first.inner)<.6&&after.search===first.search&&Math.abs(after.body-first.body)<=1&&after.page===first.page,theme+' '+id+' picker '+index+' stable through bidirectional scrolling '+JSON.stringify({first,after,debug:await read(`({point:${JSON.stringify(p)},hit:document.elementFromPoint(${p.x},${p.y})?.outerHTML.slice(0,180),wheels:window.wheelLog})`)}));checks++
    assert.equal(await read('window.fitCount'),0,theme+' scroll never refits picker');checks++
    const search=await read(`!!document.querySelector('[data-fixture-picker=current] .bs-searchbox input')`)
    if(search){await click('[data-fixture-picker=current] .bs-searchbox input');await g.insertText(index===0?(id==='source-add-arrest'?'Treason':'Fixture charge 1'):'Offender');await delay(200);assert.ok(Math.abs((await state()).h-first.h)<.6,theme+' filtering retains fixed height');checks++;await key('Down');if(index===0){assert.ok(await read(`(()=>{let p=document.querySelector('[data-fixture-picker=current]'),n=p.querySelector('div.inner').getBoundingClientRect(),a=p.querySelector('li.active .dropdown-item')?.getBoundingClientRect();return !!a&&a.top>=n.top-1&&a.bottom<=n.bottom+1})()`),theme+' filtered keyboard highlight stays visible');checks++}await key('Escape')}
    else await key('Escape')
    await until(()=>read(`(()=>{let p=document.querySelector('[data-fixture-picker=current]');return !$(p.querySelector('select')).data('selectpicker').mdtFixedMenu&&!p.querySelector('[data-mdt-picker-list]')})()`),'native picker sizing restored after close');checks++
    await read(`window.removeEventListener('wheel',window.wheelTrace,{capture:true});document.removeEventListener('mdt:picker-fit',window.fitListener);document.querySelector('[data-fixture-picker=current]').removeAttribute('data-fixture-picker');void 0`)
   }
   await read(`$('#${id}').modal('hide');void 0`);await delay(180)
  }
  console.log('PASS '+theme+' matched search rows, native ripple, fixed picker height, search and isolated bidirectional wheel')
 }
 return checks
}
module.exports={release111Fixture,verifyRelease111}
