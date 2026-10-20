'use strict'

const { app, BrowserWindow, session, webContents } = require('electron')
const fs = require('fs')
const os = require('os')
const path = require('path')
const assert = require('assert/strict')
const { vendorResponse } = require('./widget-fixture')
const { siteAsset, siteSourceFixture } = require('./site-source-fixture')
const { forumFixture, workspaceFixture } = require('./workspace-fixture')
const output = path.join(__dirname, '..', 'dist', 'verification')
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'patrolone-memory-'))
const originalSetPath = app.setPath.bind(app)
app.setPath = (name, value) => originalSetPath(name, name === 'userData' ? profile : value)
originalSetPath('userData', profile)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function until(fn, label) {
  const end=Date.now()+30000
  while(Date.now()<end) { try { if(await fn()) return } catch (_) {} await delay(100) }
  throw new Error('Timed out: '+label)
}

function dashboard() {
  const base=path.join(__dirname,'fixtures')
  const stats=fs.readFileSync(path.join(base,'dashboard-stats.html'),'utf8')
  const searches=fs.readFileSync(path.join(base,'dashboard-search.html'),'utf8')
  return `<!doctype html><html><head><title>Dashboard</title><link rel="stylesheet" href="/site-vendor/material-dashboard.css"><link rel="stylesheet" href="/site-vendor/custom.css"><link rel="stylesheet" href="/vendor/font-awesome.css"><script src="/vendor/jquery.js"></script><script src="/vendor/bootstrap.js"></script><style>.fas{font-family:FontAwesome}.navbar-nav{flex-direction:row;gap:8px}.main-panel{width:100%;float:none}</style></head><body><aside class="sidebar"><ul class="nav">${[['Dashboard','/'],['Profile','/record/1'],['Warrants Database','/warrants/database']].map(([label,url])=>'<li><a href="'+url+'">'+label+'</a></li>').join('')}</ul></aside><div class="main-panel"><nav class="navbar"><ul class="navbar-nav">${searches}</ul></nav><main class="content">${stats}<section class="card card-dashboard"><div class="card-header">Message of the day</div><div class="card-body"><p>Representative local dashboard content.</p></div></section></main></div></body></html>`
}

function sample(label) {
  const processes=app.getAppMetrics().map(item=>({pid:item.pid,type:item.type,workingSetMiB:item.memory.workingSetSize/1024,privateMiB:(item.memory.privateBytes||0)/1024}))
  return {label,processCount:processes.length,workingSetMiB:processes.reduce((sum,item)=>sum+item.workingSetMiB,0),privateMiB:processes.reduce((sum,item)=>sum+item.privateMiB,0),processes}
}

app.whenReady().then(async()=>{
  fs.mkdirSync(output,{recursive:true})
  await session.fromPartition('persist:gtaw-mdc').protocol.handle('https',request=>{
    const url=new URL(request.url)
    const asset=vendorResponse(url)||siteAsset(url)
    if(asset)return asset
    if(url.pathname==='/seal.svg')return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><circle cx="75" cy="75" r="70" fill="gold"/></svg>',{headers:{'content-type':'image/svg+xml'}})
    const html=url.hostname==='forum.gta.world'?forumFixture():url.pathname==='/warrants/database'?siteSourceFixture():url.pathname==='/record/1'?workspaceFixture(dashboard()).replace('</body>','<section>'+Array.from({length:120},(_,i)=>'<p>Representative read-only report paragraph '+i+'</p>').join('')+'</section></body>'):dashboard()
    return new Response(html,{headers:{'content-type':'text/html; charset=utf-8'}})
  })
  await session.defaultSession.protocol.handle('https',()=>new Response('',{headers:{'content-type':'text/css'}}))
})

require('../main')

app.whenReady().then(async()=>{
  await until(()=>BrowserWindow.getAllWindows().length>0,'real application window')
  const win=BrowserWindow.getAllWindows()[0]
  const shell=(code)=>win.webContents.executeJavaScript(code,true)
  await until(()=>shell(`document.readyState==='complete'&&typeof pages!=='undefined'&&pages.length===1`),'shell loaded')
  await until(async()=>{
    const g=webContents.fromId(await shell('wv.getWebContentsId()'))
    return !g.isLoading()&&await g.executeJavaScript(`document.readyState==='complete'&&document.querySelectorAll('.card-stats').length===4`)
  },'initial dashboard loaded')
  await delay(1500)
  const startup=sample('one dashboard shortly after startup')
  fs.writeFileSync(path.join(output,'memory-startup.png'),(await win.webContents.capturePage()).toPNG())
  await shell(`openPage('https://mdc.gta.world/warrants/database')`)
  await until(async()=>{const g=webContents.fromId(await shell('wv.getWebContentsId()'));return !g.isLoading()&&g.getURL().endsWith('/warrants/database')&&await g.executeJavaScript('window.sourceReady===true')},'warrant page loaded')
  await shell(`openPage('https://mdc.gta.world/record/1')`)
  await until(async()=>{const g=webContents.fromId(await shell('wv.getWebContentsId()'));return !g.isLoading()&&g.getURL().endsWith('/record/1')},'record page loaded')
  await shell(`showTab('depa')`)
  await until(async()=>{
    const g=webContents.fromId(await shell('laws.depa.el.getWebContentsId()'))
    return !g.isLoading()&&g.getURL().includes('/topic/30297')
  },'law page loaded')
  await delay(1500)
  assert.equal(await shell('pages.length'),3)
  const several=sample('four loaded pages: dashboard, warrant, record and DEPA')
  fs.writeFileSync(path.join(output,'memory-four-pages.png'),(await win.webContents.capturePage()).toPNG())
  const result={version:require('../package.json').version,method:'Real main.js and renderer; isolated fresh profile; source-based local pages; sum of Electron app.getAppMetrics working sets in MiB. Not a signed-in live-account measurement.',startup,several}
  fs.writeFileSync(path.join(output,'memory.json'),JSON.stringify(result,null,2))
  console.log('MEMORY '+JSON.stringify(result))
  win.destroy()
  app.quit()
}).catch(error=>{console.error(error.stack);app.exit(1)})
