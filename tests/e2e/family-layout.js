const { chromium } = require('playwright');

const FLOW_IDS = ['famdescubre','famdescubrean','famoferta','famcrear','famcalma','famadmin','famficha','famavisar','famfichapep','faminvitar','famajustes','famretirar','famplan','fambaja','famcancelado','faminvite','fammember','famayuda','famayudaan','famcomparto','famverlucia','famplanmiembro','famsalir','famtermina','famfuera','famcerrar','famtienda','fampendiente','famlleno','famunido','famterminado','famterminadomiembro','famcaducada','fampremiumpropio','famretirado','fameliminar'];
const GETC = `const getC = () => { if (window.__lab) return window.__lab; const el=document.querySelector('.tp-phone'); const k=Object.keys(el||{}).find(x=>x.startsWith('__reactFiber')); let f=el&&el[k]; while(f){if(f.stateNode&&f.stateNode.logic&&f.stateNode.logic.labVals)return f.stateNode.logic; f=f.return;} return null; };`;

(async () => {
  const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless:true });
  const page = await browser.newPage({ viewport:{width:1680,height:916} });
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.LAB_URL || 'http://localhost:4173/concept.html', { waitUntil:'load' });
  await page.waitForFunction(() => window.__lab);
  const failures=[];
  const checks={ flows:0, homeBlocks:0, closeButtons:0, endingAndFamilyBlocks:0 };

  async function selectFlow(id) {
    await page.evaluate(({id,GETC}) => (new Function(GETC + `const c=getC(),f=c.labFlows().find(x=>x.id===${JSON.stringify(id)}); if(!f) throw Error('flujo ausente '+${JSON.stringify(id)}); c.labSelect(f); c.labLabSet({tab:'phone',pv:'closed',case:null,view:'flow'});`))(), {id,GETC});
    await page.waitForTimeout(150);
  }
  async function familyFlowState(id) {
    await selectFlow(id);
    await page.waitForTimeout(150);
  }
  const inspectVisible = () => page.evaluate(() => {
    const visible=el=>!!el&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
    const scrollFor=el=>el.closest('.tp-scroll');
    const contained=el=>{const s=scrollFor(el);if(!s||!s.contains(el))return false;const r=el.getBoundingClientRect(),q=s.getBoundingClientRect(),top=q.top+s.clientTop,bottom=top+s.scrollHeight-s.scrollTop;return r.left>=q.left-1&&r.right<=q.right+1&&r.top>=top-1&&r.bottom<=bottom+1;};
    const isHomeCard=el=>el.matches('.odin-card,button,[role="button"]')&&/Mi Familia/.test(el.innerText||'')&&/NUEVO|cuida de las personas adultas|llegan mensajes/i.test(el.innerText||'');
    const cards=[...document.querySelectorAll('.tp-phone .odin-card,.tp-phone [role="button"]')].filter(el=>visible(el)&&isHomeCard(el));
    const closeButtons=[...document.querySelectorAll('.tp-phone button[aria-label^="Cerrar aviso:"]')].filter(visible);
    const close=closeButtons.map(el=>{
      const r=el.getBoundingClientRect(),parent=el.parentElement;
      const card=el.closest('.odin-card')||(parent&&parent.querySelector('.odin-card')?parent:null);
      const b=card?.getBoundingClientRect();
      return {el,insideScroll:contained(el),cssSize:[el.offsetWidth,el.offsetHeight],insideCard:!!b&&r.left>=b.left-1&&r.right<=b.right+1&&r.top>=b.top-1&&r.bottom<=b.bottom+1};
    });
    const familyBlocks=[...document.querySelectorAll('.tp-phone .tp-scroll *')].filter(visible).filter(el=>{
      const t=(el.innerText||'').trim();
      return /El plan familiar termina|Tu plan familiar está activo|Ya no estás en Familia Navarro|Has salido de Familia Navarro|Cancelar el plan familiar|Salir de Familia Navarro|Premium del grupo Familia Navarro/.test(t)&&![...el.children].some(c=>/El plan familiar termina|Tu plan familiar está activo|Ya no estás en Familia Navarro|Has salido de Familia Navarro|Cancelar el plan familiar|Salir de Familia Navarro|Premium del grupo Familia Navarro/.test(c.innerText||''));
    });
    return {cards:cards.map(el=>({contained:contained(el),label:el.getAttribute('aria-label')||el.innerText.slice(0,80)})),close,familyBlocks:familyBlocks.map(el=>({contained:contained(el),text:(el.innerText||'').trim().slice(0,90)}))};
  });

  for(const id of FLOW_IDS){
    await familyFlowState(id); checks.flows++;
    const state=await inspectVisible();
    for(const card of state.cards){checks.homeBlocks++;if(!card.contained)failures.push(`${id}: famHome no está dentro de .tp-scroll (${card.label})`);}
    for(const close of state.close){checks.closeButtons++;if(!close.insideScroll||!close.insideCard||close.cssSize[0]<44||close.cssSize[1]<44)failures.push(`${id}: X fuera de la tarjeta/scroll o tamaño CSS ${close.cssSize.join('x')}`);}
    for(const block of state.familyBlocks){checks.endingAndFamilyBlocks++;if(!block.contained)failures.push(`${id}: bloque familiar fuera de .tp-scroll (${block.text})`);}
    if(id==='famplan'||id==='famplanmiembro'){
      const individual=await page.locator('.tp-phone .tp-scroll').getByText('Protección básica',{exact:true}).count();
      if(individual)failures.push(`${id}: aparece Protección básica con grupo activo`);
    }
  }

  await familyFlowState('famdescubrean');
  const noteCheck=()=>page.evaluate(()=>{
    const note=[...document.querySelectorAll('.tp-phone *')].find(el=>el.getClientRects().length&&(el.innerText||'').trim()==='¿Le llegan mensajes así a alguien de tu familia?');
    const scroll=note?.closest('.tp-scroll');
    const buttons=[...document.querySelectorAll('.tp-phone button,.tp-phone a')];
    const action=buttons.find(el=>(el.innerText||'').trim()==='Comprobarlo en la app de BBVA');
    const open=buttons.find(el=>(el.innerText||'').trim()==='Abrir de todos modos');
    if(!note||!scroll||!action||!open)return {ok:false,reason:'falta nota, scroll o acción de referencia'};
    const n=note.getBoundingClientRect(),a=action.getBoundingClientRect(),o=open.getBoundingClientRect();
    return {ok:scroll.contains(note)&&n.top>a.bottom&&n.top>o.bottom,top:n.top,checkBottom:a.bottom,openBottom:o.bottom};
  });
  const noteResult=await noteCheck();
  checks.endingAndFamilyBlocks++;
  if(!noteResult.ok)failures.push(`famdescubrean: nota fuera del scroll o antes de las acciones (${JSON.stringify(noteResult)})`);

  await familyFlowState('fambaja');
  const bajaCheck=()=>page.evaluate(()=>{
    const screen=document.querySelector('.tp-phone [data-screen-label="Mi Familia"]');
    const scroll=screen?.querySelector('.tp-scroll');
    const header=scroll?.previousElementSibling;
    const first=[...(scroll?.children||[])].find(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
    if(!scroll||!header||!first)return {ok:false,reason:'falta scroll/cabecera/primer bloque'};
    return {ok:first.getBoundingClientRect().top>=header.getBoundingClientRect().bottom-1,firstTop:first.getBoundingClientRect().top,headerBottom:header.getBoundingClientRect().bottom};
  });
  const bajaResult=await bajaCheck();
  checks.endingAndFamilyBlocks++;
  if(!bajaResult.ok)failures.push(`fambaja: primer hijo visible del scroll solapa con la cabecera (${JSON.stringify(bajaResult)})`);

  // Controles negativos: cada regla tiene que detectar su propio defecto y retirar la inyección.
  await selectFlow('famdescubre');
  const xNegative=await page.evaluate(()=>{
    const x=document.querySelector('.tp-phone button[aria-label^="Cerrar aviso:"]');if(!x)return {ok:false,reason:'no hay X'};
    const valid=()=>x.offsetWidth>=44&&x.offsetHeight>=44;
    const style=document.createElement('style');style.textContent='.tp-phone button[aria-label^="Cerrar aviso:"]{width:30px!important;height:30px!important}';document.head.append(style);
    const detected=!valid();style.remove();return {ok:valid()&&detected,detected,size:[x.offsetWidth,x.offsetHeight]};
  });
  if(!xNegative.ok)failures.push(`control negativo X: no se detectó el tamaño incorrecto (${JSON.stringify(xNegative)})`);
  await familyFlowState('famdescubrean');
  const noteNegative=await page.evaluate(()=>{
    const note=[...document.querySelectorAll('.tp-phone *')].find(el=>el.getClientRects().length&&(el.innerText||'').trim()==='¿Le llegan mensajes así a alguien de tu familia?');
    if(!note)return {ok:false,reason:'no hay nota'};
    const valid=()=>{const s=note.closest('.tp-scroll'),n=note.getBoundingClientRect(),all=[...document.querySelectorAll('.tp-phone button,.tp-phone a')],a=all.find(el=>(el.innerText||'').trim()==='Comprobarlo en la app de BBVA'),o=all.find(el=>(el.innerText||'').trim()==='Abrir de todos modos');return !!s&&!!a&&!!o&&s.contains(note)&&n.top>a.getBoundingClientRect().bottom&&n.top>o.getBoundingClientRect().bottom;};
    const before=valid(),style=document.createElement('style');style.textContent='[data-f12d-note-control]{transform:translateY(-900px)!important}';note.setAttribute('data-f12d-note-control','');document.head.append(style);const detected=!valid();style.remove();note.removeAttribute('data-f12d-note-control');return {ok:before&&detected&&valid(),detected};
  });
  if(!noteNegative.ok)failures.push(`control negativo nota: no se detectó el desplazamiento (${JSON.stringify(noteNegative)})`);
  await familyFlowState('fambaja');
  const bajaNegative=await page.evaluate(()=>{
    const scroll=document.querySelector('.tp-phone [data-screen-label="Mi Familia"] .tp-scroll'),header=scroll?.previousElementSibling,first=[...(scroll?.children||[])].find(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
    if(!scroll||!header||!first)return {ok:false,reason:'falta bloque'};
    const valid=()=>first.getBoundingClientRect().top>=header.getBoundingClientRect().bottom-1;
    const before=valid(),style=document.createElement('style');style.textContent='[data-f12d-baja-control]{transform:translateY(-900px)!important}';first.setAttribute('data-f12d-baja-control','');document.head.append(style);const detected=!valid();style.remove();first.removeAttribute('data-f12d-baja-control');return {ok:before&&detected&&valid(),detected};
  });
  if(!bajaNegative.ok)failures.push(`control negativo baja: no se detectó el solapamiento (${JSON.stringify(bajaNegative)})`);

  console.log(`Flujos ${checks.flows}/${FLOW_IDS.length}; bloques Inicio ${checks.homeBlocks}; X ${checks.closeButtons}; bloques familiares ${checks.endingAndFamilyBlocks}; controles negativos 3/3; fallos ${failures.length}`);
  if(errors.length)failures.push(...errors.map(error=>'pageerror: '+error));
  if(failures.length){console.error(failures.join('\n'));await browser.close();process.exitCode=1;return;}
  await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1;});
