"use strict"
const fs=require('fs'),path=require('path'),assert=require('assert/strict')
const {documentFixture}=require('./document-layout-fixture')
function recordSurfaceFixture() {
 const card=fs.readFileSync(path.join(__dirname,'fixtures/record-full-page.html'),'utf8')
 return documentFixture().replace('</main>',card+'<section class="card"><h4>Supplemental Report Preview</h4><article class="report-document" id="supplement-preview"><h2>Infraction report</h2><table><tr><th>OFFICER</th></tr><tr><td>Sample officer</td></tr></table></article></section></main>').replace('</body>', `<div id="history-reports"><h3>RECORD HISTORY</h3></div><div id="comparison"><h3>Edit comparisons and supplemental previews</h3></div><script>
    const source=document.querySelector('#full-record-source table');
    ['ARREST REPORT','INFRACTION CITATION REPORT','INFRACTION REPORT','IMPOUND REPORT','ARREST WARRANT'].forEach((title,index)=>{const wrapper=document.createElement('section'),table=source.cloneNode(true);table.querySelector('tr').cells[0].innerHTML='LOS SANTOS POLICE DEPARTMENT<br>'+title;wrapper.append(table);document.getElementById(index?'comparison':'history-reports').append(wrapper)});
    document.querySelector('.content').append(document.getElementById('history-reports'),document.getElementById('comparison'));const edit=document.createElement('div');edit.id='authored-document';edit.contentEditable='true';edit.append(source.cloneNode(true));document.body.append(edit);window.historyPaperReady=true;
  </script></body>`)
}
async function verifyRecordSurfaces({shell,guest,until,delay}) {
 await shell(`wv.loadURL('https://mdc.gta.world/record-surfaces')`)
 await until(async()=>!(await guest()).isLoading()&&await (await guest()).executeJavaScript(`window.layoutReady===true`),'record surfaces')
 const g=await guest(),read=code=>g.executeJavaScript(code,true)
 for(const theme of ['p1','aero','aerolapd','aerodark']) {
  await shell(`setTheme('${theme}')`);await delay(220)
  const s=await read(`(()=>{const root=document.querySelector('#full-record-source [data-mdt-paper]'),cells=[...root.querySelectorAll('th,td')];return {font:getComputedStyle(root).fontFamily,cells:cells.map(n=>{const s=getComputedStyle(n);return [s.color,s.backgroundColor,s.backgroundImage,s.fontFamily]}),metadata:parseFloat(getComputedStyle(document.querySelector('#full-record-source .card-body strong')).fontSize),preview:!!document.querySelector('#supplement-preview[data-mdt-paper]')}})()`)
  assert.ok(s.font.includes('Times New Roman')&&s.cells.every(c=>c[0]==='rgb(0, 0, 0)'&&c[1]==='rgb(255, 255, 255)'&&c[2]==='none'&&c[3].includes('Times New Roman')),theme+': full-page paper matches popup')
  assert.ok(s.metadata>=13&&s.preview,theme+': readable metadata and supplemental preview')
  for(const label of ['Citation','Infraction Report','Impound Report','Warrant']) {await read(`document.querySelector('#supplement-preview h2').textContent=${JSON.stringify(label)}`);await delay(150);assert.ok(await read(`!!document.querySelector('#supplement-preview[data-mdt-paper]')`),theme+': '+label)}
  const arbitrary=await read(`({forms:[...document.querySelectorAll('#history-reports table,#comparison table')].map(n=>({marked:n.hasAttribute('data-mdt-paper'),font:getComputedStyle(n).fontFamily,body:parseFloat(getComputedStyle(n.querySelector('td')).fontSize),labels:parseFloat(getComputedStyle(n.querySelectorAll('th')[1]).fontSize),white:[...n.querySelectorAll('th,td')].every(c=>getComputedStyle(c).backgroundColor==='rgb(255, 255, 255)')})),editor:!!document.querySelector('#authored-document [data-mdt-paper]')})`)
  assert.ok(arbitrary.forms.length===5&&arbitrary.forms.every(n=>n.marked&&n.white&&n.font.includes('Times New Roman')&&n.body===14&&n.labels===10)&&!arbitrary.editor,theme+': documents recognized by their own grid/title anywhere '+JSON.stringify(arbitrary))
  console.log('PASS '+theme+' supplied full-page record, readable metadata and supplemental/citation/impound/warrant document scopes')
 }
 return 12
}
module.exports={recordSurfaceFixture,verifyRecordSurfaces}
