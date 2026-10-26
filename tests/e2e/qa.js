// QA battery: runs every executable extreme case end to end and checks that the case journey resolves.
const { chromium } = require('playwright');
const fs = require('fs');
const GETC = `const getC = () => { if (window.__lab) return window.__lab; const el = document.querySelector('.tp-phone'); const k = Object.keys(el || {}).find(k => k.startsWith('__reactFiber')); let f = el && el[k]; while (f) { if (f.stateNode && f.stateNode.logic && f.stateNode.logic.labVals) return f.stateNode.logic; f = f.return; } return null; };`;
const LINK = 'https://clc.li/SeurPago-esp';
const SPEC = {
  'nuevo.c1': [['fire'], ['js', 'c.auLogin()'], ['online'], ['js', 'c.auLogin()'], ['wait', 300]],
  'nuevo.c2': [['js', 'c.auLogin()'], ['js', 'c.auSet({code:"111111"})'], ['js', 'c.auVerify()'], ['js', 'c.auSet({code:"123456"})'], ['js', 'c.auVerify()'], ['wait', 2300]],
  'registro.c1': [['js', 'c.auSignup()'], ['js', 'c.auSet({pass:"MiClaveLarga2026", err:{}})'], ['js', 'c.auSignup()']],
  'registro.c2': [['js', 'c.auSignup()'], ['js', 'c.auSet({terms:true})'], ['js', 'c.auSignup()']],
  'registro.c3': [['js', 'c.auSignup()'], ['online'], ['js', 'c.auSignup()']],
  'bienvenida.c1': [['js', 'c.obNext()'], ['js', 'c.obNext()']],
  'bienvenida.c2': [['js', 'c.obSet({temas:{}})'], ['js', 'c.obNext()']],
  'bienvenida.c3': [['click', 'Lo haré más tarde']],
  'dia1.c1': [['click', 'Ahora no'], ['js', 'c.go("notificaciones")']],
  'dia1.c2': [['click', 'Comprobar'], ['online'], ['js', 'c.anOpen("enlace")'], ['js', `c.anSet({value:"${LINK}"})`], ['js', 'c.anAnalyze()'], ['wait', 2000]],
  'tema1.c1': [['click', 'Pago, es muy poco dinero'], ['click', 'Comprobar', true], ['click', 'Probar otra vez'], ['click', 'Lo borro. Si espero un paquete'], ['click', 'Comprobar', true], ['click', 'Terminar el tema'], ['wait', 400]],
  'tema1.c2': [['js', 'c.go("aprende")'], ['js', 'c.openLesson("sms")'], ['js', 'c.finishLesson("sms")'], ['wait', 300]],
  'aldia.c1': [['fire'], ['js', 'c.anAnalyze()'], ['wait', 2000], ['js', 'c.anAnalyze(c.state.an.value)'], ['wait', 2100]],
  'aldia.c2': [['click', 'Sin conexión no podemos analizar'], ['online'], ['js', 'c.anAnalyze()'], ['wait', 2100]],
  'dormido.c1': [['fire'], ['click', 'No lo he hecho, deshacer']],
  'dormido.c2': [['online'], ['js', 'c.complete("familiar")']],
  'tope.c1': [['fire'], ['click', 'Ver qué puedes hacer'], ['click', 'Esperar al día 1']],
  'tope.c2': [['click', 'Ver Premium', true], ['js', 'c.activatePremium("anual")'], ['js', 'c.anAnalyze()'], ['wait', 2100]],
  'tope.c3': [['click', 'Tu correo ha aparecido en una filtración nueva'], ['click', 'Resolverlo paso a paso']],
  'comprobar.c1': [['js', 'c.anOpen("qr")'], ['click', 'Ahora no'], ['js', `c.anSet({value:"${LINK}"})`], ['js', 'c.anAnalyze()'], ['wait', 2100]],
  'comprobar.c2': [['js', 'c.anOpen("qr")'], ['click', 'Pegar el enlace a mano'], ['js', `c.anSet({value:"${LINK}"})`], ['js', 'c.anAnalyze()'], ['wait', 2100]],
  'pzlink.c1': [['click', 'de todos modos'], ['js', 'c.renderVals().sheet.close()']],
  'pzlink.c2': [['js', 'c.anSet({view:"quepaso"})'], ['js', 'c.openPlan("tarjeta")'], ['js', 'c.anSet({pz: Object.assign({}, c.state.an.pz, {done:{0:true}})})']],
  'pzpaid.c1': [['js', 'c.anSet({pz: Object.assign({}, c.state.an.pz, {done:{0:true}})}); c.caseUpsert({id:"pz-tarjeta", kind:"plan", plan:"tarjeta", done:{0:true}})'], ['js', 'c.go("ayuda", {from:"ayuda"})'], ['js', 'c.openPlan("tarjeta", "ayuda")']],
  'pzpaid.c2': [['js', 'c.anSet({pz: Object.assign({}, c.state.an.pz, {done:{0:true}})})'], ['click', '017']],
  'ayuda.c1': [['js', 'c.sosSend()'], ['fire'], ['js', 'c.sosSend()']],
  'ayuda.c2': [['js', 'c.sosSend()'], ['online'], ['js', 'c.sosSend()']],
  'nvmensaje.c1': [['fire'], ['js', 'c.anAnalyze()'], ['wait', 2100]],
  'nvmensaje.c2': [['fire'], ['js', 'c.anAnalyze()'], ['wait', 2100]],
  'nvauto.c1': [['click', 'Activar', true], ['js', 'c.go("notificaciones")']],
  'nvauto.c2': [['click', 'Desactivar los avisos automáticos'], ['js', 'c.setState({sheet:{kind:"auto"}})'], ['click', 'Activar', true]],
  'nvaviso.c1': [['click', 'Ya lo he hecho'], ['click', 'Aún no lo he hecho']],
  'nvaviso.c2': [['click', 'Tu correo ha aparecido en una filtración nueva'], ['js', 'c.go("home")']],
  'nvborrar.c1': [['js', 'c.renderVals().br.authorize()'], ['js', 'c.renderVals().br.toggleConsent()'], ['js', 'c.renderVals().br.authorize()']],
  'nvborrar.c2': [['js', 'c.go("paywall")'], ['js', 'c.activatePremium("anual")'], ['js', 'c.go("borrar", {from:"huella"})']],
  'nvborrar.c3': [['js', 'c.renderVals().br.authorize()'], ['online'], ['js', 'c.renderVals().br.authorize()']],
  'nvborrado.c1': [['js', 'c.renderVals().br.rows.find(r => r.canClaim).claim()']],
  'nvcasos.c1': [['js', 'c.openPlan("bizum", "ayuda")'], ['js', 'c.anSet({pz: Object.assign({}, c.state.an.pz, {done: Object.assign({}, c.state.an.pz.done, {1:true})})})']],
  'nvcasos.c2': [['js', 'c.renderVals().ayuda && 0'], ['js', '(c.renderVals().cases.find(x => /Revisión/.test(x.title)) || {open(){}}).open()']],
  'premnuevo.c1': [['js', 'c.setState({sheet:{kind:"pr-cancel"}})'], ['js', 'c.renderVals().sheet.danger()']],
  'premnuevo.c2': [['js', 'c.go("huella")'], ['js', 'c.renderVals().bioUnlock()'], ['wait', 500]],
  'premmitad.c1': [['js', 'c.mariaSend()'], ['online'], ['js', 'c.mariaSend()']],
  'premmitad.c2': [['js', 'c.complete("li1")'], ['click', 'No lo he hecho, deshacer']],
  'famoferta.c1': [['js', 'c.famSet({offer: Object.assign({}, c.state.fam.offer, {n:3})})'], ['js', 'c.renderVals().fam.offer.go()']],
  'famoferta.c2': [['js', 'c.famSet({offer: Object.assign({}, c.state.fam.offer, {n:3})})'], ['js', 'c.renderVals().fam.offer.go()'], ['js', 'c.famBuy()'], ['wait', 1900]],
  'famcrear.c1': [['js', 'c.famCreate()'], ['js', 'c.famInviteCreate()'], ['js', 'c.famSheetSet({nick:"Mamá"})'], ['js', 'c.famInviteCreate()']],
  'famcrear.c2': [['js', 'c.famSheet({kind:"inviteView", id:"ana"})'], ['js', 'c.renderVals().fam.sh.cancelInv()']],
  'famadmin.c1': [['js', 'c.famSheet({kind:"reply", req:"r1", msg:null})'], ['js', 'c.famSheetSet({msg:1})'], ['js', 'c.famSendReply()']],
  'famadmin.c2': [['js', 'c.famSheet({kind:"reply", req:"r1", msg:null})'], ['assert', 'const g = c.renderVals().fam.sh.groups; return g[0].title === "Lo más urgente" && g[0].opts[0].text.indexOf("No hagas ese pago") === 0 && !g.some(x => x.opts.some(o => /no veo nada raro/i.test(o.text)))'], ['js', 'c.famSheetSet({msg:6})'], ['js', 'c.famSendReply()']],
  'famadmin.c3': [['js', 'c.famSheet({kind:"reply", req:"r1", msg:null})'], ['js', 'c.famSheetSet({msg:1})'], ['js', 'c.famSendReply()'], ['online'], ['js', 'c.famSendReply()']],
  'famavisar.c1': [['js', 'c.famSendAviso()'], ['js', 'c.famSheetSet({msg:10})'], ['js', 'c.famSendAviso()']],
  'famavisar.c2': [['js', 'c.famSheetSet({msg:10})'], ['js', 'c.famSendAviso()']],
  'famficha.c1': [['js', 'c.famBack()']],
  'famficha.c2': [['js', 'c.famGo("ficha", {mid:"mama"})'], ['js', 'c.renderVals().fam.ficha.retirar()'], ['js', 'c.famClose()']],
  'famajustes.c1': [['js', 'c.famSheet({kind:"cancel"})'], ['js', 'c.famClose()']],
  'famajustes.c2': [['js', 'c.famSet({myShare: Object.assign({}, c.state.fam.myShare, {actividad:0})})']],
  'faminvite.c1': [['js', 'c.famJoin()'], ['js', 'c.famSet({join: Object.assign({}, c.state.fam.join, {age:true})})'], ['js', 'c.famJoin()']],
  'faminvite.c2': [['wait', 100], ['js', 'c.famSet({join: Object.assign({}, c.state.fam.join, {share:{huella:0, enlaces:0, actividad:0}})})'], ['js', 'c.famJoin()']],
  'fammember.c1': [['js', 'c.famSheet({kind:"salir"})'], ['js', 'c.renderVals().fam.sh.confirm()']],
  'famayuda.c1': [['js', 'c.famSheetSet({step:"form", obj:{kind:"other", t:"Un mensaje o una llamada", v:null}, err:false})'], ['js', 'c.famSheetSet({motive:"Me piden dinero"})'], ['js', 'c.famSendAyuda()'], ['js', 'c.renderVals().fam.sh.toSos()']],
  'famayuda.c2': [['js', 'c.famSendAyuda()'], ['js', 'c.famSheetSet({motive:"No sé si es seguro"})'], ['js', 'c.famSendAyuda()']],
  'famayuda.c3': [['js', 'c.famSendAyuda()'], ['online'], ['js', 'c.famSendAyuda()']]
};
(async () => {
  const baseline = process.argv[2] === '--baseline';
  const only = baseline ? null : process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1680, height: 916 } });
  let errs = [];
  p.on('console', m => { const t = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && !/status of 404|TUNNEL|Failed to load resource/.test(t)) errs.push(t); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto((process.env.LAB_URL || 'http://localhost:4173/'), { waitUntil: 'load' });
  await p.waitForTimeout(2200);
  const res = {}, lines = [];
  for (const key of Object.keys(SPEC)) {
    if (only && key.indexOf(only) !== 0) continue;
    const [fid, cid] = key.split('.');
    errs = [];
    await p.evaluate(`(() => { ${GETC} const c = getC(); const f = c.labFlows().find(x => x.id === ${JSON.stringify(fid)}); c.labSelect(f); })()`);
    await p.waitForTimeout(500);
    const ci = await p.evaluate(`(() => { ${GETC} const c = getC(); return (c.labD().cases || []).findIndex(x => x.id === ${JSON.stringify(cid)}); })()`);
    await p.locator('.lab-b article button').nth(ci).click();
    await p.waitForTimeout(650);
    const log = [];
    if (baseline) { await p.waitForTimeout(1200); const g = await p.evaluate(`(() => { ${GETC} const c = getC(); const L = c.state.lab; return Object.keys(L.reached).filter(k => k !== '0' && L.reached[k]).length; })()`); res[key] = g === 0; lines.push((g === 0 ? 'PASS ' : 'FAIL ') + 'baseline ' + key + ' reached=' + g); continue; }
    for (const a of SPEC[key]) {
      try {
        if (a[0] === 'js') await p.evaluate(`(() => { ${GETC} const c = getC(); ${a[1]}; })()`);
        else if (a[0] === 'click') await p.locator('.tp-phone').getByText(a[1], { exact: !!a[2] }).first().click({ timeout: 2500 });
        else if (a[0] === 'fire') await p.locator('#lab-case-detail button').first().click({ timeout: 2500 });
        else if (a[0] === 'online') await p.locator('[aria-label="Quitar sin conexión"]').first().click({ timeout: 2500 });
        else if (a[0] === 'wait') await p.waitForTimeout(a[1]);
        else if (a[0] === 'assert') { const ok = await p.evaluate(`(() => { ${GETC} const c = getC(); ${a[1]} })()`); if (!ok) log.push('ASSERT FAIL ' + a[1]); }
        if (a[0] !== 'wait') await p.waitForTimeout(260);
      } catch (e) { log.push('ACTION FAIL ' + JSON.stringify(a) + ' ' + e.message.split('\n')[0]); }
    }
    await p.waitForTimeout(300);
    const r = await p.evaluate(`(() => { ${GETC} const c = getC(); const cs = c.labCase(); const L = c.state.lab; const n = cs && cs.steps ? cs.steps.length : 0;
      const got = Object.keys(L.reached).filter(k => k !== '0' && L.reached[k]).length;
      return {n, got, steps: (cs.steps || []).map((s, k) => (L.reached[k + 1] ? '✓ ' : '· ') + s.l), status: (document.querySelector('#lab-case-detail [role=status]') || {}).textContent || ''}; })()`);
    const pass = r.n > 0 && r.got === r.n && !errs.length && !log.length;
    res[key] = pass;
    lines.push((pass ? 'PASS ' : 'FAIL ') + key + ' ' + r.got + '/' + r.n + ' [' + r.status.trim() + ']' + (pass ? '' : '\n    ' + r.steps.join('\n    ') + (log.length ? '\n    ' + log.join('\n    ') : '') + (errs.length ? '\n    ERR ' + errs.slice(0, 4).join(' | ') : '')));
  }
  console.log(lines.join('\n'));
  const passN = Object.values(res).filter(Boolean).length;
  console.log('\n' + passN + ' / ' + Object.keys(res).length + ' passed');
  if (!only && !baseline) { fs.mkdirSync(__dirname + '/results', { recursive: true }); fs.writeFileSync(__dirname + '/results/latest.json', JSON.stringify(res, null, 1)); }
  await b.close();
})();
