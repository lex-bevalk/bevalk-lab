import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import pngjs from 'pngjs';

const { PNG } = pngjs;
const root = resolve(process.cwd());
const referenceUrl = process.env.REFERENCE_URL || 'http://127.0.0.1:8765/project/Main.dc.html';
const appUrl = process.env.LAB_URL || 'http://localhost:4173/';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const viewport = { width: 375, height: 812 };
const threshold = 0.1;
const maxDifferentPercent = 0.5;
const onlyScenario = process.env.AREA_REVIEW_ONLY || null;
const saveDiffsTo = process.env.AREA_REVIEW_SAVE_DIR ? resolve(root, process.env.AREA_REVIEW_SAVE_DIR) : null;
const GETC = `const getC = () => { if (window.__lab) return window.__lab; const el = document.querySelector('.tp-phone'); const key = Object.keys(el || {}).find(k => k.startsWith('__reactFiber')); let fiber = el && el[key]; while (fiber) { if (fiber.stateNode?.logic?.labVals) return fiber.stateNode.logic; fiber = fiber.return; } return null; };`;

const areas = [
  {
    name: 'Acceso y onboarding',
    screens: ['Acceso', 'Bienvenida', 'Notificaciones', 'Bloqueo'],
    cases: [
      { key: 'acceso-intro', label: 'Acceso', screen: 'auth', flowId: 'nuevo', waitMs: 1800 },
      { key: 'acceso-login', label: 'Acceso', screen: 'auth', patch: { au: { view: 'login' } } },
      { key: 'acceso-signup', label: 'Acceso', screen: 'auth', patch: { au: { view: 'signup' } } },
      { key: 'bienvenida', label: 'Bienvenida', screen: 'bienvenida' },
      { key: 'notificaciones', label: 'Notificaciones', screen: 'notificaciones' },
      { key: 'bloqueo', label: 'Bloqueo', screen: 'bloqueo' },
    ],
  },
  {
    name: 'Inicio y semana',
    screens: ['Inicio', 'Hitos', 'Desglose', 'Acciones', 'Alertas', 'Aviso'],
    cases: [
      { key: 'inicio', label: 'Inicio', screen: 'home' },
      { key: 'hitos', label: 'Hitos', screen: 'hitos' },
      { key: 'desglose', label: 'Desglose', screen: 'desglose' },
      { key: 'acciones', label: 'Acciones', screen: 'acciones' },
      { key: 'alertas-lista', label: 'Alertas', screen: 'alertas', patch: { al: { view: 'list' } } },
      { key: 'alertas-detalle', label: 'Alertas', screen: 'alinfo', patch: { al: { view: 'detail', sel: 'a1' } } },
      { key: 'aviso', label: 'Aviso', screen: 'aviso', patch: { al: { sel: 'a1' } } },
    ],
  },
  {
    name: 'Comprobar y analizador',
    screens: ['Comprobar', 'Analizador', 'Subida', 'Pasos'],
    cases: [
      { key: 'comprobar', label: 'Comprobar', screen: 'escaner' },
      { key: 'analizador-inicio', label: 'Analizador', screen: 'analizador', patch: { an: { view: 'welcome' } } },
      { key: 'analizador-principal', label: 'Analizador', screen: 'analizador', patch: { an: { view: 'main' } } },
      { key: 'analizador-resultado', label: 'Analizador', screen: 'analizador', patch: { an: { view: 'result', value: 'https://clc.li/SeurPago-esp', verdict: 'danger' } } },
      { key: 'subida', label: 'Subida', screen: 'subida' },
      { key: 'pasos', label: 'Pasos', screen: 'pasos' },
    ],
  },
  {
    name: 'Mi huella y borrado',
    screens: ['Mi huella', 'Mi huella · flujo', 'Borrar mis datos'],
    cases: [
      { key: 'mi-huella', label: 'Mi huella', screen: 'huella' },
      { key: 'mi-huella-flujo', label: 'Mi huella · flujo', screen: 'huflow' },
      { key: 'borrar-mis-datos', label: 'Borrar mis datos', screen: 'borrar' },
    ],
  },
  {
    name: 'Aprende',
    screens: ['Aprende', 'Lección', 'Cómo se usa BeValk'],
    cases: [
      { key: 'aprende', label: 'Aprende', screen: 'aprende' },
      { key: 'leccion-sms', label: 'Lección', action: 'lesson' },
      { key: 'como-se-usa', label: 'Cómo se usa BeValk', screen: 'guia' },
    ],
  },
  {
    name: 'Ayuda y SOS',
    screens: ['Ayuda', 'SOS', 'MarIA', 'Soporte técnico'],
    cases: [
      { key: 'ayuda', label: 'Ayuda', screen: 'ayuda' },
      { key: 'sos-aviso', label: 'SOS', screen: 'sos', patch: { sos: { view: 'aviso' } } },
      { key: 'sos-formulario', label: 'SOS', screen: 'sos', patch: { sos: { view: 'form' } } },
      { key: 'maria-inicio', label: 'MarIA', screen: 'maria', patch: { maria: { view: 'intro' } } },
      { key: 'maria-chat', label: 'MarIA', screen: 'maria', patch: { maria: { view: 'chat' } } },
      { key: 'soporte-tecnico', label: 'Soporte técnico', screen: 'soporte' },
    ],
  },
  {
    name: 'Perfil y Premium',
    screens: ['Perfil', 'Perfil · flujo', 'Premium'],
    cases: [
      { key: 'perfil', label: 'Perfil', screen: 'perfil' },
      { key: 'perfil-flujo', label: 'Perfil · flujo', screen: 'pfflow' },
      { key: 'premium', label: 'Premium', screen: 'paywall' },
    ],
  },
  {
    name: 'Familia',
    screens: ['Mi Familia','Inicio','Perfil','Analizador'],
    cases: [
      { key:'familia-famdescubre', label:'Inicio', flowId:'famdescubre', referenceState:{screen:'home'}, role:'none', view:'hub' },
      { key:'familia-famdescubrean', label:'Analizador', flowId:'famdescubrean', referenceState:{screen:'analizador', an:{view:'result',value:'https://clc.li/SeurPago-esp',verdict:'danger'}}, role:'none', view:'hub' },
      { key:'familia-famoferta', label:'Mi Familia', flowId:'famoferta', referenceState:{screen:'familia'}, role:'none', view:'oferta' },
      { key:'familia-famcrear', label:'Mi Familia', flowId:'famcrear', referenceState:{screen:'familia'}, role:'admin', view:'crear' },
      { key:'familia-famcalma', label:'Inicio', flowId:'famcalma', referenceState:{screen:'home'}, role:'admin', view:'hub' },
      { key:'familia-famadmin', label:'Inicio', flowId:'famadmin', referenceState:{screen:'home'}, role:'admin', view:'hub' },
      { key:'familia-famficha', label:'Mi Familia', flowId:'famficha', referenceState:{screen:'familia'}, role:'admin', view:'ficha' },
      { key:'familia-famavisar', label:'Mi Familia', flowId:'famavisar', referenceState:{screen:'familia'}, role:'admin', view:'hub' },
      { key:'familia-famfichapep', label:'Mi Familia', flowId:'famfichapep', referenceState:{screen:'familia'}, role:'admin', view:'ficha' },
      { key:'familia-faminvitar', label:'Mi Familia', flowId:'faminvitar', referenceState:{screen:'familia'}, role:'admin', view:'hub' },
      { key:'familia-famajustes', label:'Mi Familia', flowId:'famajustes', referenceState:{screen:'familia'}, role:'admin', view:'ajustes' },
      { key:'familia-famretirar', label:'Mi Familia', flowId:'famretirar', referenceState:{screen:'familia'}, role:'admin', view:'ficha' },
      { key:'familia-famplan', label:'Perfil', flowId:'famplan', referenceState:{screen:'perfil', pr:{view:'plan'}}, role:'admin', view:'plan' },
      { key:'familia-fambaja', label:'Mi Familia', flowId:'fambaja', referenceState:{screen:'familia'}, role:'admin', view:'baja' },
      { key:'familia-famcancelado', label:'Inicio', flowId:'famcancelado', referenceState:{screen:'home'}, role:'admin', view:'hub' },
      { key:'familia-faminvite', label:'Inicio', flowId:'faminvite', referenceState:{screen:'home'}, role:'invited', view:'hub' },
      { key:'familia-fammember', label:'Inicio', flowId:'fammember', referenceState:{screen:'home'}, role:'member', view:'hub' },
      { key:'familia-famayuda', label:'Mi Familia', flowId:'famayuda', referenceState:{screen:'familia'}, role:'member', view:'hub' },
      { key:'familia-famayudaan', label:'Analizador', flowId:'famayudaan', referenceState:{screen:'analizador', an:{view:'result',value:'https://clc.li/SeurPago-esp',verdict:'danger'}}, role:'member', view:'hub' },
      { key:'familia-famcomparto', label:'Mi Familia', flowId:'famcomparto', referenceState:{screen:'familia'}, role:'member', view:'hub' },
      { key:'familia-famverlucia', label:'Mi Familia', flowId:'famverlucia', referenceState:{screen:'familia'}, role:'member', view:'ficha' },
      { key:'familia-famplanmiembro', label:'Perfil', flowId:'famplanmiembro', referenceState:{screen:'perfil', pr:{view:'plan'}}, role:'member', view:'plan' },
      { key:'familia-famsalir', label:'Mi Familia', flowId:'famsalir', referenceState:{screen:'familia'}, role:'member', view:'salir' },
      { key:'familia-famtermina', label:'Inicio', flowId:'famtermina', referenceState:{screen:'home'}, role:'member', view:'hub' },
      { key:'familia-famfuera', label:'Inicio', flowId:'famfuera', referenceState:{screen:'home'}, role:'none', view:'hub' },
      { key:'familia-famcerrar', label:'Inicio', flowId:'famcerrar', referenceState:{screen:'home'}, role:'admin', view:'hub' }
    ],
  },
];

const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { headless: true });
const context = await browser.newContext({ viewport, reducedMotion: 'reduce', deviceScaleFactor: 1 });
const pages = { reference: await context.newPage(), app: await context.newPage() };
const errors = [];

async function load(page, url) {
  await page.goto(url, { waitUntil: 'load' });
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation: none !important; animation-duration: 0s !important; animation-delay: 0s !important;
      transition: none !important; transition-duration: 0s !important; transition-delay: 0s !important;
      scroll-behavior: auto !important; caret-color: transparent !important;
    }
  ` });
  await page.waitForFunction(() => document.querySelector('.tp-phone') !== null);
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 15000))]));
}

async function apply(page, scenario, plan) {
  await page.evaluate(({ scenario, plan }) => {
    const getC = () => {
      if (window.__lab) return window.__lab;
      const el = document.querySelector('.tp-phone');
      const key = Object.keys(el || {}).find(k => k.startsWith('__reactFiber'));
      let fiber = el && el[key];
      while (fiber) {
        if (fiber.stateNode?.logic?.labVals) return fiber.stateNode.logic;
        fiber = fiber.return;
      }
      return null;
    };
    const c = getC();
    if (!c) throw new Error('No se encontró la lógica del Lab.');
    c.labPickPlan(plan);
    if (scenario.flowId) {
      const flow = c.labFlows().find(item => item.id === scenario.flowId);
      if (flow) c.labSelect(flow, { plan });
      else {
        const base = scenario.referenceState || { screen:'familia' };
        c.setState({ flow:null, screen:base.screen, sheet:null, toast:null, fam:Object.assign({}, c.state.fam, { role:scenario.role, view:scenario.view }), pr:base.pr ? Object.assign({}, c.state.pr, base.pr) : c.state.pr, an:base.an ? Object.assign({}, c.state.an, base.an) : c.state.an });
      }
    } else if (scenario.action === 'lesson') {
      c.openLesson('sms');
    } else {
      const update = { flow: null, screen: scenario.screen, sheet: null, toast: null, splash: false };
      for (const [key, value] of Object.entries(scenario.patch || {})) {
        update[key] = value && typeof value === 'object' && !Array.isArray(value)
          ? Object.assign({}, c.state[key] || {}, value)
          : value;
      }
      c.setState(update);
    }
    c.labLabSet({ tab: 'phone', pv: 'closed', case: null, view: 'flow' });
    document.querySelectorAll('.tp-scroll, .lab-scroll').forEach(element => { element.scrollTop = 0; });
  }, { scenario, plan });
  if (scenario.waitMs) await page.waitForTimeout(scenario.waitMs);
  await page.waitForFunction(label => [...document.querySelectorAll('.tp-phone [data-screen-label]')].some(element =>
    element.getAttribute('data-screen-label') === label && element.getClientRects().length > 0 &&
    getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden'), scenario.label, { timeout: 5000 });
  const deadline = Date.now() + 12000;
  let previousShown;
  let stableSamples = 0;
  while (Date.now() < deadline) {
    const current = await page.evaluate(`(() => { ${GETC} const c = getC(); return c ? { shown:c.state.shown, toast:!!c.state.toast, splash:!!c.state.splash } : null; })()`);
    if (current && !current.toast && !current.splash && current.shown === previousShown) stableSamples += 1;
    else stableSamples = 0;
    previousShown = current?.shown;
    if (stableSamples >= 3) {
      await page.waitForTimeout(160);
      const afterMargin = await page.evaluate(`(() => { ${GETC} const c = getC(); return c ? { shown:c.state.shown, toast:!!c.state.toast, splash:!!c.state.splash } : null; })()`);
      if (afterMargin && !afterMargin.toast && !afterMargin.splash && afterMargin.shown === current.shown) return;
      previousShown = afterMargin?.shown;
      stableSamples = 0;
    }
    await page.waitForTimeout(100);
  }
  throw new Error('El anillo o el splash no se estabilizaron en 12 s.');
}

try {
  await Promise.all([
    load(pages.reference, referenceUrl),
    load(pages.app, appUrl),
  ]);

  const results = [];
  for (const area of areas) for (const scenario of area.cases) for (const plan of ['free', 'premium']) {
    if (onlyScenario && scenario.key !== onlyScenario) continue;
    const name = `${area.name} / ${scenario.key} / ${plan}`;
    try {
      await Promise.all([
        apply(pages.reference, scenario, plan),
        apply(pages.app, scenario, plan),
      ]);
      const [referenceLabels, appLabels] = await Promise.all(Object.values(pages).map(page => page.evaluate(() =>
        [...document.querySelectorAll('.tp-phone [data-screen-label]')]
          .filter(element => element.getClientRects().length > 0 && getComputedStyle(element).display !== 'none')
          .map(element => element.getAttribute('data-screen-label')))));
      const [referencePng, appPng] = await Promise.all([
        pages.reference.screenshot({ animations: 'disabled' }),
        pages.app.screenshot({ animations: 'disabled' }),
      ]);
      const referenceImage = PNG.sync.read(referencePng);
      const appImage = PNG.sync.read(appPng);
      if (referenceImage.width !== appImage.width || referenceImage.height !== appImage.height) {
        results.push({ area: area.name, screen: scenario.label, state: scenario.key, plan, status: 'SIZE', percent: 100, labelsMatch: JSON.stringify(referenceLabels) === JSON.stringify(appLabels) });
        continue;
      }
      const diffImage = new PNG({ width: referenceImage.width, height: referenceImage.height });
      const differentPixels = pixelmatch(referenceImage.data, appImage.data, diffImage.data, referenceImage.width, referenceImage.height, { threshold });
      const totalPixels = referenceImage.width * referenceImage.height;
      const percent = differentPixels * 100 / totalPixels;
      const labelsMatch = JSON.stringify(referenceLabels) === JSON.stringify(appLabels) && referenceLabels.includes(scenario.label);
      const status = percent <= maxDifferentPercent && labelsMatch ? 'PASS' : 'FAIL';
      results.push({ area: area.name, screen: scenario.label, state: scenario.key, plan, status, percent, differentPixels, totalPixels, labelsMatch });
      if (status !== 'PASS' && saveDiffsTo) {
        await mkdir(saveDiffsTo, { recursive: true });
        const stem = `${scenario.key}-${plan}`;
        await writeFile(resolve(saveDiffsTo, `${stem}-reference.png`), referencePng);
        await writeFile(resolve(saveDiffsTo, `${stem}-app.png`), appPng);
        await writeFile(resolve(saveDiffsTo, `${stem}-diff.png`), PNG.sync.write(diffImage));
      }
    } catch (error) {
      results.push({ area: area.name, screen: scenario.label, state: scenario.key, plan, status: 'ERROR', percent: null, labelsMatch: false, error: String(error.message || error) });
    }
  }

  const templateCoverage = await pages.reference.evaluate(() => {
    const name = window.__dcRootName?.();
    const html = name && window.__dcAnnotatedTemplate?.(name);
    if (!html) throw new Error('No se pudo leer la plantilla anotada del runtime.');
    const template = document.createElement('template');
    template.innerHTML = html;
    const labels = [...template.content.querySelectorAll('[data-screen-label]')].map(element => element.getAttribute('data-screen-label'));
    return { screenRoots: labels.length, uniqueLabels: [...new Set(labels)].sort() };
  });
  const configuredLabels = [...new Set(areas.flatMap(area => area.screens))].sort();
  const uncoveredTemplateLabels = templateCoverage.uniqueLabels.filter(label => !configuredLabels.includes(label));
  const unexpectedConfiguredLabels = configuredLabels.filter(label => !templateCoverage.uniqueLabels.includes(label));

  const report = {
    referenceUrl, appUrl, viewport, threshold, maxDifferentPercent,
    uniqueScreens: configuredLabels.length,
    templateScreenRoots: templateCoverage.screenRoots,
    templateUniqueLabels: templateCoverage.uniqueLabels.length,
    uncoveredTemplateLabels,
    unexpectedConfiguredLabels,
    structuralPass: uncoveredTemplateLabels.length === 0 && unexpectedConfiguredLabels.length === 0,
    scenariosPerPlan: areas.reduce((sum, area) => sum + area.cases.length, 0),
    compared: results.length,
    pass: results.filter(result => result.status === 'PASS').length,
    fail: results.filter(result => result.status !== 'PASS').length,
    areas: areas.map(area => {
      const rows = results.filter(result => result.area === area.name);
      return {
        name: area.name,
        screens: area.screens,
        statesPerPlan: area.cases.length,
        compared: rows.length,
        pass: rows.filter(result => result.status === 'PASS').length,
        fail: rows.filter(result => result.status !== 'PASS').length,
        maxPercent: Math.max(0, ...rows.map(result => result.percent ?? 100)),
      };
    }),
    results,
  };
  const jsonPath = resolve(root, 'tools', 'area-review-results.json');
  const markdownPath = resolve(root, 'tools', 'area-review.md');
  await writeFile(jsonPath, JSON.stringify(report, null, 2));
  const rows = report.areas.map(area => `| ${area.name} | ${area.screens.length} | ${area.statesPerPlan} × 2 planes | ${area.pass}/${area.compared} | ${area.maxPercent.toFixed(2)}% |`);
  const screenLists = areas.map(area => `### ${area.name}\n\n${area.screens.join(', ')}. Estados comparados: ${area.cases.map(item => item.key).join(', ')}.\n`).join('\n');
  const markdown = `# Revisión visual por áreas del móvil (Fase 2.4)\n\n` +
    `Referencia: ${referenceUrl}  \nApp: ${appUrl}  \nViewport: ${viewport.width} × ${viewport.height} (pestaña «phone»)  \nPixelmatch: umbral ${threshold}; máximo ${maxDifferentPercent.toFixed(2)}%.\n\n` +
    `Estructura del runtime: **${report.templateUniqueLabels} etiquetas únicas** en **${report.templateScreenRoots} nodos de pantalla**; etiquetas incluidas en las áreas: **${report.structuralPass ? 'todas' : 'faltan ' + uncoveredTemplateLabels.join(', ')}**.\n\n` +
    `Comparaciones: **${report.compared}** · PASS **${report.pass}** · FAIL **${report.fail}** · pantallas únicas **${report.uniqueScreens}**.\n\n` +
    `| Área | Pantallas únicas | Estados por plan | PASS | Máxima diferencia |\n|---|---:|---:|---:|---:|\n${rows.join('\n')}\n\n` +
    `La revisión aplica los estados de móvil en referencia y app y compara la captura en memoria; no guarda PNG adicionales.\n\n` +
    `El inventario de 'tasks/todo.md' menciona 32 instancias. El parser del runtime devuelve 29 nodos con 'data-screen-label' (28 etiquetas únicas); las tres coincidencias adicionales del recuento literal son selectores de lógica para Acceso, SOS y Mi Familia, no nodos de pantalla.\n\n` +
    screenLists;
  await writeFile(markdownPath, markdown);
  console.log(`Áreas: ${report.areas.length} · pantallas únicas: ${report.uniqueScreens} · nodos de pantalla: ${report.templateScreenRoots} · escenarios por plan: ${report.scenariosPerPlan}`);
  console.log(`Cobertura estructural: ${report.structuralPass ? 'PASS' : 'FAIL'}`);
  console.log(`Comparaciones: ${report.compared} · PASS ${report.pass} · FAIL ${report.fail}`);
  for (const area of report.areas) console.log(`${area.name}: ${area.pass}/${area.compared} · máximo ${area.maxPercent.toFixed(2)}%`);
  console.log(`Informe: ${markdownPath}`);
  console.log(`Datos: ${jsonPath}`);
  if (report.fail || !report.structuralPass) process.exitCode = 1;
} finally {
  await browser.close();
}
