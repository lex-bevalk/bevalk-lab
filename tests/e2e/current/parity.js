const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const refUrl = process.env.REF_URL || 'http://127.0.0.1:8766/project/Main.dc.html';
const appUrl = process.env.LAB_URL || 'http://localhost:4173/';
const options = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {};
let LAB_ALL_FLOWS;
let LAB_SEC_OF;
const sections = ['nav.lab-col', 'main.lab-col', 'aside.lab-pv'];

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

function waitForStable(page, reference) {
  const expression = reference ? getLogic : 'window.__lab';
  return (async () => {
    const signature = () => page.evaluate(source => {
      const logic = (0, eval)(source);
      const text = [...document.querySelectorAll('nav.lab-col, main.lab-col, aside.lab-pv, [data-lab-modal]')]
        .map(element => (element.innerText || '').replace(/\s+/g, ' ').trim());
      const screens = [...document.querySelectorAll('.tp-phone [data-screen-label]')]
        .map(element => `${element.getAttribute('data-screen-label')}:${getComputedStyle(element).display}`);
      return JSON.stringify({ text, screens, screen: logic.state.screen, shown: logic.state.shown, caso: logic.state.lab?.caso });
    }, expression);
    let prior = await signature();
    let stable = 0;
    for (let attempt = 0; attempt < 32; attempt += 1) {
      await page.waitForTimeout(250);
      const current = await signature();
      if (current === prior) stable += 1;
      else stable = 0;
      if (stable >= 3) return;
      prior = current;
    }
    throw new Error('Current no alcanzó un DOM estable en 8 s.');
  })();
}

async function snapshot(page) {
  return page.evaluate(selectors => {
    const isVisible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 1 && rect.height > 1;
    };
    const normalize = value => (value || '').replace(/[\u200b\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
    const areas = {};
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const controls = [...(element?.querySelectorAll('button,a,input,select,textarea,[role="button"],[role="tab"],[role="radio"],[role="checkbox"]') || [])]
        .filter(isVisible)
        .map(control => ({
          tag: control.tagName.toLowerCase(),
          text: normalize(control.innerText || control.textContent),
          aria: Object.fromEntries([...control.attributes]
            .filter(attribute => attribute.name.startsWith('aria-'))
            .sort((left, right) => left.name.localeCompare(right.name))
            .map(attribute => [attribute.name, attribute.value])),
          href: control.getAttribute('href'),
          type: control.getAttribute('type')
        }));
      areas[selector] = {
        text: normalize(element?.innerText || ''),
        buttons: controls.filter(control => control.tag === 'button' || control.aria['role'] === 'button').length,
        links: controls.filter(control => control.tag === 'a').length,
        controls
      };
    }
    const labels = [...document.querySelectorAll('.tp-phone [data-screen-label]')]
      .filter(isVisible)
      .map(element => element.getAttribute('data-screen-label'));
    return { labels, areas };
  }, sections);
}

function differences(expected, actual) {
  const found = [];
  if (JSON.stringify(expected.labels) !== JSON.stringify(actual.labels)) found.push('labels');
  for (const selector of sections) {
    for (const key of ['text', 'buttons', 'links', 'controls']) {
      if (JSON.stringify(expected.areas[selector][key]) !== JSON.stringify(actual.areas[selector][key])) {
        found.push(`${selector}.${key}`);
      }
    }
  }
  return found;
}

async function applyState(page, reference, state) {
  const expression = reference ? getLogic : 'window.__lab';
  await page.evaluate(({ expression: source, id, caso, plan, rol }) => {
    const logic = (0, eval)(source);
    if (plan) logic.labPlan(plan);
    if (rol) logic.labSet({ rol });
    logic.labOpen(id, caso);
  }, { expression, ...state });
  await waitForStable(page, reference);
  await page.waitForTimeout(120);
}

(async () => {
  ({ LAB_ALL_FLOWS, LAB_SEC_OF } = await import(pathToFileURL(path.resolve(__dirname, '../../../src/current/data.ts'))));
  const browser = await chromium.launch({ ...options, headless: true });
  const reference = await browser.newPage({ viewport: { width: 1440, height: 916 }, reducedMotion: 'reduce' });
  const app = await browser.newPage({ viewport: { width: 1440, height: 916 }, reducedMotion: 'reduce' });
  const appErrors = [];
  const referenceErrors = [];
  app.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') appErrors.push(`${message.type()}: ${message.text()}`);
  });
  app.on('pageerror', error => appErrors.push(`pageerror: ${error.message}`));
  reference.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') referenceErrors.push(`${message.type()}: ${message.text()}`);
  });
  reference.on('pageerror', error => referenceErrors.push(`pageerror: ${error.message}`));

  const results = [];
  try {
    await Promise.all([
      reference.goto(refUrl, { waitUntil: 'load', timeout: 60000 }),
      app.goto(appUrl, { waitUntil: 'load', timeout: 60000 })
    ]);
    await Promise.all([
      reference.waitForFunction(() => !!document.querySelector('.lab') && !!document.querySelector('.tp-phone'), null, { timeout: 30000 }),
      app.waitForFunction(() => !!window.__lab?.labOpen && !!document.querySelector('.lab'), null, { timeout: 30000 })
    ]);
    await Promise.all([waitForStable(reference, true), waitForStable(app, false)]);

    const compare = async (label, state) => {
      const appErrorStart = appErrors.length;
      await Promise.all([
        applyState(reference, true, state),
        applyState(app, false, state)
      ]);
      const [expected, actual] = await Promise.all([snapshot(reference), snapshot(app)]);
      const diff = differences(expected, actual);
      const errors = appErrors.slice(appErrorStart);
      results.push({ label, id: state.id, caso: state.caso || '', plan: state.plan || '', rol: state.rol || '', differences: diff, errors,
        ...(diff.length ? { expected, actual } : {}) });
    };

    for (const flow of LAB_ALL_FLOWS) {
      await compare(`${flow.id} · normal`, { id: flow.id });
      for (const caso of flow.casos || []) {
        if (caso.caso) await compare(`${flow.id} · ${caso.caso}`, { id: flow.id, caso: caso.caso });
      }
    }

    for (const flow of LAB_ALL_FLOWS.filter(item => LAB_SEC_OF(item) === 'app').slice(0, 10)) {
      await compare(`${flow.id} · Premium`, { id: flow.id, plan: 'premium' });
    }
    const familyFlows = LAB_ALL_FLOWS.filter(item => LAB_SEC_OF(item) === 'fam').slice(0, 5);
    for (const role of ['Todos', 'Basic', 'Quien gestiona', 'Invitada', 'Miembro']) {
      for (const flow of familyFlows) await compare(`${flow.id} · rol ${role}`, { id: flow.id, rol: role });
    }

    const failed = results.filter(item => item.differences.length || item.errors.length);
    const report = {
      url: { reference: refUrl, app: appUrl },
      flowCount: LAB_ALL_FLOWS.length,
      executableCases: LAB_ALL_FLOWS.reduce((count, flow) => count + (flow.casos || []).filter(item => item.caso).length, 0),
      comparisons: results.length,
      failed: failed.length,
      appConsoleErrors: [...new Set(results.flatMap(item => item.errors))],
      referenceConsoleErrors: [...new Set(referenceErrors)],
      differences: failed.map(({ label, differences, errors, expected, actual }) => ({ label, differences, errors, expected, actual }))
    };
    const output = path.resolve('tests/e2e/results/current-parity.json');
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, JSON.stringify(report, null, 2));
    console.log(`CURRENT PARITY · ${report.comparisons} comparaciones (${report.flowCount} flujos, ${report.executableCases} casos) · ${report.failed} con diferencias`);
    console.log(`Consola app: ${report.appConsoleErrors.length} error/aviso · referencia: ${report.referenceConsoleErrors.length} (no bloquean)`);
    console.log(`Informe: ${output}`);
    for (const item of failed.slice(0, 20)) console.log(`FAIL ${item.label}: ${item.differences.join(', ') || 'sin diferencias de DOM'}${item.errors.length ? ` · ${item.errors.join(' | ')}` : ''}`);
    if (failed.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
