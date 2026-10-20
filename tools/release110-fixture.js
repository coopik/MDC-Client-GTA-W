const assert=require('assert/strict'),fs=require('fs'),path=require('path')
const contrast=(a,b)=>{const lum=c=>{const x=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4);return x[0]*.2126+x[1]*.7152+x[2]*.0722};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
async function verifyRelease110({shell,guest,until,delay,win,output}) {
 await shell(`dialogRoots.slice().forEach(closeDialog);setTheme('p1');wv.loadURL('https://mdc.gta.world/post-arrest')`)
 await until(async()=>!(await guest()).isLoading()&&await(await guest()).executeJavaScript('window.sourceReady===true'),'post arrest native source ready')
 const g=await guest(),read=s=>g.executeJavaScript(s,true)
 let checks=0
 for(const theme of ['p1','aero','aerolapd','aerodark']) {
  await shell(`setTheme('${theme}')`);await delay(350)
  const post=await read(`(()=>{const b=[...document.querySelectorAll('#warrant > .row > .text-right > .badge')].map(n=>n.getBoundingClientRect().toJSON()),cells=[...document.querySelectorAll('#PostArrestTable tbody th')].map(n=>({bg:getComputedStyle(n).backgroundColor,ink:getComputedStyle(n).color,image:getComputedStyle(n).backgroundImage,over:n.scrollWidth-n.clientWidth})),m=document.querySelector('#warrant .btn-collapse'),s=getComputedStyle(m,'::before');return {badges:b,cells,minus:{width:s.width,height:s.height,display:s.display}}})()`)
  assert.ok(post.badges.length===3&&post.badges.every(n=>Math.abs(n.width-post.badges[0].width)<1&&Math.abs(n.right-post.badges[0].right)<1)&&post.badges.slice(1).every((n,i)=>Math.abs(n.top-post.badges[i].bottom-4)<1),theme+' aligned status group '+JSON.stringify(post.badges));checks++
  assert.ok(post.cells.every(n=>n.image==='none'&&n.over<2&&contrast(n.ink,n.bg)>=4.5)&&post.minus.width==='8px'&&post.minus.height==='2px'&&post.minus.display==='block',theme+' readable data cells and visible collapse minus '+JSON.stringify(post));checks++
  await read(`document.querySelector('#PostArrestTable').scrollIntoView({block:'center'});void 0`);await delay(180)
  fs.writeFileSync(path.join(output,theme+'-110-post-arrest.png'),(await g.capturePage()).toPNG())
  win.setSize(1000,760);await delay(250)
  assert.ok(await read(`Array.from(document.querySelectorAll('#PostArrestTable th')).every(n=>n.scrollWidth<=n.clientWidth+1)`),theme+' narrow Post Arrest cells wrap');checks++
  win.setSize(1440,980);await delay(250)
  const before=await read(`document.querySelector('#warrant').getAttribute('style')`)
  await read(`document.querySelector('#copyWarrant').click();void 0`)
  await until(()=>read(`!!window.exportData||!!window.exportError`),theme+' native html2canvas export complete')
  const result=await read(`({error:window.exportError,clone:window.exportClone,data:window.exportData,live:document.querySelector('#warrant').getAttribute('style')})`)
  assert.equal(result.error,null,theme+' export error')
  const png=Buffer.from(result.data.split(',')[1],'base64'),height=png.readUInt32BE(20)
  assert.ok(result.clone.icons===8&&result.clone.fonts===0&&result.clone.skin===0&&result.clone.cell==='rgb(255, 255, 255)'&&result.live===before&&height/result.clone.scale>=result.clone.signatureBottom-2,theme+' complete white export, rasterized icons and unmodified live document '+JSON.stringify({...result,data:undefined,height}));checks++
  fs.writeFileSync(path.join(output,theme+'-110-submission-export.png'),png)
  for(const kind of ['video','link','image']) {
   await read(`$('#post-editor').summernote('${kind}Dialog.show');void 0`)
   await until(()=>read(`!!document.querySelector('.note-modal.show')&&!$('.note-modal.show').data('bs.modal')._isTransitioning`),kind+' editor dialog ready')
   const layout=await read(`(()=>{const m=document.querySelector('.note-modal.show'),h=m.querySelector('.modal-header').getBoundingClientRect(),x=m.querySelector('.close').getBoundingClientRect(),fields=[...m.querySelectorAll('input.form-control')].map(n=>n.getBoundingClientRect().height),b=m.querySelector('.modal-footer .note-btn');return {inside:x.top>=h.top&&x.bottom<=h.bottom,fields,bHeight:b.getBoundingClientRect().height,glyph:getComputedStyle(m.querySelector('.close'),'::before').width,disabled:b.disabled,bg:getComputedStyle(b).backgroundColor}})()`)
   assert.ok(layout.inside&&layout.fields.every(h=>h===30)&&layout.bHeight===28&&layout.glyph==='10px',theme+' '+kind+' compact dialog and titlebar close '+JSON.stringify(layout));checks++
   await read(`(()=>{let m=document.querySelector('.note-modal.show');m.querySelectorAll('input.form-control').forEach(n=>{n.value=n.classList.contains('note-link-text')?'Fixture link':'https://example.com/fixture';$(n).trigger('input').trigger('keyup')})})()`)
   await delay(350)
   const enabled=await read(`(()=>{let b=document.querySelector('.note-modal.show .modal-footer .note-btn');return {disabled:b.disabled,bg:getComputedStyle(b).backgroundColor,ink:getComputedStyle(b).color}})()`)
   assert.ok(!enabled.disabled&&contrast(enabled.ink,enabled.bg)>=4.5,theme+' '+kind+' enabled primary contrast '+JSON.stringify(enabled));checks++
   fs.writeFileSync(path.join(output,theme+'-110-'+kind+'-dialog.png'),(await g.capturePage()).toPNG())
   await read(`$('.note-modal.show').modal('hide');void 0`);await delay(180)
  }
  for(const id of ['post-editor','arrestReport','arrestWarrantNarrative']) {
   const modal=await read(`document.getElementById('${id}').closest('.modal')?.id||''`)
   if(modal){await read(`$('#${modal}').modal('show');void 0`);await delay(600)}
   const tools=await read(`(()=>{const editor=document.getElementById('${id}').nextElementSibling;return [...editor.querySelectorAll('.note-toolbar .note-btn-group > button,.note-toolbar .btn-group > button')].map(n=>({h:n.getBoundingClientRect().height,label:n.title||n.getAttribute('data-original-title')})).filter(n=>n.h>0)})()`)
   assert.ok(tools.length>10&&tools.every(n=>Math.abs(n.h-26)<.6),theme+' '+id+' equal toolbar heights '+JSON.stringify(tools));checks++
   if(modal){await read(`$('#${modal}').modal('hide');void 0`);await delay(180)}
  }
  await read(`document.querySelector('#fixture-warrant-filters').scrollIntoView({block:'center'});void 0`);await delay(250)
  const filters=await read(`Array.from(document.querySelectorAll('#fixture-warrant-filters button')).map(n=>({bg:getComputedStyle(n).backgroundColor,image:getComputedStyle(n).backgroundImage,ink:getComputedStyle(n).color,icon:getComputedStyle(n.querySelector('i')).color,height:n.getBoundingClientRect().height}))`)
  assert.ok(filters.length===2&&filters.every(n=>n.ink===n.icon&&n.height>=26&&n.image.includes('gradient')),theme+' search bar buttons and icons match '+JSON.stringify(filters));checks++
  fs.writeFileSync(path.join(output,theme+'-110-search-bar.png'),(await g.capturePage()).toPNG())
  console.log('PASS '+theme+' Post Arrest page/export, three editor dialogs, three editor toolbars and search bar')
 }
 return checks
}
module.exports={verifyRelease110}
