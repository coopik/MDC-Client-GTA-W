const assert=require('assert/strict'),fs=require('fs'),path=require('path')
async function verifyModalForms({shell,guest,until,delay,win,output,colors=false}) {
 await shell(`dialogRoots.slice().forEach(closeDialog);setTheme('p1');wv.loadURL('https://mdc.gta.world/source-markup')`)
 await until(async()=>!(await guest()).isLoading()&&await(await guest()).executeJavaScript('window.sourceReady===true'),'modal source fixture')
 const g=await guest(),read=s=>g.executeJavaScript(s,true)
 let checks=0
 const contrast=(a,b)=>{const lum=c=>{const rgb=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
 const scroll=async(id,label)=>{
  const r=await read(`(()=>{const b=document.querySelector('#${id} .modal-body'),p=document.querySelector('.main-panel');b.scrollTop=0;const before=p.scrollTop;b.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:140}));return {height:b.clientHeight,scroll:b.scrollHeight,moved:b.scrollTop,page:p.scrollTop-before,overflow:getComputedStyle(b).overflowY,bar:parseFloat(getComputedStyle(b,'::-webkit-scrollbar').width),gutter:b.offsetWidth-b.clientWidth}})()`)
  assert.ok(r.scroll>r.height&&r.moved>100&&r.page===0&&r.overflow==='auto'&&r.bar>0&&r.gutter>0,label+JSON.stringify(r));checks++
 }
 for(const theme of ['p1','aero','aerolapd','aerodark']) {
  await shell(`setTheme('${theme}')`);await delay(200)
  for(const id of ['modalAddArrestWarrant','source-add-arrest']) {
   await read(`$('#${id}').modal('show');void 0`)
   await until(()=>read(`document.querySelector('#${id}.show')&&!$('#${id}').data('bs.modal')._isTransitioning`),id+' shown')
   await scroll(id,theme+' '+id+' native PS scrolling ')
   if(id==='source-add-arrest') {
    await read(`if(!document.querySelector('#${id} .chargeWrapper select'))$('#${id} .addCharge').click();void 0`);await delay(200)
    const metrics=await read(`(()=>{const m=document.querySelector('#${id}'),row=m.querySelector('.chargeWrapper .form-group.row'),rr=row.getBoundingClientRect(),minus=row.querySelector('.remove_button').getBoundingClientRect();return {actions:[...m.querySelectorAll('.modal-body>.row:first-child .btn,.penalCode,.addCharge')].map(n=>({h:n.getBoundingClientRect().height,w:n.getBoundingClientRect().width,display:getComputedStyle(n).display})),groups:[...row.querySelectorAll('.input-group')].map(n=>{const a=n.querySelector('.input-group-text').getBoundingClientRect(),b=n.querySelector('.bootstrap-select>.btn').getBoundingClientRect();return {gap:b.left-a.right,dy:b.top-a.top,dh:b.height-a.height}}),minus:{width:minus.width,height:minus.height,inside:minus.right<=rr.right+1},rowDisplay:getComputedStyle(row).display}})()`)
    assert.ok(metrics.actions.every(n=>n.h<=30&&n.w<180)&&metrics.groups.every(n=>Math.abs(n.gap)<1.1&&Math.abs(n.dy)<1&&Math.abs(n.dh)<1)&&metrics.minus.width<=28&&metrics.minus.inside&&metrics.rowDisplay==='flex',theme+' compact native form without re-layout '+JSON.stringify(metrics));checks++
    await read(`document.querySelector('#${id} .modal-body').scrollTop=0;void 0`)
    fs.writeFileSync(path.join(output,theme+'-arrest-controls.png'),(await g.capturePage()).toPNG())
    if(colors) {
     await read(`document.querySelector('#${id} .chargeWrapper').scrollIntoView({block:'center'});void 0`)
     for(let index=0;index<3;index++) {
      await read(`(()=>{const picker=document.querySelectorAll('#${id} .chargeWrapper .bootstrap-select')[${index}];if(${index}===2){[...picker.querySelector('select').options].forEach(n=>n.disabled=false);$(picker.querySelector('select')).selectpicker('refresh')}picker.querySelector('.dropdown-toggle').click()})()`)
      await delay(200)
      if(index===0) {
       await read(`document.querySelector('#${id} .chargeWrapper .bs-searchbox input').focus()`);await g.insertText('Treason');await delay(250)
       const field=await read(`(()=>{const n=document.querySelector('#${id} .chargeWrapper .bs-searchbox input'),s=getComputedStyle(n);return {value:n.value,color:s.color,fill:s.webkitTextFillColor,bg:s.backgroundColor,border:s.borderTopWidth,placeholder:n.placeholder}})()`)
       assert.ok(field.value==='Treason'&&field.placeholder&&field.fill===field.color&&contrast(field.color,field.bg)>=4.5&&parseFloat(field.border)>0,theme+' readable typed search '+JSON.stringify(field));checks++
      }
      const point=await read(`(()=>{const p=document.querySelectorAll('#${id} .chargeWrapper .bootstrap-select')[${index}],a=p.querySelector('.dropdown-menu .dropdown-item:not(.disabled)'),r=a.getBoundingClientRect();a.classList.add('active');return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
      g.sendInputEvent({type:'mouseMove',...point});await delay(150)
      const row=await read(`(()=>{const p=document.querySelectorAll('#${id} .chargeWrapper .bootstrap-select')[${index}],n=p.querySelector('.dropdown-item.active'),s=getComputedStyle(n),t=getComputedStyle(n.querySelector('.text'));return {color:t.color,fill:t.webkitTextFillColor,bg:s.backgroundColor}})()`)
      assert.ok(row.fill===row.color&&contrast(row.color,row.bg)>=4.5,theme+' readable hovered/selected '+index+' '+JSON.stringify(row));checks++
      if(index===0)fs.writeFileSync(path.join(output,theme+'-search-contrast.png'),(await g.capturePage()).toPNG())
      await read(`document.querySelectorAll('#${id} .chargeWrapper .bootstrap-select > .dropdown-toggle')[${index}].click();void 0`)
     }
    }

   }
   await read(`$('#${id}').modal('hide');void 0`);await delay(220)
  }
  await read(`$('#modalAddArrestWarrant').modal('show');void 0`);await delay(220)
  const point=await read(`(()=>{let r=document.querySelector('#modalAddArrestWarrant > .modal-dialog > .modal-content > .mdt-grip').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
  g.sendInputEvent({type:'mouseDown',...point,button:'left',clickCount:1});g.sendInputEvent({type:'mouseMove',x:point.x-50,y:point.y-70,movementX:-50,movementY:-70});g.sendInputEvent({type:'mouseUp',x:point.x-50,y:point.y-70,button:'left',clickCount:1});await delay(220)
  await scroll('modalAddArrestWarrant',theme+' resized warrant scroll ')
  await read(`$('#modalAddArrestWarrant').modal('hide');void 0`);await delay(220)
  console.log('PASS '+theme+' shared native modal scrolling, compact controls and joined input groups')
 }
 await shell(`setTheme('p1')`)
 await read(`$('#source-add-arrest').modal('show');void 0`);await delay(220)
 win.setSize(1000,850);await delay(300)
 const narrow=await read(`(()=>{const row=document.querySelector('#source-add-arrest .chargeWrapper .form-group.row'),r=row.getBoundingClientRect(),b=row.querySelector('.remove_button').getBoundingClientRect();return {inside:b.left>=r.left&&b.right<=r.right+1,width:b.width,height:b.height}})()`)
 assert.ok(narrow.inside&&narrow.width<=28&&narrow.height===30,'narrow native grid contains remove '+JSON.stringify(narrow));checks++
 await scroll('source-add-arrest','narrow arrest scroll ')
 await read(`$('#source-add-arrest').modal('hide');document.body.insertAdjacentHTML('beforeend','<div class="modal" id="short-form"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Short form</h5></div><div class="modal-body modal-scroll ps-container"><p>Short content</p></div></div></div></div>');$('#short-form').modal('show');void 0`);await delay(250)
 const short=await read(`(()=>{let b=document.querySelector('#short-form .modal-body'),p=document.querySelector('.main-panel'),before=p.scrollTop;b.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:180}));return {height:b.clientHeight,scroll:b.scrollHeight,overflow:getComputedStyle(b).overflowY,page:p.scrollTop-before}})()`)
 assert.ok(short.height===short.scroll&&short.overflow==='auto'&&short.page===0,'short modal has no artificial scrolling or page leak '+JSON.stringify(short));checks++
 await read(`$('#short-form').modal('hide');void 0`);await delay(220)
 win.setSize(1440,980)
 return checks
}
module.exports={verifyModalForms}

