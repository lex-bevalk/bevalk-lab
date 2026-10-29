const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const refUrl = process.env.REF_URL || 'http://127.0.0.1:8766/project/Main.dc.html';
const appUrl = process.env.LAB_URL || 'http://localhost:4173/';
const options = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {};
const axePath = require.resolve('axe-core/axe.min.js');
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

async function openFlow(page, reference, id) {
  if (!id) return;
  await page.evaluate(({ expression, flowId }) => (0, eval)(expression).labOpen(flowId), {
    expression: reference ? getLogic : 'window.__lab',
    flowId: id
  });
  await page.waitForTimeout(1100);
}

async function violations(page) {
  return page.evaluate(async () => {
    const root = document.querySelector('.lab');
    const result = await window.axe.run(root);
    return result.violations.map(item => ({
      id: item.id,
      impact: item.impact,
      description: item.description,
      help: item.help,
      nodes: item.nodes.map(node => ({ target: node.target, failureSummary: node.failureSummary }))
    }));
  });
}

(async () => {
  const { LAB_ALL_FLOWS, LAB_SEC_OF } = await import(pathToFileURL(path.resolve(__dirname, '../../../src/current/data.ts')));
  const samples = ['app', 'fam', 'soon'].map(section => {
    const flows = LAB_ALL_FLOWS.filter(flow => LAB_SEC_OF(flow) === section).slice(0, 2);
    if (flows.length !== 2) throw new Error(`Se esperaban dos flujos de ${section}; hay ${flows.length}.`);
    return flows;
  }).flat();
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
    await Promise.all([reference.addScriptTag({ path: axePath }), app.addScriptTag({ path: axePath })]);

    const cases = [{ label: 'Portada', id: null }];
    for (const flow of samples) cases.push({ label: `${flow.id} · ${LAB_SEC_OF(flow)}`, id: flow.id });
    const results = [];
    for (const item of cases) {
      await Promise.all([openFlow(reference, true, item.id), openFlow(app, false, item.id)]);
      const [referenceViolations, appViolations] = await Promise.all([violations(reference), violations(app)]);
      const allowed = new Set(referenceViolations.flatMap(violation => violation.nodes.map(node => `${violation.id}|${node.target.join(',')}`)));
      const additional = appViolations.flatMap(violation => violation.nodes
        .filter(node => !allowed.has(`${violation.id}|${node.target.join(',')}`))
        .map(node => ({ id: violation.id, impact: violation.impact, target: node.target, help: violation.help })));
      results.push({ ...item, referenceViolations, appViolations, additional });
    }

    const failed = results.filter(item => item.additional.length);
    const report = { checked: results.length, flowChecks: samples.length, failed: failed.length, results };
    const output = path.resolve('tests/e2e/results/current-a11y.json');
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, JSON.stringify(report, null, 2));
    console.log(`CURRENT A11Y · ${report.checked} estados · ${report.failed ? 'FAIL' : 'PASS'} (violaciones app incluidas en referencia)`);
    for (const item of results) {
      console.log(`${item.label}: referencia ${item.referenceViolations.reduce((n, violation) => n + violation.nodes.length, 0)} nodos / app ${item.appViolations.reduce((n, violation) => n + violation.nodes.length, 0)} / nuevas ${item.additional.length}`);
    }
    console.log(`Informe: ${output}`);
    if (failed.length) process.exitCode = 1;
    await reference.close();
    await app.close();
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
