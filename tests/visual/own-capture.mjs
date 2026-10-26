import { spawnSync } from 'node:child_process';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(process.cwd());
const currentDir = resolve(root, 'tests/visual/own/current');
const baselineDir = resolve(root, 'tests/visual/own/baseline');
const appUrl = process.env.LAB_URL || 'http://localhost:4173/';
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
const captures = [];
try {
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
      const name = `${target}--${viewport.width}x${viewport.height}.png`;
      await page.screenshot({ path: resolve(currentDir, name), animations: 'disabled' });
      captures.push({ target, name, viewport });
      await page.locator('body').evaluate(element => element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
      await page.waitForFunction(() => !document.querySelector('.tp-phone .odin-menu'));
    }
  }
} finally {
  await browser.close();
}

await writeFile(resolve(currentDir, 'capture-manifest.json'), JSON.stringify({ appUrl, captures }, null, 2));
console.log(`Capturas propias: ${captures.length}/${Object.keys(targets).length * viewports.length} en ${currentDir}`);
let baselineExists = false;
try {
  await access(baselineDir);
  baselineExists = true;
} catch {}
if (baselineExists) {
  const result = spawnSync(process.execPath, ['tests/visual/compare.mjs', 'tests/visual/own/baseline', 'tests/visual/own/current'], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status || 1;
} else {
  console.log('Baseline propia no existe; comparación omitida.');
}
