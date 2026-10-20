'use strict'

const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')

const vendor = {
  '/vendor/popper.js': ['popper.js/dist/umd/popper.js', 'text/javascript'],
  '/vendor/font-awesome.css': ['font-awesome/css/font-awesome.css', 'text/css'],
  '/fonts/fontawesome-webfont.woff2': ['font-awesome/fonts/fontawesome-webfont.woff2', 'font/woff2'],
  '/vendor/bootstrap.js': ['bootstrap/dist/js/bootstrap.bundle.js', 'text/javascript'],
  '/vendor/bootstrap.css': ['bootstrap/dist/css/bootstrap.css', 'text/css'],
  '/vendor/notify.js': ['bootstrap-notify/bootstrap-notify.js', 'text/javascript'],
  '/vendor/jquery.js': ['jquery/dist/jquery.js', 'text/javascript'],
  '/vendor/cropper.js': ['cropperjs/dist/cropper.js', 'text/javascript'],
  '/vendor/cropper.css': ['cropperjs/dist/cropper.css', 'text/css'],
  '/vendor/summernote.js': ['summernote/dist/summernote-lite.js', 'text/javascript'],
  '/vendor/summernote-bs4.js': ['summernote/dist/summernote-bs4.js', 'text/javascript'],
  '/vendor/summernote-bs4.css': ['summernote/dist/summernote-bs4.css', 'text/css'],
  '/vendor/font/summernote.woff2': ['summernote/dist/font/summernote.woff2', 'font/woff2'],
  '/vendor/font/summernote.woff': ['summernote/dist/font/summernote.woff', 'font/woff'],
  '/vendor/font/summernote.ttf': ['summernote/dist/font/summernote.ttf', 'font/ttf'],
  '/vendor/summernote.css': ['summernote/dist/summernote-lite.css', 'text/css']
}

function vendorResponse(url) {
  const item = vendor[url.pathname]
  if (!item) return null
  return new Response(fs.readFileSync(require.resolve(item[0])), { headers: { 'content-type': item[1] } })
}

function widgetFixture(base) {
  return base.replace('</head>', `
    <link rel="stylesheet" href="/vendor/bootstrap.css">
    <link rel="stylesheet" href="/vendor/font-awesome.css">
    <link rel="stylesheet" href="/vendor/cropper.css">
    <link rel="stylesheet" href="/vendor/summernote.css">
    <style>
      .btn-just-icon .fa-search {position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);}
      #lookup-submit-1:active .fa-search {transform:none;}
      .note-editor.note-frame .note-editing-area .note-editable {background:#1f2326;color:#fff;}
      #warrantDialog .modal-dialog {width:900px;max-width:90vw;}
      .navbar-form {display:flex;align-items:center;flex-wrap:nowrap;}
      .navbar-brand { display:inline-block; background:#ffffff; border:1px solid #222; padding:8px; }
      #modalPicture .modal-dialog { width:600px; }
      #mugshotPreview { width:500px; height:320px; margin:10px auto; }
      #mugshotPreview > img { display:block; max-width:100%; height:320px; }
      #editorDialog .modal-dialog { width:700px; }
      #viewed-report { margin-top:12px; }
      .lookup-strip { background:#1a1a1a; display:flex; justify-content:flex-end; align-items:center; gap:12px; padding:10px; }
      .lookup-strip input { font:14px Georgia; height:20px; background:white; padding:0; }
    </style>
    <script src="/vendor/jquery.js"></script>
    <script src="/vendor/notify.js"></script>
    <script src="/vendor/cropper.js"></script>
    <script src="/vendor/summernote.js"></script>
  </head>`).replace('Police Officer II - Harlan McClane #225373', '<a class="navbar-brand">Police Officer II - Harlan McClane #225373</a>').replace('</body>', `
    <div id="notification-host" style="position:relative"></div>
    <div class="lookup-strip" id="unwrapped-lookups"><span><input id="lookup-person" placeholder=" Search Person " aria-label="Search Person"><a href="#" id="lookup-person-action" aria-label="Search Person" onclick="event.preventDefault();window.unwrappedLookupRequest=document.getElementById('lookup-person').value"><i class="fa fa-search" style="color:black"></i></a></span><span><input id="lookup-vehicle" placeholder="Search Vehicle"><a href="#" id="lookup-vehicle-action" aria-label="Search Vehicle" onclick="event.preventDefault();window.unwrappedLookupRequest=document.getElementById('lookup-vehicle').value"><i class="fa fa-search" style="color:black"></i></a></span></div>
    <section id="authored-report"><font face="Georgia" id="authored-face"><b>Saved narrative font</b></font><span id="green" style="color:#008000"><b id="green-child">Green report text</b></span><font id="blue" color="#0055cc">Blue report text</font><span id="marked" style="color:#202020;background-color:#ffff00">Highlighted report text</span></section>
    <section class="card"><div class="card-body"><table class="table" id="record-template"><thead><tr><th id="report-heading" style="color:#000000"><b id="report-label" style="color:#000000">LOS SANTOS POLICE DEPARTMENT — ARREST REPORT</b></th></tr></thead><tbody><tr><td>Lucy Summers</td></tr></tbody></table><table class="table"><tbody><tr><td style="background-color:#cde5ee"><b id="motd-label" style="color:#ffffff">LSPD POLICY REMINDER</b></td></tr></tbody></table><table class="table"><thead><tr><th><font id="incident-label" color="#000000">Incident details</font></th></tr></thead></table></div></section>
    <div id="warrantDialog" class="modal"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">File Arrest Warrant</h4></div><div class="modal-body"><div class="row"><div class="col-md-4"><h6>Confidential Level</h6><div class="btn-group"><button class="btn btn-danger dropdown-toggle">General Warrant</button></div></div><div class="col-md-4 offset-md-4"><h6>Seal Warrant</h6><button class="btn btn-warning dropdown-toggle">Sealed Warrant</button></div></div><h6 class="text-center">Suspect Details</h6><div class="row" id="suspect-row"><div class="col-md-4" id="suspect-fields"><div class="form-group"><input class="form-control" placeholder="Suspect Name"></div><div class="form-group"><input class="form-control" placeholder="Alias(es) - Leave Blank for N/A"></div><div class="form-group"><select class="form-control"><option>African American</option></select></div><div class="form-group"><select class="form-control"><option>Male</option></select></div></div><div class="col-md-8" id="suspect-photo"><img src="/slow.svg" width="150" height="150"></div></div><hr><h6 class="text-center">Situational Details &amp; Narrative</h6><div class="row" id="situation-row"><div class="col-md-2"><label>Date</label><div class="input-group"><span class="input-group-text">Date</span><input class="form-control" value="17/Oct/2026"></div></div><div class="col-md-2"><label>Time</label><div class="input-group"><span class="input-group-text">Time</span><input class="form-control" value="17:19"></div></div><div class="col-md-4"><label>Location</label><div class="input-group"><span class="input-group-text">Map</span><input class="form-control" placeholder="Location"></div></div></div></div></div></div></div>
    <div id="modalPicture" class="modal"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">Upload Mugshot</h4></div><div class="modal-body"><input type="file" id="fileMugshot"><div id="mugshotPreview"><img id="mugshotPreviewImage"></div></div><div class="modal-footer"><button id="uploadMugshot" class="btn btn-primary">Upload</button></div></div></div></div>
    <div id="editorDialog" class="modal"><div class="modal-dialog" style="width:700px !important"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">Add Record</h4></div><div class="modal-body"><textarea id="report-editor" class="summernote"></textarea><div id="viewed-report"></div></div></div></div></div>
    <script>
      document.getElementById('editorDialog').addEventListener('click', function (event) { if (event.target === this) this.classList.remove('show'); });
      document.querySelectorAll('.navbar form').forEach((form,index) => {
        form.className='navbar-form';
        form.querySelector('input').className='form-control';
        const button=document.createElement('button');button.className='btn btn-white btn-round btn-just-icon';button.type='submit';button.style.width=index?'44px':'30px';button.addEventListener('click',()=>button.style.removeProperty('width'));button.id='lookup-submit-'+index;button.setAttribute('aria-label',index?'Search Vehicle':'Search Person');button.innerHTML='<i class="fa fa-search" aria-hidden="true"></i>';form.appendChild(button);
        form.addEventListener('submit',(event)=>{event.preventDefault();window.lookupRequest=form.querySelector('input').value;});
      });
      window.notifyClosed=0;
      window.invalidNameNotice=(extra={})=>$.notify({title:'Error!',message:'Invalid name, use Firstname Lastname',icon:'fa fa-exclamation-circle'},Object.assign({element:'#notification-host',position:'absolute',type:'danger',placement:{from:'top',align:'left'},delay:0,timer:70,offset:12,animate:{enter:'',exit:''},onClosed:()=>window.notifyClosed++},extra));
      window.lookupSamples=[];
      function lookupFrame(){if(document.documentElement.classList.contains('mdt-p1')&&document.querySelectorAll('.navbar [data-mdt-lookup-action]').length===2)lookupSamples.push(Array.from(document.querySelectorAll('.navbar [data-mdt-lookup-action]')).map(n=>n.getBoundingClientRect().width));if(lookupSamples.length<20)requestAnimationFrame(lookupFrame)}
      requestAnimationFrame(lookupFrame);
      window.crop = null;
      document.getElementById('fileMugshot').addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        if (window.crop) { window.crop.destroy(); window.crop = null; }
        const reader = new FileReader();
        reader.onload = () => {
          const image = document.getElementById('mugshotPreviewImage');
          image.src = reader.result;
          window.crop = new Cropper(image, { aspectRatio:1, viewMode:1, autoCropArea:.6, ready() { window.cropReady = true; } });
        };
        window.cropReady = false;
        reader.readAsDataURL(file);
      });
      document.getElementById('uploadMugshot').onclick = () => {
        const canvas = crop.getCroppedCanvas({width:256,height:256});
        window.exportedCrop = {width:canvas.width,height:canvas.height,pixel:Array.from(canvas.getContext('2d').getImageData(128,128,1,1).data)};
      };
      $('#report-editor').summernote({ toolbar:[['font',['bold','italic','underline','fontname','color']],['para',['ul','ol','paragraph']],['insert',['table','link','picture']]], height:140 });
      window.pickImage = () => {
        const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 600;
        const context = canvas.getContext('2d'); context.fillStyle = '#708da3'; context.fillRect(0,0,800,600);
        context.fillStyle = '#aadeee'; context.fillRect(200,100,300,400);
        const bytes = atob(canvas.toDataURL().split(',')[1]);
        const file = new File([Uint8Array.from(bytes, (ch) => ch.charCodeAt(0))], 'mugshot.png', {type:'image/png'});
        const transfer = new DataTransfer(); transfer.items.add(file);
        const input = document.getElementById('fileMugshot'); input.files = transfer.files;
        input.dispatchEvent(new Event('change', {bubbles:true}));
      };
      window.selectReport = () => {
        $('#report-editor').summernote('code', '<p>Selected report text</p>');
        $('#report-editor').summernote('focus');
        const editable = document.querySelector('#editorDialog .note-editable');
        const range = document.createRange(); range.selectNodeContents(editable.firstElementChild);
        const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
        $('#report-editor').summernote('editor.setLastRange');
      };
    </script>
  </body>`)
}

async function verifyWidgets({ shell, guest, until, delay, win, output }) {
  let count = 0
  await shell(`setTheme('p1'); wv.loadURL('https://mdc.gta.world/widgets')`)
  await until(async () => { const g = await guest(); return !g.isLoading() && await g.executeJavaScript(`typeof pickImage === 'function'`) }, 'widget libraries')
  const g = await guest()
  const read = async (code) => {
    try { return await g.executeJavaScript(code, true) }
    catch (error) { throw new Error(error.message + '\nWidget expression: ' + code) }
  }
  const snapshot = () => read(`(() => {
    const values = {};
    for (const selector of ['body','.sidebar','.main-panel','.navbar-brand','#green','#green-child','#blue','#marked','#fileMugshot','#character','#plate','#lookup-submit-0','#lookup-person','#lookup-vehicle','#lookup-person-action','#report-heading','#report-label','#motd-label','#incident-label']) {
      const s = getComputedStyle(document.querySelector(selector));
      values[selector] = [s.color,s.backgroundColor,s.fontFamily,s.display,s.borderTopWidth,s.marginLeft];
    }
    return values;
  })()`)
  await shell(`setTheme('off')`)
  await delay(250)
  const stock = await snapshot()
  await shell(`dialogRoots.filter(n=>n.dataset.dialogTitle==='Notifications').forEach(closeDialog)`)
  for (const theme of ['p1', 'aero', 'aerolapd', 'aerodark']) {
    await shell(`setTheme('${theme}')`)
    await delay(1200)
    const contrast = await read(`['report-label','motd-label','incident-label'].map((id) => {
      const node = document.getElementById(id); const color = getComputedStyle(node).color;
      return {id,color};
    })`)
    assert.ok(theme === 'aero' ? ['rgb(0, 0, 0)','rgb(32, 32, 32)','rgb(10, 42, 68)'].includes(contrast[0].color) : contrast[0].color === 'rgb(255, 255, 255)', theme + ': report heading contrast ' + JSON.stringify(contrast))
    assert.ok(theme === 'aero' ? ['rgb(0, 0, 0)','rgb(32, 32, 32)','rgb(10, 42, 68)'].includes(contrast[2].color) : contrast[2].color === 'rgb(255, 255, 255)', theme + ': incident heading contrast ' + JSON.stringify(contrast))
    if (theme === 'p1' || theme === 'aero') assert.notEqual(contrast[1].color,'rgb(255, 255, 255)',theme + ': white MOTD text corrected on light surface')
    else assert.equal(contrast[1].color,'rgb(255, 255, 255)',theme + ': MOTD text remains light on dark cell')
    if (theme === 'p1') assert.ok(await read(`['#report-label','#green-child'].every((s) => getComputedStyle(document.querySelector(s)).fontFamily.includes('Tahoma'))`),theme + ': report font matches dispatch typography')
    assert.ok(await read(`getComputedStyle(document.querySelector('#authored-face b')).fontFamily.includes('Georgia')`),theme+': saved HTML font face reaches nested text')
    const colors = await read(`['#green','#green-child','#blue','#marked'].map((selector) => {const s=getComputedStyle(document.querySelector(selector));return [s.color,s.backgroundColor]})`)
    assert.equal(colors[0][0], 'rgb(0, 128, 0)', theme + ': inline green')
    assert.equal(colors[1][0], 'rgb(0, 128, 0)', theme + ': inherited green')
    assert.equal(colors[2][0], 'rgb(0, 85, 204)', theme + ': font color attribute')
    assert.equal(colors[3][1], 'rgb(255, 255, 0)', theme + ': report highlight')
    assert.equal(await read(`getComputedStyle(document.querySelector('.navbar-brand')).backgroundColor`), 'rgba(0, 0, 0, 0)', theme + ': transparent officer banner')
    if (theme==='p1') {
      const lookups=await read(`['character','plate'].map(id=>{const n=document.getElementById(id),s=getComputedStyle(n);return {height:s.height,font:s.fontSize,family:s.fontFamily,ink:s.webkitTextFillColor,placeholder:getComputedStyle(n,'::placeholder').webkitTextFillColor}})`)
      assert.ok(lookups.every(s=>s.height==='26px'&&s.font==='12px'&&s.family.includes('Tahoma')&&s.ink==='rgb(32, 32, 32)'&&['rgb(96, 96, 96)','rgb(32, 32, 32)'].includes(s.placeholder)),theme+': compact dispatch search fields '+JSON.stringify(lookups))
      assert.equal(await read(`getComputedStyle(document.querySelector('#lookup-submit-0 i')).webkitTextFillColor`),'rgb(32, 32, 32)','default search icon is readable on its button')
      assert.deepEqual(await read(`Array.from(document.querySelectorAll('.navbar [data-mdt-lookup-action]')).map(n=>n.getBoundingClientRect().width)`),[28,28],'both search buttons have equal width before clicking despite native inline widths')
      assert.ok(await read(`lookupSamples.length>0&&lookupSamples.every(row=>row.every(width=>width===28))`),'search buttons have stable widths on sampled first frames')
      await read(`document.getElementById('character').value='Lucy Summers'; document.getElementById('lookup-submit-0').click(); document.getElementById('lookup-submit-1').click()`)
      assert.deepEqual(await read(`Array.from(document.querySelectorAll('.navbar [data-mdt-lookup-action]')).map(n=>n.getBoundingClientRect().width)`),[28,28],'native click/ripple setup does not change either search button width')
      await read(`document.getElementById('lookup-submit-0').click()`)
      assert.equal(await read(`window.lookupRequest`),'Lucy Summers','native person search still submits')
      await read(`document.getElementById('character').value=''`)
      await shell(`wv.focus()`)
      g.focus()
      const lookupPoint=await read(`(() => {const r=document.getElementById('plate').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
      g.sendInputEvent({type:'mouseDown',...lookupPoint,button:'left',clickCount:1})
      g.sendInputEvent({type:'mouseUp',...lookupPoint,button:'left',clickCount:1})
      await delay(80)
      assert.equal(await read(`getComputedStyle(document.getElementById('plate')).outlineColor`),'rgb(195, 180, 123)','default lookup focus uses the dispatch accent '+JSON.stringify(await read(`({active:document.activeElement.id,focused:document.getElementById('plate').matches(':focus'),visible:document.getElementById('plate').getBoundingClientRect().toJSON(),outline:getComputedStyle(document.getElementById('plate')).outline})`)))
      const centeredSearch=()=>read(`Array.from(document.querySelectorAll('.navbar [data-mdt-lookup-action]')).every(n=>{const a=n.getBoundingClientRect(),b=n.querySelector('i').getBoundingClientRect();return Math.abs(a.x+a.width/2-b.x-b.width/2)<.6&&Math.abs(a.y+a.height/2-b.y-b.height/2)<.6&&getComputedStyle(n.querySelector('i')).transform==='none'})`)
      assert.ok(await centeredSearch(),'both native lookup magnifiers centered before interaction')
      const searchPoint=await read(`(() => {const r=document.getElementById('lookup-submit-1').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
      g.sendInputEvent({type:'mouseDown',...searchPoint,button:'left',clickCount:1})
      await delay(60)
      assert.ok(await centeredSearch(),'vehicle magnifier stays centered while pressed')
      g.sendInputEvent({type:'mouseUp',...searchPoint,button:'left',clickCount:1})
      g.sendInputEvent({type:'mouseMove',x:10,y:10})
      await delay(200)
      assert.ok(await centeredSearch(),'vehicle magnifier stays centered after release and pointer exit')
      await until(() => read(`document.querySelectorAll('#unwrapped-lookups [data-mdt-lookup-field]').length===2&&document.querySelectorAll('#unwrapped-lookups [data-mdt-lookup-action]').length===2`),'lookup labels without navbar or form wrappers')
      const unwrapped=await read(`['lookup-person','lookup-vehicle'].map(id=>{const n=document.getElementById(id),s=getComputedStyle(n);return {font:s.fontSize,height:s.height,background:s.backgroundColor}})`)
      assert.ok(unwrapped.every(s=>s.font==='12px'&&s.height==='26px'&&s.background==='rgb(248, 247, 242)'),'default lookup controls use their warm inset face without navbar, form, known ID or exact placeholder spacing '+JSON.stringify(unwrapped))
      await read(`document.getElementById('lookup-person').value='Lucy Summers';document.getElementById('lookup-person-action').click()`)
      assert.equal(await read(`window.unwrappedLookupRequest`),'Lucy Summers','original magnifier link handler survives styling')
      assert.equal(await read(`getComputedStyle(document.querySelector('#lookup-person-action i')).webkitTextFillColor`),'rgb(32, 32, 32)','plain magnifier link has visible ink')
      assert.ok(await read(`['person','vehicle'].every(kind=>Math.abs(document.getElementById('lookup-'+kind).getBoundingClientRect().height-document.getElementById('lookup-'+kind+'-action').getBoundingClientRect().height)<1)`),'standalone magnifier links match search field height')
      await read(`document.getElementById('lookup-person').value='';const bar=document.getElementById('unwrapped-lookups');bar.innerHTML=bar.innerHTML.replaceAll(/ data-mdt-lookup-(field|action)="1"/g,'')`)
      await until(() => read(`document.querySelectorAll('#unwrapped-lookups [data-mdt-lookup-field]').length===2&&document.querySelectorAll('#unwrapped-lookups [data-mdt-lookup-action]').length===2`),'replacement search markup styled after insertion')
      await delay(120)
      fs.writeFileSync(path.join(output,'p1-search-fields.png'),(await win.webContents.capturePage()).toPNG())
    }

    assert.ok(await read(`Array.from(document.querySelectorAll('.navbar [data-mdt-lookup-action]')).length===2&&Array.from(document.querySelectorAll('.navbar [data-mdt-lookup-action]')).every(n=>{const a=n.getBoundingClientRect(),b=n.querySelector('i').getBoundingClientRect();return Math.abs(a.x+a.width/2-b.x-b.width/2)<.6&&Math.abs(a.y+a.height/2-b.y-b.height/2)<.6})`),theme+': both lookup magnifiers remain centered')
    await read(`window.notifyClosed=0;window.badName=invalidNameNotice();window.badNameTwo=invalidNameNotice();void 0`)
    const notices=await read(`[badName.$ele[0],badNameTwo.$ele[0]].map(node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect(),text=node.querySelector('[data-notify="message"]').getBoundingClientRect();return {position:s.position,right:s.right,left:node.style.left,parent:node.parentElement.id,placement:node.getAttribute('data-notify-position'),top:r.top,bottom:r.bottom,textInside:text.left>=r.left&&text.right<=r.right&&text.top>=r.top&&text.bottom<=r.bottom}})`)
    assert.ok(notices.every(n=>n.position==='absolute'&&n.left==='12px'&&n.parent==='notification-host'&&n.placement==='top-left'&&n.textInside),theme+': invalid name toast retains the site placement and message with contained content '+JSON.stringify(notices))
    assert.ok(notices[1].top>=notices[0].bottom,theme+': error notifications stack without overlap')
    const badge=await read(`(() => {const n=badName.$ele[0].querySelector('[data-notify="icon"]'),s=getComputedStyle(n),p=getComputedStyle(n,'::before');return {align:s.alignItems,justify:s.justifyContent,width:p.width,height:p.height,position:p.position,transform:p.transform,mask:p.maskImage,message:badName.$ele.find('[data-notify="message"]').text()}})()`)
    assert.ok(badge.align==='center'&&badge.justify==='center'&&badge.width==='15px'&&badge.height==='15px'&&badge.position==='static'&&badge.transform==='none'&&badge.mask.includes('data:image/svg+xml'),theme+': exclamation has centered vector bounds inside its circle '+JSON.stringify(badge))
    assert.equal(badge.message,'Invalid name, use Firstname Lastname',theme+': original validation message is preserved')
    fs.writeFileSync(path.join(output,theme+'-invalid-name.png'),(await win.webContents.capturePage()).toPNG())
    await read(`badName.update('message','No matching person found');badName.$ele.find('[data-notify="dismiss"]').trigger('click');badNameTwo.close()`)
    await until(() => read(`notifyClosed===2`),theme+': native toast dismiss callbacks')
    await read(`window.badName=invalidNameNotice({delay:140});void 0`)
    await until(() => read(`notifyClosed===3`),theme+': notification library still dismisses on its timer')
    await read(`window.normalNotice=$.notify({message:'Success test'},{element:'#notification-host',position:'absolute',placement:{from:'bottom',align:'left'},delay:0,animate:{enter:'',exit:''}});void 0`)
    assert.ok(await read(`normalNotice.$ele[0].parentElement.id==='notification-host'&&normalNotice.$ele.attr('data-notify-position')==='bottom-left'&&getComputedStyle(normalNotice.$ele[0]).position==='absolute'`),theme+': unrelated notification placement is preserved')
    await read(`normalNotice.close()`)
    await until(() => read(`!normalNotice.$ele[0].isConnected`),'unrelated notification removed')

    await read(`document.getElementById('warrantDialog').classList.add('show')`)
    await until(()=>read(`document.getElementById('warrantDialog').dataset.mdtNativeForm==='1'`),theme+': warrant native form recognized')
    const warrant=await read(`(() => {const row=document.getElementById('suspect-row').getBoundingClientRect(),column=document.getElementById('suspect-fields').getBoundingClientRect(),photo=document.getElementById('suspect-photo').getBoundingClientRect(),fields=Array.from(document.querySelectorAll('#suspect-fields .form-control')).map(n=>n.getBoundingClientRect().toJSON()),groups=Array.from(document.querySelectorAll('#situation-row .input-group')).map(n=>getComputedStyle(n).display);return {ratio:column.width/row.width,photoRight:photo.left>=column.right-1,fields,innerWidth:column.width-30,groups,mutations:document.querySelectorAll('#warrantDialog [data-mdt-row],#warrantDialog [data-mdt-crow]').length}})()`)
    assert.ok(Math.abs(warrant.ratio-1/3)<.01&&warrant.photoRight,theme+': suspect photo and details retain the native Bootstrap columns '+JSON.stringify(warrant))
    assert.ok(warrant.fields.every((r,i)=>Math.abs(r.width-warrant.innerWidth)<1&&(!i||r.y>=warrant.fields[i-1].bottom)),theme+': suspect name, alias, race and gender stack at the column width')
    assert.ok(warrant.groups.every(d=>d==='flex')&&warrant.mutations===0,theme+': warrant input groups retain native geometry without charge-row mutation')
    fs.writeFileSync(path.join(output,theme+'-warrant-form.png'),(await win.webContents.capturePage()).toPNG())
    await read(`document.getElementById('warrantDialog').classList.remove('show')`)
    await read(`document.getElementById('modalPicture').classList.add('show'); pickImage()`)
    await until(() => read(`window.cropReady === true`), theme + ': cropper ready')
    await delay(150)
    const source = await read(`({source:getComputedStyle(document.getElementById('mugshotPreviewImage')).display,box:getComputedStyle(document.querySelector('.cropper-crop-box')).position})`)
    assert.equal(source.source, 'none', theme + ': source stays hidden behind native cropper')
    assert.equal(source.box, 'absolute', theme + ': crop box keeps library positioning')
    const before = await read(`crop.getCropBoxData()`)
    const center = await read(`(() => {const r=document.querySelector('.cropper-face').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
    g.sendInputEvent({ type:'mouseDown', x:center.x, y:center.y, button:'left', clickCount:1 })
    g.sendInputEvent({ type:'mouseMove', x:center.x+20, y:center.y+15, movementX:20, movementY:15 })
    g.sendInputEvent({ type:'mouseUp', x:center.x+20, y:center.y+15, button:'left', clickCount:1 })
    await delay(100)
    const moved = await read(`crop.getCropBoxData()`)
    assert.ok(Math.abs(before.left-moved.left)+Math.abs(before.top-moved.top)>1, theme + ': mouse dragging crop selection')
    const corner = await read(`(() => {const r=document.querySelector('.cropper-point.point-se').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
    g.sendInputEvent({ type:'mouseDown', x:corner.x, y:corner.y, button:'left', clickCount:1 })
    g.sendInputEvent({ type:'mouseMove', x:corner.x+15, y:corner.y+15, movementX:15, movementY:15 })
    g.sendInputEvent({ type:'mouseUp', x:corner.x+15, y:corner.y+15, button:'left', clickCount:1 })
    await delay(100)
    assert.ok(Math.abs((await read(`crop.getCropBoxData()`)).width-moved.width)>1, theme + ': mouse resizing crop selection')
    await read(`document.getElementById('uploadMugshot').click()`)
    const exported = await read(`exportedCrop`)
    assert.equal(exported.width,256)
    assert.equal(exported.height,256)
    assert.equal(exported.pixel[3],255,theme + ': exported crop contains pixels')
    await read(`pickImage()`)
    await until(() => read(`cropReady`), theme + ': second selected image')
    assert.equal(await read(`document.querySelectorAll('.cropper-container').length`),1,theme + ': no duplicate croppers')
    await delay(200)
    fs.writeFileSync(path.join(output, theme + '-cropper.png'), (await win.webContents.capturePage()).toPNG())
    await read(`crop.destroy(); document.getElementById('modalPicture').classList.remove('show'); document.getElementById('editorDialog').classList.add('show'); selectReport()`)
    await until(() => read(`!!document.querySelector('#editorDialog .mdt-grip')`), theme + ': resize grip ready')
    await read(`document.querySelector('#editorDialog .note-icon-bold').style.color='white'; document.querySelector('#editorDialog .note-current-fontname').style.color='white'`)
    const toolbar = await read(`(() => {const button=document.querySelector('#editorDialog .note-btn:has(.note-icon-bold)'),icon=button.querySelector('i'),label=document.querySelector('#editorDialog .note-current-fontname');return {ink:getComputedStyle(button).color,fill:getComputedStyle(button).webkitTextFillColor,icon:getComputedStyle(icon).webkitTextFillColor,label:getComputedStyle(label).webkitTextFillColor}})()`)
    assert.equal(toolbar.ink,toolbar.fill,theme+': editor toolbar has consistent button ink')
    assert.equal(toolbar.icon,toolbar.ink,theme+': editor icons override unreadable site ink')
    assert.equal(toolbar.label,toolbar.ink,theme+': editor font label overrides unreadable site ink')
    if (theme==='p1'||theme==='aero') assert.notEqual(toolbar.ink,'rgb(255, 255, 255)',theme+': dark toolbar glyphs on light faces')
    else assert.ok(['rgb(228, 228, 228)','rgb(255, 255, 255)'].includes(toolbar.ink),theme+': light toolbar glyphs on dark faces')
    const idle=await read(`getComputedStyle(document.querySelector('#editorDialog .note-btn:has(.note-icon-bold)')).backgroundColor`)
    await read(`(() => {const toolbar=document.querySelector('#editorDialog .note-toolbar');const group=document.createElement('div');group.className='note-btn-group btn-group';group.id='bootstrap-font-menu';group.innerHTML='<ul class="dropdown-menu show"><li><a href="#" style="color:white"><i class="fa fa-check" style="color:white"></i><span style="font-family:Arial;color:white">Arial</span></a></li><li><a href="#"><span style="font-family:Georgia">Georgia</span></a></li></ul>';toolbar.appendChild(group)})()`)
    const fontMenu=await read(`(() => {const menu=document.querySelector('#bootstrap-font-menu .dropdown-menu'),link=menu.querySelector('a'),span=link.querySelector('span');return {background:getComputedStyle(menu).backgroundColor,ink:getComputedStyle(menu).color,link:getComputedStyle(link).webkitTextFillColor,span:getComputedStyle(span).webkitTextFillColor,decoration:getComputedStyle(link).textDecorationLine,case:getComputedStyle(link).textTransform,family:getComputedStyle(span).fontFamily}})()`)
    assert.equal(fontMenu.ink,fontMenu.link,theme+': Bootstrap font menu link matches its panel ink')
    assert.equal(fontMenu.ink,fontMenu.span,theme+': font previews override unreadable inline colors')
    assert.equal(fontMenu.decoration,'none',theme+': font menu links are not underlined')
    assert.equal(fontMenu.case,'none',theme+': font menu preserves font name casing')
    assert.ok(fontMenu.family.includes('Arial'),theme+': font menu preserves preview typefaces')
    assert.notEqual(fontMenu.background,'rgba(0, 0, 0, 0)',theme+': font menu has an opaque theme panel')
    if(theme==='p1'||theme==='aero')assert.notEqual(fontMenu.ink,'rgb(255, 255, 255)',theme+': readable font choices on light panels')
    fs.writeFileSync(path.join(output,theme+'-font-menu.png'),(await win.webContents.capturePage()).toPNG())
    await read(`document.getElementById('bootstrap-font-menu').remove()`)
    await read(`document.querySelector('#editorDialog .note-btn:has(.note-icon-bold)').classList.add('active')`)
    assert.notEqual(await read(`getComputedStyle(document.querySelector('#editorDialog .note-btn:has(.note-icon-bold)')).backgroundColor`),idle,theme+': editor toolbar active state has a distinct face')
    await read(`document.querySelector('#editorDialog .note-btn:has(.note-icon-bold)').classList.remove('active')`)

    const dialogBefore = await read(`(() => {const r=document.querySelector('#editorDialog .modal-content').getBoundingClientRect();return {width:r.width,height:r.height}})()`)
    const grip = await read(`(() => {const r=document.querySelector('#editorDialog .mdt-grip').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`)
    g.sendInputEvent({type:'mouseMove',x:10,y:10})
    await delay(60)
    assert.equal(await read(`getComputedStyle(document.querySelector('#editorDialog .mdt-grip')).opacity`),'0',theme+': resize grip hidden at rest')
    g.sendInputEvent({type:'mouseMove',x:grip.x,y:grip.y})
    await delay(60)
    assert.equal(await read(`getComputedStyle(document.querySelector('#editorDialog .mdt-grip')).opacity`),'1',theme+': resize grip appears only over its corner')

    g.sendInputEvent({type:'mouseDown',x:grip.x,y:grip.y,button:'left',clickCount:1})
    await until(() => read(`document.querySelector('#editorDialog .mdt-grip').getAttribute('data-mdt-resizing')==='1'`),theme+': resize pointer capture started')
    g.sendInputEvent({type:'mouseMove',x:grip.x+90,y:grip.y+45,movementX:90,movementY:45})
    assert.equal(await read(`document.querySelector('#editorDialog .mdt-grip').getAttribute('data-mdt-resizing')`),'1',theme+': resize grip stays visible during pointer capture')
    g.sendInputEvent({type:'mouseUp',x:grip.x+90,y:grip.y+45,button:'left',clickCount:1})
    g.sendInputEvent({type:'mouseMove',x:10,y:10})
    await delay(500)
    const resized = await read(`(() => {const dialog=document.getElementById('editorDialog');const r=dialog.querySelector('.modal-content').getBoundingClientRect();return {open:dialog.classList.contains('show'),width:r.width,height:r.height,bodyOverflow:dialog.querySelector('.modal-body').style.overflowY,bodyMaxHeight:dialog.querySelector('.modal-body').style.maxHeight}})()`)
    assert.ok(resized.open,theme + ': resize release keeps editor open')
    assert.equal(await read(`getComputedStyle(document.querySelector('#editorDialog .mdt-grip')).opacity`),'0',theme+': resize grip hides again after release and pointer exit')
    assert.ok(resized.width>dialogBefore.width+40 && resized.height>dialogBefore.height+20,theme + ': resize dimensions remain after release')
    assert.equal(resized.bodyOverflow,'',theme + ': resize does not add a dialog scroller')
    assert.equal(resized.bodyMaxHeight,'none',theme + ': explicitly resized body fills the frame without its opening height cap')
    await read(`(() => { window.afterResizeClick = false; const button=document.createElement('button');button.id='resize-next';button.textContent='Next action';button.onclick=()=>window.afterResizeClick=true;document.querySelector('#editorDialog .modal-body').appendChild(button);button.click();button.remove(); })()`)
    assert.ok(await read(`window.afterResizeClick`),theme + ': resize release does not swallow the next action')
    await delay(450)
    await read(`selectReport()`)
    await read(`document.querySelector('#editorDialog .dropdown-fontname a[data-value="Arial"]').click()`)
    await delay(250)
    assert.ok(await read(`Array.from(document.querySelectorAll('#editorDialog .note-editable font, #editorDialog .note-editable span')).some(n=>getComputedStyle(n).fontFamily.includes('Arial'))`),theme+': selected Summernote font is visible '+JSON.stringify(await read(`({code:$('#report-editor').summernote('code'),selection:String(getSelection()),nodes:Array.from(document.querySelectorAll('#editorDialog .note-editable *')).map(n=>({tag:n.tagName,font:getComputedStyle(n).fontFamily,style:n.getAttribute('style')}))})`)))
    await read(`document.getElementById('viewed-report').innerHTML=$('#report-editor').summernote('code')`)
    assert.ok(await read(`Array.from(document.querySelectorAll('#viewed-report font,#viewed-report span')).some(n=>getComputedStyle(n).fontFamily.includes('Arial'))`),theme+': authored font survives in a viewed report')
    const editorFace=await read(`(() => {const n=document.querySelector('#editorDialog .note-editable'),s=getComputedStyle(n);return {background:s.backgroundColor,color:s.color}})()`)
    assert.ok(theme==='p1'||theme==='aero'?editorFace.background!=='rgb(31, 35, 38)'&&editorFace.color!=='rgb(255, 255, 255)':editorFace.color!=='rgb(0, 0, 0)',theme+': editor face and default ink follow skin '+JSON.stringify(editorFace))
    await read(`$('#report-editor').summernote('foreColor','#008000')`)
    await read(`$('#report-editor').summernote('backColor','#ffff00')`)
    await delay(1000)
    const editor = await read(`(() => {const e=document.querySelector('#editorDialog .note-editable');const n=Array.from(e.querySelectorAll('font,span')).find(n=>!n.childElementCount&&n.textContent.trim())||e;return {html:$('#report-editor').summernote('code'),color:getComputedStyle(n).color,background:getComputedStyle(n).backgroundColor}})()`)
    assert.equal(editor.color,'rgb(0, 128, 0)',theme + ': Summernote foreground color survives contrast passes')
    assert.ok(await read(`Array.from(document.querySelectorAll('#editorDialog .note-editable *')).some((n) => getComputedStyle(n).backgroundColor === 'rgb(255, 255, 0)')`),theme + ': selected background color survives')
    await read(`document.getElementById('viewed-report').innerHTML = $('#report-editor').summernote('code')`)
    assert.equal(await read(`getComputedStyle(Array.from(document.querySelectorAll('#viewed-report font, #viewed-report span')).find(n=>!n.childElementCount&&n.textContent.trim())).color`),'rgb(0, 128, 0)',theme + ': saved report color')
    await read(`selectReport(); document.querySelector('#editorDialog .note-color .dropdown-toggle').click()`)
    await delay(100)
    assert.ok(await read(`document.querySelector('#editorDialog .note-color-btn[data-event="foreColor"][data-value="#00FF00"]').checkVisibility({checkVisibilityCSS:true})`),theme + ': color picker is visible')
    assert.ok(await read(`getComputedStyle(document.querySelector('#editorDialog i.note-icon-bold'), '::before').fontFamily.includes('summernote')`),theme + ': editor icon font remains intact')
    const palette = await read(`(() => {
      const colors = document.querySelectorAll('#editorDialog .note-color-btn[data-event="foreColor"]');
      const first = colors[0].getBoundingClientRect(); const last = colors[colors.length - 1]; const r = last.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { width:first.width, lastVisible:hit === last || last.contains(hit) };
    })()`)
    assert.ok(palette.width <= 21,theme + ': palette swatches keep native dimensions')
    assert.ok(palette.lastVisible,theme + ': final palette row is reachable outside the dialog face')
    fs.writeFileSync(path.join(output, theme + '-palette.png'), (await win.webContents.capturePage()).toPNG())
    await read(`document.querySelector('#editorDialog .note-color-btn[data-event="foreColor"][data-value="#00FF00"]').click()`)

    await delay(250)
    assert.equal(await read(`getComputedStyle(Array.from(document.querySelectorAll('#editorDialog .note-editable font, #editorDialog .note-editable span')).find(n=>!n.childElementCount&&n.textContent.trim())).color`),'rgb(0, 255, 0)',theme + ': actual color-palette click')
    fs.writeFileSync(path.join(output, theme + '-editor.png'), (await win.webContents.capturePage()).toPNG())
    await read(`document.getElementById('editorDialog').classList.remove('show')`)
    count++
    console.log('PASS ' + theme + ' lookup and notification icons, native warrant layout, Cropper.js and Summernote fonts/colors')
  }
  await shell(`setTheme('off')`)
  await delay(1200)
  assert.equal(await read(`document.querySelector('#editorDialog .modal-dialog').style.getPropertyPriority('width')`),'important','Original MDC restores native dialog sizing priority')
  assert.deepEqual(await snapshot(),stock,'Original MDC returns to the stock page palette and layout')
  assert.equal(await shell(`getComputedStyle(document.getElementById('tab-nav')).display`),'none')
  assert.deepEqual(await read(`Array.from(document.querySelectorAll('style[id^="mdt-"], .mdt-grip')).map((n) => n.id || n.className)`),[],'Original MDC has no injected visual layers')
  assert.equal(await shell(`document.getElementById('toolbar') || document.getElementById('hb-menu')`),null)
  await read(`window.badName=invalidNameNotice();void 0`)
  assert.ok(await read(`badName.$ele[0].parentElement.id==='notification-host'&&badName.$ele.attr('data-notify-position')==='top-left'&&getComputedStyle(badName.$ele[0]).position==='absolute'`),'Original MDC keeps the site notification settings')
  await read(`badName.close()`)
  await until(() => read(`!badName.$ele[0].isConnected`),'Original notification removed')
  console.log('PASS stock Original MDC after switching through every skin; toolbar and Menu removed')
  await shell(`setTheme('p1')`)
  return count + 1
}

module.exports = { vendorResponse, widgetFixture, verifyWidgets }
