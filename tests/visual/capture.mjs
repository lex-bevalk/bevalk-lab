import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1680, height: 916 },
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 375, height: 812 },
];
const SCROLL_VIEWPORTS = new Set(['1680x916', '1024x768', '375x812']);
const MAX_CAPTURES = 3000;
const MAX_BYTES = 900 * 1024 * 1024;
const DEFAULT_REFERENCE = 'http://127.0.0.1:8765/project/Main.dc.html';
const [url = DEFAULT_REFERENCE, outArg] = process.argv.slice(2);
if (!outArg) {
  console.error('Uso: node tests/visual/capture.mjs <url> <outDir>');
  process.exit(2);
}

const outDir = resolve(process.cwd(), outArg);
await mkdir(outDir, { recursive: true });
const browserOptions = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {};
const browser = await chromium.launch({ ...browserOptions, headless: true });
const context = await browser.newContext({ viewport: VIEWPORTS[0], reducedMotion: 'reduce', deviceScaleFactor: 1 });
const page = await context.newPage();
const missing = [];
const screenshots = [];
let flows = [];
let caseGroups = [];
let totalBytes = 0;
const GETC = `const getC = () => { if (window.__lab) return window.__lab; const el = document.querySelector('.tp-phone'); const k = Object.keys(el || {}).find(k => k.startsWith('__reactFiber')); let f = el && el[k]; while (f) { if (f.stateNode && f.stateNode.logic && f.stateNode.logic.labVals) return f.stateNode.logic; f = f.return; } return null; };`;

page.on('response', response => {
  if (response.status() !== 404) return;
  const originalUrl = response.url();
  let decodedUrl = originalUrl;
  try { decodedUrl = decodeURIComponent(originalUrl); } catch {}
  missing.push({
    url: originalUrl,
    status: response.status(),
    resourceType: response.request().resourceType(),
    templateRoute: decodedUrl.includes('{{'),
  });
});

async function loadAt(viewport) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'load' });
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation: none !important;
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition: none !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      scroll-behavior: auto !important;
      caret-color: transparent !important;
    }
  ` });
  await page.evaluate(() => Promise.race([
    document.fonts.ready,
    new Promise(resolve => setTimeout(resolve, 15000)),
  ]));
  await page.waitForFunction(() => document.querySelector('.lab') !== null, null, { timeout: 15000 });
}

async function logic(expression) {
  return page.evaluate(`(() => { ${GETC} const c = getC(); if (!c) throw new Error('No se encontró la lógica del Lab'); ${expression} })()`);
}

async function settle() {
  await page.waitForFunction(() => {
    const el = document.querySelector('.tp-phone');
    let c = window.__lab;
    if (!c && el) {
      const key = Object.keys(el).find(k => k.startsWith('__reactFiber'));
      let fiber = key ? el[key] : null;
      while (fiber) {
        if (fiber.stateNode?.logic?.labVals) { c = fiber.stateNode.logic; break; }
        fiber = fiber.return;
      }
    }
    if (!c) return false;
    const shown = c.state.shown;
    const toast = !!c.state.toast;
    const previous = window.__visualSettlePrevious;
    const stable = !toast && previous && previous.shown === shown ? previous.stable + 1 : 0;
    window.__visualSettlePrevious = { shown, stable };
    return stable >= 2;
  }, null, { timeout: 20000, polling: 50 });
  await page.waitForTimeout(40);
}
async function capture(viewport, stem, settleFirst = true) {
  if (settleFirst) await settle();
  await page.evaluate(() => document.fonts.ready);
  const name = `${viewport.width}x${viewport.height}--${stem}.png`;
  if (screenshots.length >= MAX_CAPTURES) throw new Error(`Presupuesto excedido: más de ${MAX_CAPTURES} capturas.`);
  const png = await page.screenshot({ animations: 'disabled' });
  if (totalBytes + png.length > MAX_BYTES) throw new Error(`Presupuesto excedido: más de ${MAX_BYTES / (1024 * 1024)} MiB.`);
  await writeFile(join(outDir, name), png);
  const code = stem.match(/(?:^|-)F\d{2}(?:-|$)/)?.[0]?.replace(/^-/, '').replace(/-$/, '');
  const flowId = code ? (flows.find(flow => flow.code === code)?.id || null) : null;
  const visualState = await page.evaluate(`(() => {
    ${GETC}
    const c = getC();
    if (!c) throw new Error('No se encontró la lógica del Lab al guardar el manifiesto visual');
    const box = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width < 1 || rect.height < 1) return null;
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    const vals = c.renderVals();
    const famHome = Boolean(vals.famHome?.show);
    const famAnNudge = Boolean(vals.famAn?.nudge);
    const famAnShow = Boolean(vals.famAn?.show);
    const familyScreen = vals.isFamilia === true || c.state?.screen === 'familia';
    const famHomeVisible = c.state?.screen === 'home' && famHome;
    return {
      boxes: { labA: box('.lab-a'), tpPhone: box('.tp-phone') },
      family: { famHome, famHomeVisible, famAnNudge, famAnShow, screen: c.state?.screen || null, familyScreen },
      maskPhone: famHomeVisible || famAnNudge || famAnShow || familyScreen,
    };
  })()`);
  const flow = flowId ? flows.find(item => item.id === flowId) : null;
  screenshots.push({ name, bytes: png.length, flowId, flowGroup: flow?.group || null, ...visualState });
  totalBytes += png.length;
  if (screenshots.length % 50 === 0) console.log(`Progreso: ${screenshots.length} capturas`);
}

async function captureScrolls(viewport, stem) {
  const viewportKey = `${viewport.width}x${viewport.height}`;
  if (!SCROLL_VIEWPORTS.has(viewportKey)) return;
  const tabs = viewport.width === 375 ? ['flows', 'info', 'phone'] : [null];
  for (const tab of tabs) {
    if (tab) {
      await logic(`c.labLabSet({ tab:${JSON.stringify(tab)}, pv:'closed' });`);
      await page.waitForTimeout(80);
    } else if (viewport.width === 1024) {
      await logic(`c.labLabSet({ pv:'open' });`);
      await page.waitForTimeout(300);
    }
    await page.evaluate(() => document.querySelectorAll('.lab-scroll, .tp-scroll').forEach(element => { element.scrollTop = 0; }));
    const regions = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll('.lab-scroll, .tp-scroll')];
      return candidates.flatMap((element, index) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width < 2 || rect.height < 2) return [];
        const max = element.scrollHeight - element.clientHeight;
        if (max < 2 || element.clientHeight < 2) return [];
        const panel = element.closest('.lab-a') ? 'nav' : element.closest('.lab-b') ? 'detail' : element.closest('.lab-c') || element.matches('.tp-scroll') ? 'phone' : `panel-${index}`;
        return [{ index, panel, max, step: element.clientHeight, segments: Math.ceil(max / element.clientHeight) + 1 }];
      });
    });
    const segmentCount = Math.max(0, ...regions.map(region => region.segments));
    for (let segment = 0; segment < segmentCount; segment += 1) {
      await page.evaluate(({ regions, segment }) => {
        const elements = [...document.querySelectorAll('.lab-scroll, .tp-scroll')];
        elements.forEach(element => { element.scrollTop = 0; });
        for (const region of regions) {
          const element = elements[region.index];
          if (element) element.scrollTop = Math.min(segment * region.step, region.max);
        }
      }, { regions: regions.map(({ index, step, max }) => ({ index, step, max })), segment });
      await page.waitForTimeout(40);
      const areas = [...new Set(regions.map(region => region.panel))].join('-');
      const tabSuffix = tab ? `-${tab}` : '';
      await capture(viewport, `${stem}-scroll-${areas}${tabSuffix}-${String(segment).padStart(2, '0')}`, false);
    }
    if (!tab && viewport.width === 1024) {
      await logic(`c.labLabSet({ pv:'closed' });`);
      await page.waitForTimeout(300);
    }
  }
  if (viewport.width === 375) {
    await logic(`c.labLabSet({ tab:'flows', pv:'closed' });`);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => document.querySelectorAll('.lab-scroll, .tp-scroll').forEach(element => { element.scrollTop = 0; }));
}

try {
  for (const viewport of VIEWPORTS) {
    await loadAt(viewport);
    if (!flows.length) {
      flows = await logic('return c.labFlows().filter(f => !String(f.group || f.grp || "").startsWith("Mi Familia ·")).map(f => ({ id:f.id, code:c.labN(f), group:f.group || f.grp || null }));');
      caseGroups = await logic(`
        const seen = new Set(); const groups = [];
        for (const f of c.labFlows().filter(f => !String(f.group || f.grp || "").startsWith("Mi Familia ·"))) for (const cs of (c.labD(f.id).cases || [])) {
          if (!cs.cat || seen.has(cs.cat)) continue;
          seen.add(cs.cat); groups.push({ category:cs.cat, flowId:f.id, flowCode:c.labN(f), caseId:cs.id, title:cs.t });
        }
        return groups;
      `);
    }

    await capture(viewport, 'cover');
    await captureScrolls(viewport, 'cover');
    for (const plan of ['free', 'premium']) {
      await logic(`c.setState({flow:null}); c.labPickPlan(${JSON.stringify(plan)});`);
      for (const flow of flows) {
        await logic(`const f = c.labFlows().find(x => x.id === ${JSON.stringify(flow.id)}); c.labSelect(f);`);
        const stem = `flow-${flow.code}-${plan}`;
        await capture(viewport, stem);
        await captureScrolls(viewport, stem);
      }
    }
    for (const group of caseGroups) {
      await logic(`const f = c.labFlows().find(x => x.id === ${JSON.stringify(group.flowId)}); c.labSelect(f); c.labStartCase(${JSON.stringify(group.caseId)});`);
      await page.waitForFunction(() => {
        const el = document.querySelector('.tp-phone');
        let c = window.__lab;
        if (!c && el) {
          const key = Object.keys(el).find(k => k.startsWith('__reactFiber'));
          let fiber = key ? el[key] : null;
          while (fiber) {
            if (fiber.stateNode?.logic?.labVals) { c = fiber.stateNode.logic; break; }
            fiber = fiber.return;
          }
        }
        return c && !c.state.lab.prepping;
      }, null, { timeout: 8000 });
      await page.evaluate(() => document.getElementById('lab-case-detail')?.scrollIntoView({ block: 'nearest', behavior: 'instant' }));
      await capture(viewport, `case-${slug(group.category)}-${group.flowCode}-${group.caseId}`);
    }
  }

  const drawerViewport = VIEWPORTS.find(v => v.width === 1024);
  await loadAt(drawerViewport);
  await logic(`c.labLabSet({ pv:'open' });`);
  await capture(drawerViewport, 'drawer-open');

  const mobileViewport = VIEWPORTS.find(v => v.width === 375);
  await loadAt(mobileViewport);
  for (const tab of ['flows', 'info', 'phone']) {
    await logic(`c.labLabSet({ tab:${JSON.stringify(tab)} });`);
    await capture(mobileViewport, `tab-${tab}`);
  }

  const files = screenshots;
  const template404 = missing.filter(item => item.templateRoute);
  const other404 = missing.filter(item => !item.templateRoute);
  await writeFile(join(outDir, 'network-404s.json'), JSON.stringify({
    url,
    total: missing.length,
    templateRoutes: template404.length,
    otherRoutes: other404.length,
    template: template404,
    other: other404,
  }, null, 2));
  await writeFile(join(outDir, 'capture-manifest.json'), JSON.stringify({
    url,
    viewports: VIEWPORTS,
    scrollViewports: [...SCROLL_VIEWPORTS],
    scrollCapturePolicy: 'Por escena cover/flow, los .lab-scroll y .tp-scroll visibles avanzan simultáneamente, cada uno en pasos de su clientHeight, para capturar todos sus tramos con un solo PNG por paso; a 375px se recorren por separado las pestañas flows/info/phone y a 1024px se abre la vista previa.',
    flowCount: flows.length,
    plans: ['free', 'premium'],
    caseGroupCount: caseGroups.length,
    caseGroups,
    specialScenes: ['1024x768--drawer-open.png', '375x812--tab-flows.png', '375x812--tab-info.png', '375x812--tab-phone.png'],
    captureCount: screenshots.length,
    totalBytes,
    captures: files,
  }, null, 2));
  console.log(`Capturas: ${screenshots.length} · ${files.length} PNG · ${(totalBytes / (1024 * 1024)).toFixed(2)} MiB`);
  console.log(`Flujos: ${flows.length} · planes: 2 · categorías de casos: ${caseGroups.length}`);
  console.log(`404: ${missing.length} (${template404.length} rutas {{...}}, ${other404.length} otras)`);
  console.log(`Manifiesto: ${join(outDir, 'capture-manifest.json')}`);
} finally {
  await browser.close();
}

function slug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
