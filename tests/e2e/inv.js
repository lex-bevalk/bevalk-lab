const { chromium } = require('playwright');
const GETC = `const getC = () => { if (window.__lab) return window.__lab; const el = document.querySelector('.tp-phone'); const k = Object.keys(el || {}).find(k => k.startsWith('__reactFiber')); let f = el && el[k]; while (f) { if (f.stateNode && f.stateNode.logic && f.stateNode.logic.labVals) return f.stateNode.logic; f = f.return; } return null; };`;
(async () => {
  const b = await chromium.launch({ headless: true }); const p = await b.newPage({ viewport: { width: 1680, height: 916 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.LAB_URL || 'http://localhost:4173/')); await p.waitForTimeout(2200);
  const ev = s => p.evaluate(`(() => { ${GETC} const c = getC(); ${s} })()`);
  const sel = async id => { await p.locator('.lab-a button[aria-current]').nth(await ev(`return c.labFlows().findIndex(x => x.id === ${JSON.stringify(id)})`)).click(); await p.waitForTimeout(450); };
  const planUI = () => p.evaluate(() => document.querySelector('.lab-a [role=radio][aria-checked=true]').textContent.trim());
  const res = [];
  const T = (name, ok, extra) => res.push((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' · ' + extra : ''));
  const scen0 = await ev('return c.labScenJSON()');
  // 1-2 plan persistence across flows and pinned constraint
  await sel('aldia'); await p.locator('.lab-a [role=radio]', {hasText:'Freemium'}).click(); await p.waitForTimeout(400);
  await sel('comprobar'); T('plan persiste al cambiar de flujo (Freemium)', await planUI() === 'Freemium' && await ev('return c.world().plan') === 'free');
  await sel('premnuevo'); T('flujo solo Premium fija Premium con nota', await planUI() === 'Premium' && await p.locator('.lab-a [role=note]').count() === 1);
  T('la preferencia global no cambia por seleccionar un flujo', await ev('return c.state.labPlan') === 'free');
  await sel('ayuda'); T('la preferencia vuelve en el siguiente flujo', await planUI() === 'Freemium');
  await p.locator('.lab-a [role=radio]', {hasText:'Premium'}).click({force:true}); await p.waitForTimeout(300);
  await sel('nuevo'); await p.locator('.lab-a [role=radio]', {hasText:'Premium'}).click({force:true}); await p.waitForTimeout(300);
  T('clic en modalidad no disponible no cambia el simulador y explica', await planUI() === 'Freemium' && /solo existe en Freemium/.test(await p.locator('.lab-b [role=status]').first().textContent()));
  // 3 premium does not imply admin
  await sel('aldia'); T('Premium no implica rol de administradora', await planUI() === 'Premium' && await ev('return c.famRole()') === 'none');
  // 4 case does not contaminate other flows
  await sel('famadmin'); await p.locator('.lab-b article button').nth(2).click(); await p.waitForTimeout(800);
  const offIn = await ev('return c.off()');
  await sel('ayuda'); T('un caso con «sin conexión» no contamina otro flujo', offIn === true && await ev('return c.off()') === false && await ev('return c.state.lab.case') === null);
  // 5 reset reproducible
  await sel('famadmin'); await p.locator('.lab-b article button').nth(0).click(); await p.waitForTimeout(800);
  await ev('c.famSheet({kind:"reply", req:"r1", msg:null})'); await p.waitForTimeout(300);
  const r1 = await ev('return Object.keys(c.state.lab.reached).length');
  await p.locator('#lab-case-detail button', {hasText:'Reiniciar caso'}).click(); await p.waitForTimeout(900);
  const r2 = await ev('return JSON.stringify([Object.keys(c.state.lab.reached), c.state.fam.reqs.length, !!c.state.fam.sheet])');
  T('reiniciar caso restaura un estado reproducible', r1 === 2 && r2 === JSON.stringify([['0'], 2, false]), r2);
  // 6 doc navigation does not reset the phone
  await ev('c.famSheet({kind:"reply", req:"r1", msg:null})'); await p.waitForTimeout(300);
  await p.evaluate(() => { const el = document.querySelector('[data-lab-center]'); el.scrollTop = 0; el.scrollTop = 600; });
  await p.locator('summary', {hasText:'Criterios de aceptación del flujo'}).click(); await p.locator('summary', {hasText:'Entorno de prueba'}).click(); await p.waitForTimeout(300);
  T('navegar por la documentación no reinicia el móvil', await ev('return !!(c.state.fam.sheet && c.state.fam.sheet.kind === "reply") && c.state.lab.case === "c1"'));
  // 7 in-app purchase syncs the switch
  await sel('aldia'); await p.locator('.lab-a [role=radio]', {hasText:'Freemium'}).click(); await p.waitForTimeout(300);
  await ev('c.go("paywall")'); await p.waitForTimeout(200); await ev('c.activatePremium("mensual")'); await p.waitForTimeout(400);
  T('comprar Premium dentro del móvil actualiza el selector', await planUI() === 'Premium');
  // 8 plan switch keeps progress in place
  await sel('aldia'); await ev('c.awardSilent("scan", "x")'); await p.waitForTimeout(300);
  const wk = await ev('return JSON.stringify(c.world().wk)');
  await p.locator('.lab-a [role=radio]', {hasText:'Freemium'}).click(); await p.waitForTimeout(400);
  T('cambiar de plan conserva el progreso', await ev('return JSON.stringify(c.world().wk)') === wk && await ev('return c.world().plan') === 'free', wk);
  // 9 leaving family -> Basic
  await sel('fammember'); await ev('c.famSheet({kind:"salir"})'); await p.waitForTimeout(200); await ev('c.renderVals().fam.sh.confirm()'); await p.waitForTimeout(400);
  T('salir del grupo familiar pasa a Freemium', await planUI() === 'Freemium');
  // 10 original env controls still work
  await sel('premmitad'); await p.evaluate(() => document.querySelectorAll('.lab-b details').forEach(d => d.open = true)); await p.waitForTimeout(200);
  await p.getByRole('switch', {name:/Face ID para Mi huella/}).click(); await p.waitForTimeout(200);
  await ev('c.go("huella")'); await p.waitForTimeout(300);
  T('Face ID del entorno bloquea Mi huella', await ev('return c.state.screen') === 'bloqueo');
  await p.getByRole('switch', {name:/Face ID para Mi huella/}).click(); await p.waitForTimeout(200);
  await p.locator('.lab-b button', {hasText:'Entrar desde un aviso push'}).click(); await p.waitForTimeout(300);
  T('entrar desde aviso push abre Alertas', await ev('return c.state.screen + ":" + c.state.push') === 'alertas:true');
  await p.locator('.lab-b button', {hasText:'Premium dormido'}).click(); await p.waitForTimeout(400);
  T('estado suelto carga su escenario y su plan', await ev('return c.scenKey()') === 'prem-dormido' && await planUI() === 'Premium' && /Premium dormido/.test(await p.locator('.lab-b h1').textContent()));
  T('SCEN original no se ha modificado', await ev('return c.labScenJSON()') === scen0);
  T('sin errores de página', errs.length === 0, errs.join(' | '));
  console.log(res.join('\n'));
  await b.close();
})();
