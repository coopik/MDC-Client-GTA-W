'use strict'

const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const {documentFixture} = require('./document-layout-fixture')

function popupFixture() {
  const viewer = fs.readFileSync(path.join(__dirname,'fixtures','record-view.html'),'utf8')
  return documentFixture().replace('</body>', viewer + `<script>
    document.getElementById('viewRecordID').textContent='123';
    document.getElementById('viewRecordSuspectName').textContent='Fixture Subject';
    document.getElementById('viewRecordReport').innerHTML=paperTemplate;
    const body=document.querySelector('#modalViewRecord .modal-body');
    body.style.setProperty('height','240px','important');body.style.setProperty('max-height','260px','important');
    $('#modalViewRecord').modal({show:false});window.popupReady=true;
  </script></body>`)
}

async function verifyPopups({shell,guest,until,delay,win,output}) {
  let checks = 0
  win.setSize(1440,1100)
  await until(()=>shell('innerWidth===1440&&innerHeight===1100'),'popup test window resized')
  await shell(`dialogRoots.slice().forEach(closeDialog);setTheme('off');showTab('mdc');wv.loadURL('https://mdc.gta.world/popup-fixture')`)
  await until(async()=>!(await guest()).isLoading()&&await (await guest()).executeJavaScript('window.popupReady===true'),'source record popup loaded')
  const g = await guest()
  const read = code=>g.executeJavaScript(code,true)
  const selector = '#modalViewRecord'
  const head = selector+' .modal-header'
  const body = selector+' .modal-body'
  const content = selector+' .modal-content'
  const native = await read(`(()=>{const n=document.querySelector('${body}');return ['height','max-height','overflow-y','flex','min-height'].map(p=>[p,n.style.getPropertyValue(p),n.style.getPropertyPriority(p)])})()`)
  const drag = async(contents,execute,css,dx,dy,corner=false)=>{
    const point=await execute(`(()=>{const r=document.querySelector(${JSON.stringify(css)}).getBoundingClientRect();return {x:Math.round(corner?r.right-4:r.left+60),y:Math.round(corner?r.bottom-4:r.top+r.height/2)}})()`.replace(/corner/g,String(corner)))
    contents.sendInputEvent({type:'mouseMove',...point})
    contents.sendInputEvent({type:'mouseDown',...point,button:'left',clickCount:1})
    for(let i=1;i<=5;i++) {
      contents.sendInputEvent({type:'mouseMove',x:point.x+Math.round(dx*i/5),y:point.y+Math.round(dy*i/5),movementX:dx/5,movementY:dy/5})
      await delay(25)
    }
    contents.sendInputEvent({type:'mouseUp',x:point.x+Math.round(dx),y:point.y+Math.round(dy),button:'left',clickCount:1})
    await delay(350)
  }
  const moveTo = async(contents,execute,css,left,top)=>{
    const r=await execute(`(()=>{const r=document.querySelector(${JSON.stringify(css)}).getBoundingClientRect();return {left:r.left,top:r.top}})()`)
    await drag(contents,execute,css,left-r.left,top-r.top)
  }
  const click = async(contents,execute,css,count=1)=>{
    const point=await execute(`(()=>{const r=document.querySelector(${JSON.stringify(css)}).getBoundingClientRect();return {x:Math.round(r.left+Math.min(60,r.width/2)),y:Math.round(r.top+r.height/2)}})()`)
    contents.sendInputEvent({type:'mouseMove',...point})
    contents.sendInputEvent({type:'mouseDown',...point,button:'left',clickCount:count})
    contents.sendInputEvent({type:'mouseUp',...point,button:'left',clickCount:count})
    await delay(400)
  }
  const geometry = (execute,css)=>execute(`(()=>{const r=document.querySelector(${JSON.stringify(css)}).getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height}})()`)
  const same = (a,b,label)=>assert.ok(Object.keys(a).every(k=>Math.abs(a[k]-b[k])<2),label+JSON.stringify({a,b}))
  const fit = async()=>{
    const result=await read(`(()=>{const n=document.querySelector('${content}'),b=document.querySelector('${body}'),h=document.querySelector('${head}'),r=n.getBoundingClientRect(),s=getComputedStyle(n),br=b.getBoundingClientRect(),hr=h.getBoundingClientRect(),f=n.querySelector('.modal-footer'),fr=f&&f.getBoundingClientRect(),bs=getComputedStyle(b);return {height:r.height,bodyHeight:br.height,gap:r.bottom-parseFloat(s.borderBottomWidth)-(fr?fr.height:0)-br.bottom,headGap:br.top-hr.bottom,overflow:bs.overflowY,scroll:b.scrollHeight>b.clientHeight+10,max:bs.maxHeight,fixed:bs.height,font:getComputedStyle(n.querySelector('[data-mdt-paper]')).fontFamily}})()`)
    assert.ok(Math.abs(result.gap)<2&&Math.abs(result.headGap)<2,'existing report body fills frame without a bottom gap '+JSON.stringify(result))
    assert.ok(result.bodyHeight>100&&result.scroll&&result.overflow==='auto'&&result.max==='none','existing native scroller fills the resized area '+JSON.stringify(result))
    assert.ok(result.font.includes('Times New Roman'),'paper document remains serif')
    return result
  }
  for(const theme of ['p1','aero','aerolapd','aerodark']) {
    await shell(`setTheme('${theme}')`)
    await read(`$('#modalViewRecord').modal('show')`)
    await until(()=>read(`document.querySelector('${selector}.show')&&!$('#modalViewRecord').data('bs.modal')._isTransitioning&&!!document.querySelector('${selector} .mdt-grip')`),'native record shown')
    await read(`(()=>{const n=document.querySelector('${head} .modal-title');window.savedRecordTitle=n.firstChild.textContent;n.firstChild.replaceWith(document.createTextNode('Other Tool'))})()`)
    await until(()=>read(`!document.querySelector('${head} .mdt-maximize')`),'non-record title loses maximize')
    await click(g,read,head,2)
    assert.ok(await read(`!document.querySelector('${selector} [data-mdt-maximized]')`),theme+': other MDC tools cannot maximize')
    await read(`document.querySelector('${head} .modal-title').firstChild.replaceWith(document.createTextNode(savedRecordTitle))`)
    await until(()=>read(`!!document.querySelector('${head} .mdt-maximize')`),'View Record regains maximize')
    const controls=await read(`Array.from(document.querySelector('${head}').querySelectorAll('.close,.mdt-maximize')).map(n=>{const r=n.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top}})`)
    assert.ok(controls.length===2&&Math.abs(controls[0].width-controls[1].width)<.1&&Math.abs(controls[0].height-controls[1].height)<.1&&Math.abs(controls[0].top-controls[1].top)<.1,theme+': matched title controls '+JSON.stringify(controls))
    win.setSize(320,1100)
    await until(()=>shell('innerWidth').then(n=>n===320),'smallest record window')
    await delay(400)
    assert.ok(await read(`(()=>{const h=document.querySelector('${head}').getBoundingClientRect();return Array.from(document.querySelector('${head}').querySelectorAll('.close,.mdt-maximize')).every(n=>{const r=n.getBoundingClientRect();return r.left>=h.left&&r.right<=h.right&&r.top>=h.top&&r.bottom<=h.bottom})})()`),theme+': title controls fit at 320px')
    win.setSize(1440,1100)
    await until(()=>shell('innerWidth').then(n=>n===1440),'restore record window')
    await delay(400)
    const initial=await geometry(read,content)
    await click(g,read,head+' .mdt-maximize')
    same(await geometry(read,content),await read('({left:0,top:0,width:innerWidth,height:innerHeight})'),theme+': maximize fills MDC viewport')
    const closeBounds=await read(`(()=>{const m=document.querySelector('${selector}'),c=m.querySelector('.close'),r=c.getBoundingClientRect();return {right:r.right,clipRight:m.clientWidth,hit:!!document.elementFromPoint(r.right-1,r.top+r.height/2)?.closest('.close')}})()`)
    assert.ok(closeBounds.hit&&closeBounds.right<=closeBounds.clipRight+1,theme+': whole close button remains visible '+JSON.stringify(closeBounds))
    await fit()
    await click(g,read,head+' .mdt-maximize')
    same(await geometry(read,content),initial,theme+': initial maximize restores geometry')
    await moveTo(g,read,head,40,40)
    const original=await read(`document.querySelector('${content}').getBoundingClientRect().height`)
    await drag(g,read,content,80,180,true)
    const grown=await fit()
    assert.ok(grown.height>original+120,theme+': record grows')
    await drag(g,read,content,-40,-120,true)
    const shrunk=await fit()
    assert.ok(shrunk.height<grown.height-90,theme+': record shrinks')
    await moveTo(g,read,head,100,70)
    await drag(g,read,content,20,55,true)
    await fit()
    await read(`document.querySelector('${body}').style.setProperty('max-height','90px','important');document.querySelector('${body}').style.setProperty('height','90px','important')`)
    await until(()=>read(`document.querySelector('${body}').style.maxHeight==='none'&&document.querySelector('${body}').style.height==='auto'`),'native late height write reconciled')
    await fit()
    const wheel=await read(`(()=>{const n=document.querySelector('${body}');n.scrollTop=0;const r=n.getBoundingClientRect();return {x:Math.round(r.x+100),y:Math.round(r.y+80)}})()`)
    await read(`window.lastWheel=null;document.addEventListener('wheel',e=>{window.lastWheel={delta:e.deltaY,target:e.target.tagName,content:!!e.target.closest('.modal-content'),cancelled:e.defaultPrevented}},{once:true,capture:true})`)
    g.sendInputEvent({type:'mouseMove',...wheel})
    g.sendInputEvent({type:'mouseWheel',...wheel,deltaX:0,deltaY:-180,canScroll:true})
    await until(()=>read(`document.querySelector('${body}').scrollTop>0`),theme+': resized wheel delivered')
    assert.ok(await read(`document.querySelector('${body}').scrollTop>0`),theme+': resized report actually scrolls '+JSON.stringify(await read(`(()=>{let b=document.querySelector('${body}'),hit=document.elementFromPoint(${wheel.x},${wheel.y});return {wheel:window.lastWheel,top:b.scrollTop,height:b.clientHeight,scroll:b.scrollHeight,overflow:getComputedStyle(b).overflowY,hit:hit?.outerHTML.slice(0,300),rect:b.getBoundingClientRect().toJSON()}})()`)))
    fs.writeFileSync(path.join(output,theme+'-record-resized.png'),(await win.webContents.capturePage()).toPNG())
    await read(`document.querySelector('${selector} .modal-dialog').classList.add('modal-dialog-centered')`)
    await read(`document.querySelector('.main-panel').style.minHeight='2400px';document.querySelectorAll('.main-panel, .content').forEach(n=>n.scrollTop=180);window.scrollTo(0,180)`)
    for(const edge of ['top','left','right','bottom']) {
      const bounds=await read(`(()=>{const r=document.querySelector('${head}').getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height,w:innerWidth,h:innerHeight}})()`)
      const left=edge==='left'?0:edge==='right'?bounds.w-bounds.width:Math.max(0,bounds.left)
      const top=edge==='top'?0:edge==='bottom'?bounds.h-bounds.height:Math.max(0,bounds.top)
      await moveTo(g,read,head,left,top)
      const after=await read(`(()=>{const r=document.querySelector('${head}').getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight}})()`)
      if(edge==='top') {
        const viewport=await shell(`(()=>{const r=wv.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height}})()`)
        console.log('POPUP BOUNDS '+JSON.stringify({theme,popup:after,webview:viewport}))
        if(theme==='aero'&&process.argv.includes('--inspect-popups')) {
          console.log('READY FOR ELECTRON MCP: set window.finishPopupInspection=true in the shell to resume')
          while(!(await shell('window.finishPopupInspection===true'))) await delay(500)
          return checks + 1
        }
      }
      assert.ok(Math.abs(after.left-left)<2&&Math.abs(after.top-top)<2,theme+': visible title reaches '+edge+' edge '+JSON.stringify({left,top,after}))
      assert.ok(after.left>=-1&&after.top>=-1&&after.right<=after.w+1&&after.bottom<=after.h+1,theme+': whole title stays reachable')
    }
    await moveTo(g,read,head,60,30)
    const resized=await geometry(read,content)
    await click(g,read,head,2)
    same(await geometry(read,content),await read('({left:0,top:0,width:innerWidth,height:innerHeight})'),theme+': double-click maximizes resized/scrolled popup')
    await fit()
    fs.writeFileSync(path.join(output,theme+'-record-maximized.png'),(await win.webContents.capturePage()).toPNG())
    await click(g,read,head,2)
    same(await geometry(read,content),resized,theme+': double-click restores resized/scrolled popup')
    await read(`$('#modalViewRecord').modal('hide')`)
    await delay(220)
    assert.deepEqual(await read(`(()=>{const n=document.querySelector('${body}');return ['height','max-height','overflow-y','flex','min-height'].map(p=>[p,n.style.getPropertyValue(p),n.style.getPropertyPriority(p)])})()`),native,theme+': close restores exact native body dimensions and priorities')
    await read(`document.querySelector('${selector} .modal-dialog').classList.remove('modal-dialog-centered')`)
    checks++
  }
  for(const theme of ['p1','aero','aerolapd','aerodark','off']) {
    await shell(`setTheme('${theme}')`)
    for(const action of ['options','keyhelp','about']) {
      await shell(`actions.${action}()`)
      assert.equal(await shell(`document.querySelectorAll('.dialog-maximize').length`),0,theme+': '+action+' has no maximize control')
      const root=await shell('backdrop.id')
      const before=await geometry(shell,'#'+root+' .dialog')
      await click(win.webContents,shell,'#'+root+' .dialog-title',2)
      same(await geometry(shell,'#'+root+' .dialog'),before,theme+': '+action+' double-click leaves geometry')
      await shell(`closeDialog()`)
    }
    for(const action of ['namecheck','platecheck','history']) {
      await shell(`actions.${action}()`)
      const current=await shell(`backdrop.id`)
      const title='#'+current+' .dialog-title'
      const dialog='#'+current+' .dialog'
      if(action!=='history') {
        for(const width of [1440,320]) {
          win.setSize(width,1100)
          await until(()=>shell('innerWidth').then(n=>n===width),'lookup width')
          await delay(100)
          const row=await shell(`(()=>{const input=document.querySelector('${dialog} .fld').getBoundingClientRect(),button=document.querySelector('${dialog} .hist-tools button').getBoundingClientRect(),parent=document.querySelector('${dialog} .hist-tools').getBoundingClientRect();return {input:{height:input.height,top:input.top,width:input.width},button:{height:button.height,top:button.top,width:button.width,right:button.right},right:parent.right}})()`)
          assert.ok(Math.abs(row.input.height-row.button.height)<1&&Math.abs(row.input.top-row.button.top)<1&&row.button.width<75&&row.input.width>80&&row.button.right<=row.right+1,theme+': compact aligned lookup at '+width+' '+JSON.stringify(row))
        }
        win.setSize(1440,1100)
        await delay(100)
      }
      if(action!=='history') {
        assert.ok(await shell(`document.querySelector('${dialog}').classList.contains('fixed-size')&&!document.querySelector('${dialog} .dialog-maximize')`),theme+': lookup has no maximize or resize');
        await shell(`closeDialog()`);continue
      }
      await moveTo(win.webContents,shell,title,80,80)
      const before=await shell(`document.querySelector('${dialog}').getBoundingClientRect().height`)
      await drag(win.webContents,shell,dialog,40,100,true)
      const state=await shell(`(()=>{const n=document.querySelector('${dialog}'),b=n.querySelector('.dialog-body'),h=n.querySelector('.dialog-title'),f=n.querySelector('.dialog-buttons'),r=n.getBoundingClientRect();return {height:r.height,gap:f.getBoundingClientRect().top-b.getBoundingClientRect().bottom,top:b.getBoundingClientRect().top-h.getBoundingClientRect().bottom}})()`)
      assert.ok(state.height>before+75&&Math.abs(state.gap)<2&&Math.abs(state.top)<2,theme+': '+action+' body grows with its frame '+JSON.stringify(state))
      await drag(win.webContents,shell,dialog,-20,-60,true)
      assert.ok(await shell(`document.querySelector('${dialog}').getBoundingClientRect().height`)<state.height-45,theme+': client dialog shrinks')
      const restored=await geometry(shell,dialog)
      await click(win.webContents,shell,title,2)
      same(await geometry(shell,dialog),restored,theme+': client title double-click cannot maximize')
      assert.equal(await shell(`document.querySelectorAll('.dialog-maximize').length`),0,'client tools have only close')
      for(const edge of ['top','left','right','bottom']) {
        const bounds=await shell(`(()=>{const r=document.querySelector('${title}').getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height,w:innerWidth,h:innerHeight}})()`)
        const left=edge==='left'?0:edge==='right'?bounds.w-bounds.width:Math.max(0,bounds.left)
        const top=edge==='top'?0:edge==='bottom'?bounds.h-bounds.height:Math.max(0,bounds.top)
        await moveTo(win.webContents,shell,title,left,top)
        const after=await shell(`(()=>{const r=document.querySelector('${title}').getBoundingClientRect();return {left:r.left,top:r.top}})()`)
        assert.ok(Math.abs(after.left-left)<2&&Math.abs(after.top-top)<2,theme+': '+action+' reaches '+edge+' '+JSON.stringify({left,top,after}))
      }
      await shell(`closeDialog()`)
    }
    checks++
  }
  await shell(`dialogRoots.slice().forEach(closeDialog);wv.loadURL('https://mdc.gta.world/review-fixes')`)
  await until(async()=>!(await guest()).isLoading()&&await (await guest()).executeJavaScript('window.popupReady===true'),'exact person source loaded')
  const exact=await guest()
  for(const theme of ['p1','aero','aerolapd','aerodark']) {
    await shell(`setTheme('${theme}')`)
    await delay(220)
    const result=await exact.executeJavaScript(`(()=>{const lines=Array.from(document.querySelectorAll('.card-profile hr.style-hr-no-divider')),rows=Array.from(document.querySelectorAll('#profile-element-vehicles > span > .row'));return {hidden:lines.length===2&&lines.every(n=>!n.getClientRects().length),contained:rows.length===4&&rows.every(n=>{const r=n.getBoundingClientRect(),c=n.closest('.card').getBoundingClientRect();return r.left>=c.left&&r.right<=c.right}),phone:!!document.querySelector('#profile-element-phones hr').getClientRects().length,carets:Array.from(document.querySelectorAll('#review-editor + .note-editor .dropdown-toggle')).map(b=>{const r=b.getBoundingClientRect();b.click();const next=b.getBoundingClientRect(),transform=getComputedStyle(b,'::after').transform;document.body.click();return {shift:next.left-r.left,resize:next.width-r.width,transform}})}})()`)
    const badges=await exact.executeJavaScript(`Array.from(document.querySelectorAll('#badge-menu-review .dropdown-item')).map(n=>{const b=n.querySelector('.badge'),r=b.getBoundingClientRect(),s=getComputedStyle(b);return {left:r.left,height:r.height,font:s.fontSize,weight:s.fontWeight,broken:!!n.querySelector('[data-mdt-banner],[data-mdt-deframed]')}})`)
    assert.ok(badges.length===4&&badges.every(b=>Math.abs(b.left-badges[0].left)<.1&&Math.abs(b.height-badges[0].height)<.1&&b.font===badges[0].font&&b.weight===badges[0].weight&&!b.broken),theme+': consistent badge menu column '+JSON.stringify(badges))
    assert.ok(result.hidden&&result.contained&&result.phone,theme+': exact-source dividers '+JSON.stringify(result))
    assert.ok(result.carets.length>=5&&result.carets.every(n=>Math.abs(n.shift)<.1&&Math.abs(n.resize)<.1&&n.transform==='none'),theme+': stable toolbar toggles '+JSON.stringify(result))
    checks++
  }
  await shell(`setTheme('off')`)
  assert.equal(await read(`document.querySelectorAll('[data-mdt-sized],[data-mdt-offset]').length`),0,'Original MDC has no resize or move state')
  console.log('PASS report body growth/shrink/restoration, native late height updates and title-bar edge access for MDC/client popups across skins')
  return checks
}

module.exports={popupFixture,verifyPopups}
