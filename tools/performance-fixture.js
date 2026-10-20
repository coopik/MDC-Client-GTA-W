'use strict'

const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')

function performanceFixture(base) {
  const rows = Array.from({length:200},(_,row)=>'<tr>'+Array.from({length:5},(_,column)=>'<td><span>Record '+row+' field '+column+'</span><small>Filed by Officer '+row+'</small></td>').join('')+'</tr>').join('')
  return base.replace('</body>','<section class="main-panel"><div class="content"><section class="card"><div class="card-header">Recent reports</div><div class="card-body"><table class="table">'+rows+'</table></div></section></div></section></body>').replace('<nav class="navbar">','<nav class="navbar"><span id="performance-clock">12:00:00</span>')
}

async function verifyPerformance({shell,guest,until,delay,output,baseline}) {
  await shell(`setTheme('p1'); wv.loadURL('https://mdc.gta.world/performance')`)
  await until(async()=>!(await guest()).isLoading()&&await (await guest()).executeJavaScript(`!!document.getElementById('performance-clock')`),'performance fixture')
  const g=await guest()
  await delay(1500)
  g.debugger.attach('1.3')
  try {
    await g.debugger.sendCommand('Performance.enable')
    await g.debugger.sendCommand('Profiler.enable')
    await g.debugger.sendCommand('Profiler.start')
    const before=await g.debugger.sendCommand('Performance.getMetrics')
    await g.executeJavaScript(`window.clockTicks=0;window.clockTimer=setInterval(()=>{document.getElementById('performance-clock').textContent='12:00:'+String(++clockTicks).padStart(2,'0')},300)`)
    await delay(4000)
    await g.executeJavaScript(`clearInterval(clockTimer)`)
    const after=await g.debugger.sendCommand('Performance.getMetrics')
    const {profile}=await g.debugger.sendCommand('Profiler.stop')
    const values=Object.fromEntries(after.metrics.map(item=>[item.name,item.value-(before.metrics.find(old=>old.name===item.name)?.value||0)]))
    const nodes=new Map(profile.nodes.map(node=>[node.id,node]))
    const preloadNames=new Set(Array.from(fs.readFileSync(path.join(__dirname,'..','webview-preload.js'),'utf8').matchAll(/function (\w+)\(/g),match=>match[1]))
    const self={}
    profile.samples.forEach((id,index)=>{const frame=nodes.get(id).callFrame;if(!/webview-preload|forum-preload/.test(frame.url)&&!preloadNames.has(frame.functionName))return;const name=frame.functionName||'(anonymous)';self[name]=(self[name]||0)+(profile.timeDeltas[index]||0)/1000})
    const result={clockTicks:await g.executeJavaScript('clockTicks'),scriptMs:values.ScriptDuration*1000,layoutMs:values.LayoutDuration*1000,recalcMs:values.RecalcStyleDuration*1000,taskMs:values.TaskDuration*1000,topPreloadFunctions:Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,12)}
    const label=baseline?'before':'after'
    fs.writeFileSync(path.join(output,'performance-'+label+'.json'),JSON.stringify(result,null,2))
    fs.writeFileSync(path.join(output,'performance-'+label+'.cpuprofile'),JSON.stringify(profile))
    assert.ok(result.clockTicks>=10,'site clock continues updating during styling')
    if (!baseline) assert.ok(result.scriptMs<200,'clock-only updates avoid repeated whole-page scans: '+result.scriptMs+'ms')
    if (!baseline) {
      const start=await g.debugger.sendCommand('Performance.getMetrics')
      await g.executeJavaScript(`window.clockTimer=setInterval(()=>{document.getElementById('performance-clock').innerHTML='<span>12:30:'+String(++clockTicks).padStart(2,'0')+'</span>';const button=document.querySelector('.btn-primary');button.classList.toggle('hover');},100)`)
      await delay(2000)
      await g.executeJavaScript(`clearInterval(clockTimer)`)
      const end=await g.debugger.sendCommand('Performance.getMetrics')
      const elapsed=(end.metrics.find(item=>item.name==='ScriptDuration').value-start.metrics.find(item=>item.name==='ScriptDuration').value)*1000
      assert.ok(elapsed<200,'wrapped clock and hover updates avoid whole-page rescans: '+elapsed+'ms')
      console.log('PERFORMANCE wrapped-clock/hover '+elapsed.toFixed(3)+'ms script time')
      const contrastStart=await g.debugger.sendCommand('Performance.getMetrics')
      await g.executeJavaScript(`(() => {const card=document.createElement('section');card.className='card';card.id='contrast-workload';card.innerHTML='<div class="card-body">'+Array.from({length:150},(_,i)=>'<p><span style="color:#eeeeee">Low contrast label '+i+'</span></p>').join('')+'</div>';document.querySelector('.content').appendChild(card)})()`)
      await until(()=>g.executeJavaScript(`document.querySelectorAll('#contrast-workload span[data-mdt-ink]').length===150`),'batched contrast repairs')
      await delay(250)
      const contrastEnd=await g.debugger.sendCommand('Performance.getMetrics')
      const delta=(name)=>contrastEnd.metrics.find(item=>item.name===name).value-contrastStart.metrics.find(item=>item.name===name).value
      result.contrastRecalculations=delta('RecalcStyleCount')
      result.contrastRecalcMs=delta('RecalcStyleDuration')*1000
      assert.ok(result.contrastRecalculations<80,'contrast repairs batch style reads before writes: '+result.contrastRecalculations+' recalculations')
      assert.ok(await g.executeJavaScript(`Array.from(document.querySelectorAll('#contrast-workload span')).every(n=>getComputedStyle(n).color==='rgb(32, 32, 32)')`),'batched contrast repairs retain readable text')
      fs.writeFileSync(path.join(output,'performance-'+label+'.json'),JSON.stringify(result,null,2))
      console.log('PERFORMANCE 150 contrast repairs: '+result.contrastRecalculations+' style recalculations')
    }

    console.log('PERFORMANCE '+label+' '+JSON.stringify(result))
    return 1
  } finally {g.debugger.detach()}
}

module.exports={performanceFixture,verifyPerformance}
