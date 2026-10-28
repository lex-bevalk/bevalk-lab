import { spawnSync } from 'node:child_process';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(process.cwd());
const currentDir = resolve(root, 'tests/visual/own/current');
const baselineDir = resolve(root, 'tests/visual/own/baseline');
const familyCurrentDir = resolve(root, 'tests/visual/own/family/current');
const familyBaselineDir = resolve(root, 'tests/visual/own/family/baseline');
const appUrl = process.env.LAB_URL || 'http://localhost:4173/concept.html';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const targets = {
  prsec: 'c.prGo("seguridad", c.prSecReset()); if (!c.renderVals().pr.isSeg) throw new Error("No se llegó a Seguridad");',
  prdel: 'c.prGo("seguridad", Object.assign(c.prSecReset(), {sec:"borrar"})); if (!c.renderVals().pr.sec.isBorrar) throw new Error("No se llegó a Eliminar cuenta");',
  prfb: 'c.prGo("opinion", {fb:{topic:"", text:"", err:{}}}); if (!c.renderVals().pr.isOpinion) throw new Error("No se llegó a Tu opinión importa");',
  sop: 'c.go("soporte"); if (!c.renderVals().isSoporte) throw new Error("No se llegó a Soporte técnico");',
  sos: 'c.setState({screen:"sos", sheet:null, sos:Object.assign({}, c.state.sos, {view:"form", err:{}})}); if (!c.renderVals().sos.isForm) throw new Error("No se llegó al formulario SOS");',
};
const triggerSelectors = {
  prsec: '.tp-phone .lab-optsel > button[aria-labelledby="pr-sec"]',
  prdel: '.tp-phone .lab-optsel > button[aria-labelledby="pr-motivo"]',
  prfb: '.tp-phone .lab-optsel > button[aria-labelledby="pr-fb"]',
  sop: '.tp-phone .lab-optsel > button[aria-labelledby="sop-asunto"]',
  sos: '.tp-phone [data-screen-label="SOS"] .lab-optsel > button',
};
const viewports = [{ width: 1680, height: 916 }, { width: 375, height: 812 }];
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { headless: true });
const page = await browser.newPage({ viewport: viewports[0], deviceScaleFactor: 1, reducedMotion: 'reduce' });
await page.emulateMedia({ reducedMotion: 'reduce' });
const captures = [];
await mkdir(currentDir, { recursive: true });
  await page.goto(appUrl, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__lab);
  for (const [target, setup] of Object.entries(targets)) {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.evaluate(({ target, setup }) => {
        const c = window.__lab;
        if (!c) throw new Error('No se encontró window.__lab');
        (new Function('c', setup))(c);
        c.labLabSet({ tab: 'phone', pv: 'closed', case: null, view: 'flow' });
        document.querySelectorAll('.tp-scroll, .lab-scroll').forEach(element => { element.scrollTop = 0; });
      }, { target, setup });
      const trigger = page.locator(triggerSelectors[target]);
      await trigger.waitFor({ state: 'visible' });
      const closedLayout = await trigger.evaluate(element => {
        const triggerRect = element.getBoundingClientRect();
        const wrapperRect = element.parentElement.getBoundingClientRect();
        return {
          trigger: [triggerRect.width, triggerRect.height],
          wrapper: [wrapperRect.width, wrapperRect.height],
          open: element.getAttribute('aria-expanded') === 'true',
        };
      });
      if (closedLayout.open || Math.abs(closedLayout.trigger[0] - closedLayout.wrapper[0]) > 0.5 || Math.abs(closedLayout.trigger[1] - closedLayout.wrapper[1]) > 0.5) {
        throw new Error(`El wrapper altera el layout cerrado de ${target} a ${viewport.width}x${viewport.height}.`);
      }
      if (await page.locator('.tp-phone .odin-menu, .odin-drawer, [role="dialog"]').count()) {
        throw new Error(`Quedó un overlay montado con ${target} cerrado.`);
      }
      await trigger.click();
      await page.locator('.tp-phone .odin-menu[role="listbox"]').waitFor({ state: 'visible' });
      const activeTarget = await page.evaluate(() => window.__lab.renderVals().sheet.target);
      if (activeTarget !== target) throw new Error(`Se abrió ${activeTarget} al capturar ${target}.`);
      await page.evaluate(async triggerSelector => {
        await document.fonts.ready;
        await new Promise(requestAnimationFrame);
        const menu = document.querySelector('.tp-phone .odin-menu[role="listbox"]');
        const trigger = document.querySelector(triggerSelector);
        if (!menu || !trigger) throw new Error('No se encontró el menú o su trigger para estabilizar la captura.');
        if (menu.scrollHeight > menu.clientHeight) menu.scrollTop = 0;
        const animations = [
          ...menu.getAnimations({ subtree: true }),
          ...trigger.getAnimations({ subtree: true }),
        ];
        await Promise.all(animations
          .filter(animation => animation.playState !== 'finished' && animation.effect?.getComputedTiming().iterations !== Infinity)
          .map(animation => animation.finished.catch(() => {})));
        await new Promise(requestAnimationFrame);
      }, triggerSelectors[target]);
      const name = `${target}--${viewport.width}x${viewport.height}.png`;
      await page.screenshot({ path: resolve(currentDir, name), animations: 'disabled' });
      captures.push({ target, name, viewport });
      await page.locator('body').evaluate(element => element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
      await page.waitForFunction(() => !document.querySelector('.tp-phone .odin-menu'));
    }
  }

await writeFile(resolve(currentDir, 'capture-manifest.json'), JSON.stringify({ appUrl, captures }, null, 2));
const familyTargets = ['famdescubre','famdescubrean','famoferta','famcrear','famcalma','famadmin','famficha','famavisar','famfichapep','faminvitar','famajustes','famretirar','famplan','fambaja','famcancelado','faminvite','fammember','famayuda','famayudaan','famcomparto','famverlucia','famplanmiembro','famsalir','famtermina','famfuera','famcerrar','famtienda','fampendiente','famlleno','famunido','famterminado','famterminadomiembro','famcaducada','fampremiumpropio','famretirado','fameliminar'];
const familyCaptures = [];
await mkdir(familyCurrentDir, { recursive:true });
for (const id of familyTargets) {
  await page.evaluate(id => {
    const c = window.__lab;
    const flow = c?.labFlows().find(item => item.id === id);
    if (!flow) throw new Error('No se encontró el flujo ' + id);
    c.labSelect(flow);
    c.labLabSet({ tab:'phone', pv:'closed', case:null, view:'flow' });
    document.querySelectorAll('.tp-scroll, .lab-scroll').forEach(element => { element.scrollTop = 0; });
  }, id);
  await page.waitForTimeout(500);
  for (const viewport of [{width:375,height:812},{width:1440,height:900}]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(100);
    const name = `${id}--${viewport.width}x${viewport.height}.png`;
    await page.screenshot({ path:resolve(familyCurrentDir,name), animations:'disabled' });
    familyCaptures.push({ flowId:id, name, viewport });
  }
}
await writeFile(resolve(familyCurrentDir, 'capture-manifest.json'), JSON.stringify({ appUrl, captures:familyCaptures }, null, 2));
await browser.close();

console.log(`Capturas propias: ${captures.length}/${Object.keys(targets).length * viewports.length} en ${currentDir} · visual own familia: ${familyCaptures.length}/${familyTargets.length * 2} en 375 y 1440 px en ${familyCurrentDir}`);
let status = 0;
async function compareIfPresent(label, baseline, current, diff) {
  try { await access(baseline); }
  catch { console.log(`Baseline ${label} no existe; comparación omitida.`); return; }
  const result = spawnSync(process.execPath, ['tests/visual/compare.mjs', relative(root, baseline), relative(root, current), relative(root, diff)], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) status = result.status || 1;
}
await compareIfPresent('genérico', baselineDir, currentDir, resolve(root, 'tests/visual/own/diff'));
await compareIfPresent('visual own familia', familyBaselineDir, familyCurrentDir, resolve(root, 'tests/visual/own/family/diff'));
if (status) process.exitCode = status;
