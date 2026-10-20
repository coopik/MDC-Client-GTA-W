"use strict"
const assert=require('assert/strict')
const {popupFixture}=require('./popup-fixture')
function scrollbarFixture() {
  return popupFixture().replace('class="main-panel"','class="main-panel ps-container ps-active-y" style="height:100vh"').replace('</main>','<div style="height:2000px">Long page content</div><div class="ps-scrollbar-y-rail"><div class="ps-scrollbar-y"></div></div></main>')
}
async function verifyScrollbars({shell,guest,until,delay,win}) {
  await shell(`actions.zoomreset();wv.loadURL('https://mdc.gta.world/scrollbars')`)
  await until(async()=>!(await guest()).isLoading()&&await (await guest()).executeJavaScript('window.popupReady===true'),'scrollbar fixture')
  const g=await guest(),read=code=>g.executeJavaScript(code,true)
  for(const theme of ['p1','aero','aerolapd','aerodark']) {
    await shell(`setTheme('${theme}')`);await delay(250)
    for(const sized of [false,true]) {
      if(sized) win.setSize(900,680)
      for(const dock of [false,true]) {
        if(dock) {await read(`$('#modalViewRecord').modal('show')`);await delay(350);await read(`document.querySelector('#modalViewRecord .mdt-minimize').click()`);await delay(250)}
        const s=await read(`(()=>{const p=document.querySelector('.main-panel'),r=p.getBoundingClientRect();return {overflow:getComputedStyle(p).overflowY,gutter:p.offsetWidth-p.clientWidth,range:p.scrollHeight-p.clientHeight,left:r.left,right:r.right,w:innerWidth,h:innerHeight,root:getComputedStyle(document.documentElement).overflowY,bar:getComputedStyle(p,'::-webkit-scrollbar').width}})()`)
        assert.equal(s.overflow,'auto',theme+': native panel scrolling')
        assert.ok(s.range>40&&s.gutter>=8&&s.gutter<=10&&s.right<=s.w+1,theme+': visible contained scrollbar '+JSON.stringify(s))
        assert.notEqual(s.root,'hidden',theme+': root scrolling not disabled')
        await until(()=>shell(`(()=>{const v=wv.getBoundingClientRect(),c=document.querySelector('.content').getBoundingClientRect();return Math.abs(v.width-c.width)<1&&Math.abs(v.height-c.height)<1})()`),'webview ResizeObserver settles')
        const host=await shell(`({v:wv.getBoundingClientRect().toJSON(),c:document.querySelector('.content').getBoundingClientRect().toJSON(),dock:document.querySelector('#record-dock').getBoundingClientRect().toJSON()})`)
        assert.ok(Math.abs(host.v.width-host.c.width)<1&&Math.abs(host.v.height-host.c.height)<1,theme+': webview fits content '+JSON.stringify(host))
        if(dock) assert.ok(host.v.bottom<=host.dock.top+1,theme+': dock does not cover bar')
        await read(`document.querySelector('.main-panel').scrollTop=0`)
        g.focus()
        g.sendInputEvent({type:'mouseWheel',x:Math.floor(s.right/2),y:120,deltaY:-120,deltaX:0,canScroll:true})
        await delay(150)
        assert.ok(await read(`document.querySelector('.main-panel').scrollTop>0`),theme+': native page still scrolls with wheel')
        if(dock) {await shell(`document.querySelector('.record-restore').click()`);await delay(220);await read(`$('#modalViewRecord').modal('hide')`);await delay(350)}
      }
    }
    win.setSize(1440,980);await delay(150)
    console.log('PASS '+theme+' native page scrollbar, visible gutter, wheel, dock hidden/visible and window resize')
  }
  return 16
}
module.exports={scrollbarFixture,verifyScrollbars}
