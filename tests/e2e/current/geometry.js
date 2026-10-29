const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const refUrl = process.env.REF_URL || 'http://127.0.0.1:8766/project/Main.dc.html';
const appUrl = process.env.LAB_URL || 'http://localhost:4173/';
const options = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {};
const selectors = ['.lab-grid', 'nav.lab-col', 'main.lab-col', 'aside.lab-pv', '.tp-phone', '[data-lab-modal]'];
const widths = [375, 760, 1180, 1440, 1680];
const getLogic = `(() => {
  const root = document.querySelector('.lab');
  const key = Object.keys(root || {}).find(name => name.startsWith('__reactFiber'));
  let fiber = root && root[key];
  while (fiber) {
    const logic = fiber.stateNode?.logic;
    if (logic && typeof logic.labOpen === 'function') return logic;
    fiber = fiber.return;
  }
  throw new Error('No se encontró la lógica Current en el fiber walk del original');
})()`;

async function openSoon(page, reference, id) {
  const expression = reference ? getLogic : 'window.__lab';
  await page.evaluate(({ source, flowId }) => (0, eval)(source).labOpen(flowId), { source: expression, flowId: id });
  await page.waitForTimeout(1100);
  await page.waitForFunction(() => {
    const modal = document.querySelector('[data-lab-modal]');
    return modal && getComputedStyle(modal).display !== 'none';
  }, null, { timeout: 5000 });
}

async function boxes(page) {
  return page.evaluate(names => Object.fromEntries(names.map(selector => {
    const element = document.querySelector(selector);
    if (!element) return [selector, null];
    const rect = element.getBoundingClientRect();
    return [selector, Object.fromEntries(['left', 'top', 'right', 'bottom', 'width', 'height'].map(key => [key, Number(rect[key].toFixed(2))]))];
  })), selectors);
}

async function lastFlowCoverage(page) {
  return page.evaluate(async () => {
    const nav = document.querySelector('nav.lab-col');
    const selector = document.querySelector('nav.lab-col .proto-switch');
    const items = [...(nav?.querySelectorAll('button.lab-item') || [])].filter(element => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    const last = items.at(-1);
    if (!nav || !selector || !last) return { pass: false, reason: 'nav, selector o último flujo ausente' };
    const overflow = getComputedStyle(nav).overflowY;
    if (overflow !== 'visible' && nav.scrollHeight > nav.clientHeight) nav.scrollTop = nav.scrollHeight;
    else window.scrollTo(0, Math.max(0, nav.getBoundingClientRect().bottom - window.innerHeight));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const itemRect = last.getBoundingClientRect();
    const selectorRect = selector.getBoundingClientRect();
    const overlap = itemRect.left < selectorRect.right && itemRect.right > selectorRect.left
      && itemRect.top < selectorRect.bottom && itemRect.bottom > selectorRect.top;
    return {
      pass: !overlap,
      lastFlow: last.innerText.trim().replace(/\s+/g, ' '),
      item: { left: itemRect.left, top: itemRect.top, right: itemRect.right, bottom: itemRect.bottom },
      selector: { left: selectorRect.left, top: selectorRect.top, right: selectorRect.right, bottom: selectorRect.bottom }
    };
  });
}

function delta(expected, actual) {
  return Object.fromEntries(Object.keys(expected).map(key => [key, Number((actual[key] - expected[key]).toFixed(2))]));
}

(async () => {
  const { LAB_ALL_FLOWS, LAB_SEC_OF, LAB_SOON_OF } = await import(pathToFileURL(path.resolve(__dirname, '../../../src/current/data.ts')));
  const soon = LAB_ALL_FLOWS.find(flow => LAB_SEC_OF(flow) === 'soon' && LAB_SOON_OF(flow));
  if (!soon) throw new Error('No se encontró un flujo de Próximamente para abrir el modal.');

  const browser = await chromium.launch({ ...options, headless: true });
  try {
    const reference = await browser.newPage({ viewport: { width: 1440, height: 916 }, reducedMotion: 'reduce' });
    const app = await browser.newPage({ viewport: { width: 1440, height: 916 }, reducedMotion: 'reduce' });
    await Promise.all([
      reference.goto(refUrl, { waitUntil: 'load', timeout: 60000 }),
      app.goto(appUrl, { waitUntil: 'load', timeout: 60000 })
    ]);
    await Promise.all([
      reference.waitForFunction(() => !!document.querySelector('.lab') && !!document.querySelector('.tp-phone'), null, { timeout: 30000 }),
      app.waitForFunction(() => !!window.__lab?.labOpen && !!document.querySelector('.lab'), null, { timeout: 30000 })
    ]);
    const reservationStyle = await reference.addStyleTag({
      content: '@media (max-width:760px){html[data-geometry-reservation="true"] nav.lab-col{padding-bottom:68px!important}}'
    });
    const results = [];
    const flowCoverage = [];
    for (const width of widths) {
      await Promise.all([reference.setViewportSize({ width, height: 916 }), app.setViewportSize({ width, height: 916 })]);
      await Promise.all([openSoon(reference, true, soon.id), openSoon(app, false, soon.id)]);
      await Promise.all([reference.evaluate(() => document.fonts.ready), app.evaluate(() => document.fonts.ready)]);
      await Promise.all([reference.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll('.lab-col').forEach(element => { element.scrollTop = 0; }); }),
        app.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll('.lab-col').forEach(element => { element.scrollTop = 0; }); })]);
      await reference.evaluate(() => { delete document.documentElement.dataset.geometryReservation; });
      const rawExpected = await boxes(reference);
      const actual = await boxes(app);
      await reference.evaluate(() => { document.documentElement.dataset.geometryReservation = 'true'; });
      await reservationStyle.evaluate(element => { element.disabled = false; });
      const expected = await boxes(reference);
      for (const selector of selectors) {
        const baseline = expected[selector];
        const rawBaseline = rawExpected[selector];
        const current = actual[selector];
        if (!baseline || !current || !rawBaseline) {
          results.push({ width, selector, pass: baseline === current, expected: baseline, actual: current, rawExpected: rawBaseline, delta: null, rawDelta: null });
          continue;
        }
        const normalizedDelta = delta(baseline, current);
        const rawDelta = delta(rawBaseline, current);
        const pass = Object.values(normalizedDelta).every(value => Math.abs(value) <= 1);
        results.push({ width, selector, pass, expected: baseline, actual: current, delta: normalizedDelta, rawDelta });
      }
      flowCoverage.push({ width, ...await lastFlowCoverage(app) });
    }

    const failed = results.filter(result => !result.pass);
    const report = {
      widths,
      selectors,
      tolerancePx: 1,
      normalizedAgainst: 'Referencia Current con un slot de 52 px para el selector integrado en el nav, solo en el layout apilado.',
      compared: results.length,
      passed: results.length - failed.length,
      rawReferenceMismatches: results.filter(result => result.rawDelta && Object.values(result.rawDelta).some(value => Math.abs(value) > 1)).length,
      flowCoverage,
      failed
    };
    const output = path.resolve('tests/e2e/results/current-geometry.json');
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, JSON.stringify(report, null, 2));
    console.log(`CURRENT GEOMETRY · ${report.passed}/${report.compared} cajas dentro de ±1 px · ${report.rawReferenceMismatches} cajas cambian en bruto por los 52 px del selector`);
    console.log(`Último flujo fuera del selector: ${flowCoverage.filter(item => item.pass).length}/${flowCoverage.length} anchos`);
    console.log(`Informe: ${output}`);
    for (const result of failed) console.log(`FAIL ${result.width}px ${result.selector}: ${JSON.stringify(result.delta || { expected: result.expected, actual: result.actual })}`);
    for (const result of flowCoverage.filter(item => !item.pass)) console.log(`COVERAGE FAIL ${result.width}px: ${JSON.stringify(result)}`);
    if (failed.length || flowCoverage.some(item => !item.pass)) process.exitCode = 1;
    await reference.close();
    await app.close();
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
