'use strict'

const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const fixtures = path.join(__dirname, 'fixtures')

function siteAsset(url) {
  const name = url.pathname.match(/^\/site-vendor\/(custom\.css|material-dashboard\.css|site-notify\.js|html2canvas\.js|bootstrap-material-design\.min\.js|perfect-scrollbar\.jquery\.min\.js|fontawesome\.min\.css|solid\.min\.css|fa-solid-900\.woff2|bootstrap-select\.(?:css|js))$/)
  if (!name) return null
  return new Response(fs.readFileSync(path.join(fixtures, 'vendor', name[1])), { headers: { 'content-type': name[1].endsWith('.js') ? 'text/javascript' : name[1].endsWith('.woff2') ? 'font/woff2' : 'text/css' } })
}

function siteSourceFixture(postArrest = false) {
  const search = fs.readFileSync(path.join(fixtures, 'dashboard-search.html'), 'utf8')
  const forms = fs.readFileSync(path.join(fixtures, 'warrant-forms.html'), 'utf8') + fs.readFileSync(path.join(fixtures, 'arrest-report-form.html'), 'utf8')
  const notifications = fs.readFileSync(path.join(fixtures,'source-notifications.html'),'utf8')
  const stats = fs.readFileSync(path.join(fixtures, 'dashboard-stats.html'), 'utf8')
  const license = '<section class="card-license"><h5>Driving License</h5><span name="licenseStatus">Valid</span><div class="card-footer"><button class="btn btn-danger">Revoke</button><div class="btn-group"><button class="btn btn-warning dropdown-toggle" data-toggle="dropdown">Suspend</button><div class="dropdown-menu"><form><label>Days<input class="form-control suspension-days" type="number" value="1"></label><label>Reason<input class="form-control suspension-reason"></label><button type="submit" class="btn btn-warning suspend-confirm">Confirm suspension</button></form></div></div></div></section>'
  const page = `<!doctype html><html><head><title>Source markup regressions</title>
    <link rel="stylesheet" href="/site-vendor/material-dashboard.css"><link rel="stylesheet" href="/site-vendor/custom.css">
    <link rel="stylesheet" href="/vendor/font-awesome.css"><link rel="stylesheet" href="/vendor/summernote-bs4.css"><link rel="stylesheet" href="/site-vendor/bootstrap-select.css">
    <script src="/vendor/jquery.js"></script><script src="/vendor/bootstrap.js"></script><script src="/site-vendor/site-notify.js"></script><script src="/vendor/summernote-bs4.js"></script><script src="/site-vendor/bootstrap-select.js"></script>
    <style>.fas{font-family:FontAwesome}.navbar-nav{flex-direction:row;gap:8px}.main-panel{float:none;width:100%}#single-license{width:360px}#multiple-licenses{display:flex;gap:12px}.source-controls{padding:8px}.source-profile .card-body{display:flex;justify-content:flex-end}.source-profile .details{width:360px}.source-profile h4{font-size:14px}.source-profile .values h4{font-weight:bold}.source-profile .titles{text-align:right}</style>
    </head><body><div class="wrapper"><div class="main-panel"><nav class="navbar"><ul class="navbar-nav">${search}${notifications}</ul></nav>
    <main class="content">${stats}<section class="card card-profile source-profile"><div class="card-body"><div class="row details"><div class="col-6 titles"><h4 class="characterDetailsTitle">Age:</h4><h4 class="characterDetailsTitle">Partner:</h4><h4 class="characterDetailsTitle">Jail Time:</h4><h4 class="characterDetailsTitle">Criminal Points:</h4></div><div class="col-6 values"><h4 class="characterDetailsValue">38</h4><h4 class="characterDetailsValue"><a href="/record/2">Marco Smith</a></h4><h4 class="characterDetailsValue"><span id="jailTime">29 years 9 months 19 hours 22 minutes 32 seconds</span></h4><h4 class="characterDetailsValue">5</h4></div></div></div></section>
    <section class="card"><div class="card-header">Licenses</div><div class="card-body"><div id="single-license">${license}</div><div id="multiple-licenses">${license}${license}</div></div></section>
    <div class="source-controls">${['Arrest','Search','Electronic','Financial'].map(kind=>'<button class="btn btn-primary" data-toggle="modal" data-target="#modalAdd'+kind+'Warrant">'+kind+' warrant</button>').join('')}</div></main></div></div>${forms}
    <script>
    window.suspensions=0;
    window.sourceInvalidNotice=()=>$.notify({icon:'<i class="material-icons" style="color:white;font-size:40px;">error</i>',title:'Error!',message:'Invalid name, use Firstname Lastname'},{type:'danger',placement:{from:'top',align:'left'},delay:0,animate:{enter:'',exit:''}});
    document.querySelectorAll('#chargesCopy .input-group:first-child select').forEach(select=>{select.innerHTML='<option value="" disabled selected>Charge</option>';for(let i=0;i<350;i++){const option=new Option('Fixture charge '+i,String(i));option.dataset.content='<span class="badge badge-danger">'+i+'</span> Fixture charge '+i;select.add(option)}});
    $('.card-license form').on('submit',function(e){e.preventDefault();window.suspensions++;$(this).closest('.btn-group').find('[data-toggle=dropdown]').dropdown('hide')});
    $('.navbar a').on('click',function(e){e.preventDefault();$(this).html('<i class="fas fa-fw fa-search mr-2"></i>')});
    $('.modal .modal-body.modal-scroll').addClass('ps-container ps-active-y');
    $('.modal').each(function(){const modal=$(this);if(this.id==='source-add-arrest')modal.find('#arrestReport').summernote({height:180});modal.find('textarea[id$=WarrantNarrative],textarea[id=eswWarrantNarrative2]').summernote({height:180});modal.on('click','.addCharge',()=>{const row=modal.find(this.id==='source-add-arrest'?'#arrestCopy':'#chargesCopy').html();modal.find('.chargeWrapper').append(row);modal.find('.chargeWrapper select').selectpicker()});modal.on('click','[class*=addEvidence]',()=>{const template=modal.find('[id^=evidenceCopy]').first().html();const wrapper=modal.find('[class*=evidenceWrapper]').first();wrapper.append(template);wrapper.find('textarea').summernote({height:150})});modal.on('click','.remove_button',function(){$(this).closest('.form-group.row').remove()})});
    window.sourceReady=true;
    </script></body></html>`
  return postArrest ? page.replace('</head>', '<link rel="stylesheet" href="/site-vendor/fontawesome.min.css"><link rel="stylesheet" href="/site-vendor/solid.min.css"><script src="/site-vendor/html2canvas.js"></script></head>').replace(/<main class="content">[\s\S]*?<\/main>/, '<main class="content"><button id="copyWarrant" class="btn btn-secondary">Copy</button>'+fs.readFileSync(path.join(fixtures,'post-arrest.html'),'utf8')+'<textarea id="post-editor"></textarea><section id="fixture-warrant-filters" class="card"><div class="card-header card-header-dark"><input class="form-control d-inline-block" style="width:150px" placeholder="Suspect Name"><input class="form-control d-inline-block" style="width:150px" placeholder="Filed By"><input class="form-control d-inline-block" style="width:150px" placeholder="Handled by"><button class="btn btn-secondary btn-actions"><i class="fas fa-search"></i>Search</button><button class="btn btn-secondary btn-actions"><i class="fas fa-eraser"></i>Clear Fields</button></div></section></main>').replace('window.sourceReady=true;', "$('#post-editor').summernote({height:180});document.getElementById('copyWarrant').addEventListener('click',()=>{window.exportError=null;window.exportData=null;html2canvas(document.querySelector('#warrant'),{allowTaint:true,onclone:clone=>{const p=clone.querySelector('#warrant');window.exportClone={icons:p.querySelectorAll('[data-mdt-export-icon]').length,fonts:p.querySelectorAll('i.fas').length,skin:clone.querySelectorAll('style[id^=mdt-]').length,cell:getComputedStyle(clone.querySelector('#PostArrestTable tbody th')).backgroundColor,scale:devicePixelRatio,signatureBottom:p.lastElementChild.getBoundingClientRect().bottom-p.getBoundingClientRect().top};}}).then(c=>window.exportData=c.toDataURL()).catch(e=>window.exportError=String(e));});window.sourceReady=true;") : page
}

async function verifySiteSource({shell,guest,until,delay,win,output}) {
  await shell(`setTheme('p1');wv.loadURL('https://mdc.gta.world/source-markup')`)
  await until(async()=>!(await guest()).isLoading()&&await (await guest()).executeJavaScript(`window.sourceReady===true`),'actual source markup fixture ready')
  const g=await guest()
  const read=(code)=>g.executeJavaScript(code,true)
  await read(`document.querySelector('#single-license').parentElement.appendChild(document.createElement('hr'));void 0`)
  await shell(`dialogRoots.slice().forEach(closeDialog)`)
  const click=async(selector)=>{
    const point=await read(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
    g.sendInputEvent({type:'mouseDown',...point,button:'left',clickCount:1})
    g.sendInputEvent({type:'mouseUp',...point,button:'left',clickCount:1})
    await delay(200)
  }
  for(const theme of ['p1','aero','aerolapd','aerodark']) {
    await read(`document.querySelectorAll('.fixture-profile-tail').forEach(n=>n.remove())`)
    await shell(`setTheme('${theme}')`)
    await delay(250)
    const cleanHeight=await read(`document.querySelector('.source-profile .details').getBoundingClientRect().height`)
    await read(`(()=>{const titles=document.querySelector('.source-profile .titles'),values=document.querySelector('.source-profile .values'),line=document.createElement('hr');line.className='fixture-profile-tail';titles.appendChild(line);const wrapper=document.createElement('div');wrapper.className='fixture-profile-tail';wrapper.appendChild(document.createElement('hr'));values.appendChild(wrapper)})()`)
    await until(()=>read(`document.querySelectorAll('[data-mdt-profile-tail]').length===2`),theme+': profile tails identified')
    const tails=await read(`({height:document.querySelector('.source-profile .details').getBoundingClientRect().height,hidden:Array.from(document.querySelectorAll('[data-mdt-profile-tail]')).every(n=>getComputedStyle(n).display==='none'&&n.getClientRects().length===0),other:getComputedStyle(document.querySelector('#single-license').parentElement.querySelector(':scope > hr')).display})`)
    assert.ok(tails.hidden&&Math.abs(tails.height-cleanHeight)<1&&tails.other!=='none',theme+': only empty profile tail separators disappear, retaining the exact height without separators '+JSON.stringify({tails,cleanHeight}))
    fs.writeFileSync(path.join(output,theme+'-profile-no-tail-lines.png'),(await win.webContents.capturePage()).toPNG())
    assert.ok(await read(`Array.from(document.querySelectorAll('.card-stats')).every(n=>{const a=n.getBoundingClientRect(),b=n.firstElementChild.getBoundingClientRect();return Math.abs(a.bottom-b.bottom)<1&&Math.abs(a.top-b.top)<1&&getComputedStyle(n).borderBottomWidth==='0px'})`),theme+': header-only statistics have no empty bordered tail')
    await read(`window.sourceNotice=sourceInvalidNotice();void 0`)
    await until(()=>read(`!!document.querySelector('[data-notify="icon"][data-mdt-notice-mark]')`),theme+': nested Material error icon recognized')
    const noticeGeometry=await read(`(()=>{const n=document.querySelector('[data-mdt-notice-mark]'),s=getComputedStyle(n,'::before');return {child:getComputedStyle(n.firstElementChild).display,width:s.width,height:s.height,mask:s.maskImage,justify:getComputedStyle(n).justifyContent,display:getComputedStyle(n).display}})()`)
    assert.ok(noticeGeometry.child==='none'&&noticeGeometry.width==='15px'&&noticeGeometry.height==='15px'&&noticeGeometry.mask.includes('data:image/svg+xml')&&noticeGeometry.justify==='center',theme+': source notification uses centered vector bounds instead of nested 40px icon '+JSON.stringify(noticeGeometry))
    await read(`sourceNotice.close()`)
    const details=await read(`(()=>{const labels=Array.from(document.querySelectorAll('.source-profile .characterDetailsTitle')),values=Array.from(document.querySelectorAll('.source-profile .characterDetailsValue'));return labels.map((n,i)=>({label:n.textContent,top:n.getBoundingClientRect().top,valueTop:values[i].getBoundingClientRect().top,background:getComputedStyle(n).backgroundColor,border:getComputedStyle(n).borderTopWidth}))})()`)
    assert.ok(details.every(r=>Math.abs(r.top-r.valueTop)<1&&r.background==='rgba(0, 0, 0, 0)'&&r.border==='0px'),theme+': transparent profile labels stay aligned with long jail time '+JSON.stringify(details))
    for(const id of ['searchPerson','searchPlate']) {
      for(const changed of [false,true]) {
        if(changed)await click('#'+id)
        const centered=await read(`(()=>{const action=document.getElementById('${id}'),icon=action.querySelector('i'),a=action.getBoundingClientRect(),b=icon.getBoundingClientRect();return {dx:Math.abs(a.x+a.width/2-b.x-b.width/2),dy:Math.abs(a.y+a.height/2-b.y-b.height/2)}})()`)
        assert.ok(centered.dx<.6&&centered.dy<.6,theme+': source '+id+' '+(changed?'after replacement':'heading wrapper')+' centered '+JSON.stringify(centered))
      }
    }
    for(const host of ['#single-license','#multiple-licenses']) {
      await click(host+' .dropdown-toggle')
      try { await until(()=>read(`!!document.querySelector('${host} .dropdown-menu[data-mdt-pin]')`),theme+': suspension menu pinned') }
      catch(error) {
        fs.writeFileSync(path.join(output,'source-menu-failure.png'),(await win.webContents.capturePage()).toPNG())
        throw new Error(error.message+' '+JSON.stringify(await read(`(()=>{const n=document.querySelector('${host} .dropdown-toggle'),r=n.getBoundingClientRect();return {parent:n.parentElement.outerHTML,rect:r.toJSON(),hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,180)}})()`)))
      }
      const menu=await read(`(()=>{const n=document.querySelector('${host} .suspend-confirm'),r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {width:r.width,height:r.height,reachable:hit===n||n.contains(hit)}})()`)
      assert.ok(menu.reachable&&menu.width>30&&menu.height>15,theme+': suspension form visible beyond license card '+JSON.stringify(menu))
      await click(host+' .suspension-reason')
      assert.ok(await read(`document.activeElement.matches('.suspension-reason')`),theme+': suspension reason receives focus')
      await click(host+' .suspend-confirm')
    }
    for(const kind of ['Arrest','Search','Electronic','Financial']) {
      const id='modalAdd'+kind+'Warrant'
      await read(`$('#${id}').modal('show')`)
      await until(()=>read(`document.querySelector('#${id}[data-mdt-native-form="1"].show')&&!$('#${id}').data('bs.modal')._isTransitioning`),theme+': '+kind+' warrant ready')
      const base='#'+id
      const suspect=await read(`(()=>{const modal=document.getElementById('${id}'),name=modal.querySelector('input[id^=suspectName]'),alias=modal.querySelector('input[id^=suspectAlias]'),selects=modal.querySelectorAll('select[id^=suspect]');return [name,alias,...selects].filter(Boolean).map(n=>n.getBoundingClientRect().toJSON())})()`)
      assert.ok(suspect.every((r,i)=>r.width>200&&r.width<450&&Math.abs(r.width-suspect[0].width)<1&&(!i||r.top>=suspect[i-1].bottom)),theme+': '+kind+' source suspect fields share width and stack '+JSON.stringify(suspect))
      const controls=await read(`Array.from(document.querySelectorAll('${base} .modal-body > .row:first-child .btn,${base} .modal-body button[data-target="#collapseExample"],${base} .modal-body .addCharge,${base} .modal-body [class*=addEvidence]')).map(n=>({text:n.textContent.trim(),width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})).filter(n=>n.width)`)
      assert.ok(controls.every(r=>r.height<=30&&r.width<180),theme+': '+kind+' compact action buttons '+JSON.stringify(controls))
      if(kind==='Arrest') {
        const situation=await read(`Array.from(document.querySelectorAll('${base} [data-mdt-warrant-situation] input')).map(n=>n.getBoundingClientRect().toJSON())`)
        assert.ok(situation.length===3&&situation.every(r=>Math.abs(r.top-situation[0].top)<1&&r.width>90),theme+': source date/time/location are aligned')
        await click(base+' .addCharge')
        await delay(250)
        const pickerResults=[]
        g.debugger.attach('1.3')
        try {
          await g.debugger.sendCommand('Performance.enable')
          for(const index of [0,1]) {
            const start=await g.debugger.sendCommand('Performance.getMetrics')
            const synchronousMs=await read(`(()=>{const button=document.querySelectorAll('${base} .chargeWrapper .bootstrap-select > .dropdown-toggle')[${index}];button.scrollIntoView({block:'center'});const start=performance.now();button.click();return performance.now()-start})()`)
            await until(()=>read(`document.querySelectorAll('${base} .chargeWrapper .bootstrap-select')[${index}].classList.contains('show')`),theme+': charge/class menu opens')
            await delay(250)
            const end=await g.debugger.sendCommand('Performance.getMetrics')
            const delta=(name)=>(end.metrics.find(item=>item.name===name).value-start.metrics.find(item=>item.name===name).value)*1000
            const result={control:index?'Class':'Charge',synchronousMs,scriptMs:delta('ScriptDuration'),taskMs:delta('TaskDuration'),recalcMs:delta('RecalcStyleDuration')}
            pickerResults.push(result)
            assert.ok(result.synchronousMs<350&&result.scriptMs<500&&result.taskMs<700&&result.recalcMs<400,theme+': no dropdown freeze '+JSON.stringify(result))
            assert.ok(await read(`Array.from(document.querySelectorAll('${base} .chargeWrapper .bootstrap-select > .dropdown-toggle .filter-option,${base} .chargeWrapper .bootstrap-select > .dropdown-toggle .filter-option-inner,${base} .chargeWrapper .bootstrap-select > .dropdown-toggle .filter-option-inner-inner')).every(n=>getComputedStyle(n).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(n).backgroundImage==='none'&&getComputedStyle(n).borderTopWidth==='0px')`),theme+': charge/class caption wrappers do not paint broken background strips')
            fs.writeFileSync(path.join(output,theme+'-'+(index?'class':'charge')+'-menu.png'),(await win.webContents.capturePage()).toPNG())
            await read(`document.querySelectorAll('${base} .chargeWrapper .bootstrap-select > .dropdown-toggle')[${index}].click()`)
          }
        } finally { g.debugger.detach() }
        fs.writeFileSync(path.join(output,theme+'-dropdown-performance.json'),JSON.stringify(pickerResults,null,2))
        console.log('DROPDOWN '+theme+' '+JSON.stringify(pickerResults))
      }
      await click(base+' [class*=addEvidence]')
      await until(()=>read(`!!document.querySelector('${base} [data-mdt-warrant-entry="evidence"] .note-editor')`),theme+': dynamic evidence ready')
      const evidence=await read(`(()=>{const modal=document.getElementById('${id}'),row=Array.from(modal.querySelectorAll('[data-mdt-warrant-entry="evidence"]')).find(n=>n.closest('[class*=evidenceWrapper]')),editor=row.querySelector('.note-editor').getBoundingClientRect(),button=row.querySelector('.remove_button').getBoundingClientRect(),bounds=row.getBoundingClientRect(),icon=row.querySelector('.input-group-text').getBoundingClientRect();return {inside:editor.left>=bounds.left-1&&button.right<=bounds.right+1,separate:button.left>=editor.right,buttonWidth:button.width,iconHeight:icon.height}})()`)
      fs.writeFileSync(path.join(output,theme+'-source-evidence.png'),(await win.webContents.capturePage()).toPNG())
      assert.ok(evidence.inside&&evidence.separate&&evidence.buttonWidth===28&&evidence.iconHeight===0,theme+': '+kind+' evidence editor and remove button contained, decorative magnifier removed '+JSON.stringify(evidence))
      await click(base+' [class*=evidenceWrapper] .remove_button')
      assert.equal(await read(`document.querySelectorAll('${base} [class*=evidenceWrapper] .note-editor').length`),0,theme+': evidence removal preserves native handler')
      await read(`document.querySelector('#${id} .modal-body').scrollTop=0`)
      await delay(200)
      if(kind==='Arrest')fs.writeFileSync(path.join(output,theme+'-source-warrant.png'),(await win.webContents.capturePage()).toPNG())
      await read(`$('#${id}').modal('hide')`)
      await until(()=>read(`!document.querySelector('#${id}.show')&&!$('#${id}').data('bs.modal')._isTransitioning`),'warrant closed')
    }
    console.log('PASS '+theme+' source search wrappers/replacement, suspension forms and all four warrant forms')
  }
  assert.equal(await read('suspensions'),8,'native suspension submission handlers run')
  await read(`(()=>{const parent=document.querySelector('.source-profile .values'),partner=parent.children[1],jail=parent.children[2];parent.insertBefore(jail,partner)})()`)
  await delay(250)
  assert.ok(await read(`(()=>{const labels=Array.from(document.querySelectorAll('.source-profile .characterDetailsTitle')),partner=document.querySelector('.source-profile a[href="/record/2"]').closest('.characterDetailsValue'),jail=document.getElementById('jailTime').closest('.characterDetailsValue');return Math.abs(labels[1].getBoundingClientRect().top-partner.getBoundingClientRect().top)<1&&Math.abs(labels[2].getBoundingClientRect().top-jail.getBoundingClientRect().top)<1})()`),'profile mapping keeps duration with Jail Time and record link with Partner despite swapped source order')
  await shell(`setTheme('off')`)
  await delay(150)
  assert.equal(await read(`document.querySelectorAll('[data-mdt-native-form], [data-mdt-warrant-suspect], [data-mdt-warrant-entry], [data-mdt-pin], [data-mdt-profile-column], [data-mdt-profile-tail]').length`),0,'Original MDC restores source form geometry and profile separators')
  return 4
}

module.exports={siteAsset,siteSourceFixture,verifySiteSource}
