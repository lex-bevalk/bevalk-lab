const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { PNG } = require('pngjs');

const baseUrl = (process.env.LAB_URL || 'http://localhost:4173/concept.html')
  .replace(/\/concept\.html\/?$/, '')
  .replace(/\/$/, '');
const pages = [
  { path: '/concept.html', proto: 'concept', review: false },
  { path: '/concept-review.html', proto: 'concept', review: true },
  { path: '/', proto: 'current', review: false },
  { path: '/review.html', proto: 'current', review: true }
];
const viewports = [375, 900, 1440];
const layoutViewports = [1440, 1200, 1000];
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

function intersects(first, second) {
  return first.left < second.right && first.right > second.left
    && first.top < second.bottom && first.bottom > second.top;
}

async function showFlowsPanel(page, width) {
  if (width < 900 && await page.locator('.lab-tabs').isVisible().catch(() => false)) {
    await page.locator('.lab-tabs button').first().click();
  }
}

async function measureNavPlacement(page) {
  return page.evaluate(() => {
    const selector = document.querySelector('.proto-switch');
    const column = selector?.closest('.lab-a, nav.lab-col');
    if (!selector || !column) throw new Error('El selector no está dentro de la columna de navegación.');
    const title = [...column.querySelectorAll('span')].find(element =>
      ['BeValk Lab', 'Flow Explorer'].includes(element.textContent.trim()));
    const subtitle = [...column.querySelectorAll('span')].find(element =>
      element.textContent.includes(' flujos · ') && element.textContent.includes(' grupos'));
    const nextControl = column.querySelector('input[type="search"]');
    if (!title || !subtitle || !nextControl) throw new Error('Falta el título, subtítulo o control siguiente en la cabecera.');
    const box = element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.left, y: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const selectorBox = box(selector);
    const columnBox = box(column);
    const subtitleBox = box(subtitle);
    const nextBox = box(nextControl);
    const flowItems = [...column.querySelectorAll('.lab-item, .lab-scroll button')].filter(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    });
    const overlapsFlow = flowItems.some(element => {
      const rect = box(element);
      return selectorBox.x < rect.right && selectorBox.right > rect.x
        && selectorBox.y < rect.bottom && selectorBox.bottom > rect.y;
    });
    const style = getComputedStyle(selector);
    const visible = style.display !== 'none' && style.visibility !== 'hidden'
      && Number(style.opacity) > 0 && selector.getClientRects().length > 0;
    const internalScrolls = Object.fromEntries([
      ['navigation', column],
      ['center', document.querySelector('.lab-b .lab-scroll')],
      ['phone', document.querySelector('.tp-phone .tp-scroll')]
    ].map(([name, element]) => {
      if (!element) return [name, null];
      const scrollStyle = getComputedStyle(element);
      return [name, {
        overflowY: scrollStyle.overflowY,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight
      }];
    }));
    return {
      visible,
      inColumn: column.contains(selector),
      scrollTop: column.scrollTop,
      column: columnBox,
      selector: selectorBox,
      subtitle: subtitleBox,
      nextControl: nextBox,
      overlapsFlow,
      flowsChecked: flowItems.length,
      internalScrolls
    };
  });
}

async function measureNavParity(page, path) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const concept = document.documentElement.dataset.proto === 'concept';
    const column = document.querySelector(concept ? '.lab-a' : 'nav.lab-col');
    const title = [...column.querySelectorAll('span')].find(element => element.textContent.trim() === 'BeValk Lab');
    const subtitleText = [...column.querySelectorAll('span')].find(element => element.childElementCount === 0
      && element.textContent.includes(' flujos · ') && element.textContent.includes(' grupos'));
    const subtitle = subtitleText?.parentElement;
    const planLabel = [...column.querySelectorAll('span')].find(element => element.textContent.trim() === 'Modalidad simulada');
    const planHelp = planLabel?.parentElement.querySelector(':scope > span:last-child');
    const section = column.querySelector('[role="group"][aria-label="Sección"]');
    const plan = column.querySelector('[aria-labelledby="lab-mod"]');
    const rows = [...column.querySelectorAll('.lab-item, .lab-scroll [role="group"] > button')];
    const row = rows.find(element => element.querySelector(':scope > span:nth-of-type(2)')?.textContent.trim() === 'Crea su cuenta');
    if (!column || !title || !subtitle || !section || !planLabel || !plan || !planHelp || !row) {
      throw new Error('Faltan elementos del nav para medir la paridad Current/Concept.');
    }
    const label = row.querySelector(':scope > span:nth-of-type(2)');
    const group = row.parentElement.querySelector(':scope > span');
    const elements = {
      icon: column.querySelector(':scope > div:first-of-type > span[aria-hidden="true"]'),
      title,
      subtitle,
      selector: column.querySelector('.proto-switch'),
      search: column.querySelector('input[type="search"]'),
      tabs: section,
      planLabel,
      toggle: plan,
      planHelp,
      group,
    };
    const box = (element, fontElement = element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: Number(rect.x.toFixed(2)),
        y: Number(rect.y.toFixed(2)),
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2)),
        fontSize: Number.parseFloat(getComputedStyle(fontElement).fontSize)
      };
    };
    const measurements = Object.fromEntries(Object.entries(elements).map(([key, element]) => [key, box(element,
      key === 'tabs' ? section.querySelector('button')
        : key === 'toggle' ? plan.querySelector('button')
          : element)]));
    const titleText = title.textContent.trim();
    const searchPlaceholder = column.querySelector('input[type="search"]').getAttribute('placeholder');
    row.scrollIntoView({ block: 'start' });
    measurements.row = box(row, label);
    const labBackground = getComputedStyle(document.querySelector('.lab')).backgroundColor;
    const cardSelectors = concept ? ['.lab-a', '.lab-b', '.lab-c'] : ['nav.lab-col', 'main.lab-col', 'aside.lab-pv'];
    const cardNames = ['nav', 'center', 'preview'];
    const cards = Object.fromEntries(cardSelectors.map((selector, index) => {
      const style = getComputedStyle(document.querySelector(selector));
      return [cardNames[index], {
        background: style.backgroundColor,
        border: style.borderTopColor,
        radius: style.borderTopLeftRadius
      }];
    }));
    return { titleText, searchPlaceholder, measurements, labBackground, cards };
  });
}

async function measureColumns(page, path, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const concept = document.documentElement.dataset.proto === 'concept';
    const selectors = concept
      ? { nav: '.lab-a', center: '.lab-b', preview: '.lab-c' }
      : { nav: 'nav.lab-col', center: 'main.lab-col', preview: 'aside.lab-pv' };
    return Object.fromEntries(Object.entries(selectors).map(([key, selector]) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Falta ${key} (${selector})`);
      const rect = element.getBoundingClientRect();
      return [key, { x: Number(rect.left.toFixed(2)), width: Number(rect.width.toFixed(2)) }];
    }));
  });
}

const FONT_FIELDS = ['fontSize', 'lineHeight', 'fontWeight', 'fontFamily', 'letterSpacing'];
const CONCEPT_CENTER_SCALE = new Set(['11px', '12px', '13px', '14px', '15px', '16px', '17px', '28px', '32px']);

async function measureCoverTypography(page, pathname) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const hasCoverageDetails = await page.locator('.lab-b details > summary').filter({ hasText: 'Cobertura de flujos' }).count();
  if (hasCoverageDetails) await page.locator('.lab-b details > summary').filter({ hasText: 'Cobertura de flujos' }).first().click();

  return page.evaluate(() => {
    const concept = document.documentElement.dataset.proto === 'concept';
    const center = document.querySelector(concept ? '.lab-b' : 'main.lab-col');
    if (!center) throw new Error('No se encontró el panel central para medir la portada.');
    const font = (element, role) => {
      if (!element) throw new Error(`Falta el rol tipográfico de portada: ${role}.`);
      const style = getComputedStyle(element);
      return {
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        fontWeight: style.fontWeight,
        fontFamily: style.fontFamily,
        letterSpacing: style.letterSpacing
      };
    };
    const heading = center.querySelector('h1');
    const hero = heading?.parentElement;
    const eyebrow = hero?.querySelector(':scope > span');
    const intro = hero?.querySelector(':scope > p');
    const statNumber = [...center.querySelectorAll('span')].find(element =>
      element.textContent.trim() && getComputedStyle(element).fontSize === '28px');
    if (!heading || !statNumber) throw new Error('No se encontraron el titular o las estadísticas de la portada.');
    const statCard = statNumber.closest('div');
    const statLabel = [...statCard.querySelectorAll('span')].find(element =>
      element !== statNumber && getComputedStyle(element).fontSize === '14px');
    let statsGrid = statNumber;
    while (statsGrid && getComputedStyle(statsGrid).display !== 'grid') statsGrid = statsGrid.parentElement;
    const statsRows = statsGrid
      ? new Set([...statsGrid.children].map(element => Math.round(element.getBoundingClientRect().top))).size
      : 0;
    const howHeading = [...center.querySelectorAll('h2')].find(element => element.textContent.trim() === 'Cómo se usa');
    const firstStep = howHeading?.parentElement.querySelector('ol li');
    const stepNumber = firstStep?.querySelector('span[aria-hidden="true"]');
    const stepTitle = [...(firstStep?.querySelectorAll('span') || [])].find(element => getComputedStyle(element).fontSize === '15px');
    const stepDescription = [...(firstStep?.querySelectorAll('span') || [])].find(element =>
      !element.closest('[aria-hidden="true"]') && getComputedStyle(element).fontSize === '14px');
    const startHeading = [...center.querySelectorAll('h2')].find(element => element.textContent.trim() === 'Empieza por aquí');
    const firstStart = startHeading?.parentElement.querySelector('button');
    const startSpans = [...(firstStart?.querySelectorAll('span') || [])].filter(element => element.textContent.trim());
    const startMeta = startSpans.find(element => getComputedStyle(element).fontSize === '12px'
      && getComputedStyle(element).fontFamily.includes('Geist Mono'));
    const startTitle = startSpans.find(element => getComputedStyle(element).fontSize === '17px');
    const startDescription = startSpans.find(element => getComputedStyle(element).fontSize === '14px');
    const table = center.querySelector('[role="table"], table');
    const tableRows = table ? [...table.querySelectorAll('[role="row"], tr')] : [];
    const header = table?.querySelector('[role="columnheader"], th');
    const firstDataRow = tableRows.find(row => row.querySelector('[role="cell"], td'));
    const cells = firstDataRow?.querySelectorAll('[role="cell"], td');
    const coverageName = cells?.[0]?.querySelector('button') || cells?.[0];
    const coveragePlan = cells?.[1];
    const coverageNumber = cells?.[2];
    const sectionEyebrow = element => font(element);
    return {
      breadcrumb: font(center.querySelector('nav[aria-label="Ruta"]'), 'breadcrumb'),
      eyebrow: sectionEyebrow(eyebrow, 'eyebrow'),
      title: font(heading, 'title'),
      intro: font(intro, 'intro'),
      statNumber: font(statNumber, 'statNumber'),
      statLabel: font(statLabel, 'statLabel'),
      howEyebrow: font(howHeading, 'howEyebrow'),
      stepNumber: font(stepNumber, 'stepNumber'),
      stepTitle: font(stepTitle, 'stepTitle'),
      stepDescription: font(stepDescription, 'stepDescription'),
      startEyebrow: font(startHeading, 'startEyebrow'),
      startMeta: font(startMeta, 'startMeta'),
      startTitle: font(startTitle, 'startTitle'),
      startDescription: font(startDescription, 'startDescription'),
      coverageHeader: font(header, 'coverageHeader'),
      coverageName: font(coverageName, 'coverageName'),
      coveragePlan: font(coveragePlan, 'coveragePlan'),
      coverageNumber: font(coverageNumber, 'coverageNumber'),
      statsItems: statsGrid?.children.length || 0,
      statsRows,
      fontSizes: [...center.querySelectorAll('*')]
        .filter(element => element.textContent.trim())
        .map(element => getComputedStyle(element).fontSize)
    };
  });
}

async function selectFlow(page, pathname) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'load' });
  const concept = pathname.startsWith('/concept');
  const navigation = page.locator(concept ? '.lab-a' : 'nav.lab-col');
  await navigation.getByRole('searchbox').fill('Le llega un enlace peligroso');
  const rows = concept ? navigation.locator('.lab-scroll button') : navigation.locator('.lab-item');
  await rows.filter({ hasText: 'Le llega un enlace peligroso' }).first().click();
  await page.locator(concept ? '.lab-b h1' : 'main.lab-col h1').filter({ hasText: 'Le llega un enlace peligroso' }).waitFor();
  await page.evaluate(() => document.fonts.ready);
}

async function measureFlowTypography(page, pathname) {
  await selectFlow(page, pathname);
  return page.evaluate(() => {
    const concept = document.documentElement.dataset.proto === 'concept';
    const center = document.querySelector(concept ? '.lab-b' : 'main.lab-col');
    if (!center) throw new Error('No se encontró el panel central para medir la ficha.');
    const font = element => {
      if (!element) throw new Error('Falta un rol tipográfico de ficha.');
      const style = getComputedStyle(element);
      return {
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        fontWeight: style.fontWeight,
        fontFamily: style.fontFamily,
        letterSpacing: style.letterSpacing
      };
    };
    const normalized = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const heading = [...center.querySelectorAll('h2')].find(element => normalized(element.textContent).includes('casos extremos'));
    const groupSummary = [...(heading?.parentElement.children || [])].find(element => element !== heading && element.tagName === 'SPAN');
    const code = [...center.querySelectorAll('span')].find(element => /^[A-Z]\d{2}$/.test(element.textContent.trim()));
    const group = [...(code?.parentElement.querySelectorAll('span') || [])].find(element => element !== code
      && element.textContent.trim() && getComputedStyle(element).fontSize === '14px');
    const dataList = center.querySelector('dl');
    const dataLabel = dataList?.querySelector('dt');
    const dataValue = dataList?.querySelector('dd');
    const storyHeading = center.querySelector(concept ? '#lab-us' : '#lab-jtbd');
    const storyList = storyHeading?.parentElement.querySelector('dl');
    const storyTerm = storyList?.querySelector('dt');
    const storyText = storyList?.querySelector('dd');
    const watchHeading = [...center.querySelectorAll('h2')].find(element => normalized(element.textContent) === 'que mirar');
    const watchBody = watchHeading?.parentElement.querySelector('p');
    const firstCase = center.querySelector('article');
    const caseSpans = [...(firstCase?.querySelectorAll('span') || [])];
    const caseCode = caseSpans.find(element => getComputedStyle(element).fontSize === '12px'
      && getComputedStyle(element).fontFamily.includes('Geist Mono'));
    const caseChip = caseSpans.find(element => getComputedStyle(element).fontSize === '11px');
    const caseTitle = firstCase?.querySelector('h3');
    const caseDescription = firstCase?.querySelector('p');
    const caseButton = [...(firstCase?.querySelectorAll('button') || [])].find(element => /Probar/.test(element.textContent));
    const sectionTitles = [...center.querySelectorAll('h2')].map(font);
    const allDetails = [...center.querySelectorAll('details summary')];
    const acceptanceTitle = allDetails.find(element => normalized(element.textContent).includes('criterios de aceptacion del flujo'));
    const environmentTitle = allDetails.find(element => normalized(element.textContent).startsWith('entorno de prueba'));
    const problemLabel = [...center.querySelectorAll('span')].find(element => normalized(element.textContent) === 'problema');
    const problemBody = [...(problemLabel?.parentElement.querySelectorAll('span') || [])].find(element => element !== problemLabel
      && element.textContent.trim() && getComputedStyle(element).fontSize === '14px');
    const gwtLabel = [...center.querySelectorAll('strong')].find(element => element.textContent.trim() === 'GIVEN');
    const gwtBodies = [...center.querySelectorAll('strong')]
      .filter(element => /^(GIVEN|WHEN|THEN)$/.test(element.textContent.trim()))
      .map(element => font(element.parentElement));
    const environmentLabel = center.querySelector('[role="radiogroup"] > span');
    const caseSummary = groupSummary;
    return {
      breadcrumb: font(center.querySelector('nav[aria-label="Ruta"]')),
      resetButton: font([...center.querySelectorAll('button')].find(element => element.textContent.includes('Reiniciar'))),
      metaCode: font(code),
      metaGroup: font(group),
      dataLabel: font(dataLabel),
      dataValue: font(dataValue),
      sectionTitles,
      storyTerm: font(storyTerm),
      storyText: font(storyText),
      caseSummary: font(caseSummary),
      caseCode: font(caseCode),
      caseChip: font(caseChip),
      caseTitle: font(caseTitle),
      caseDescription: font(caseDescription),
      caseButton: font(caseButton),
      watchBody: font(watchBody),
      problemLabel: concept ? font(problemLabel) : null,
      problemBody: concept ? font(problemBody) : null,
      acceptanceTitle: concept ? font(acceptanceTitle) : null,
      environmentTitle: concept ? font(environmentTitle) : null,
      gwtLabel: concept ? font(gwtLabel) : null,
      gwtBodies: concept ? gwtBodies : null,
      environmentLabel: concept ? font(environmentLabel) : null,
      environmentRadio: concept ? font(center.querySelector('button[role="radio"]')) : null,
      fontSizes: [...center.querySelectorAll('*')]
        .filter(element => element.textContent.trim())
        .map(element => getComputedStyle(element).fontSize)
    };
  });
}

function assertFontParity(label, current, concept) {
  for (const field of FONT_FIELDS) {
    assert.equal(concept[field], current[field], `${label}.${field}: Current ${current[field]}, Concept ${concept[field]}`);
  }
}

function relativeLuminance(data) {
  const linear = channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  let total = 0;
  let count = 0;
  for (let index = 0; index < data.length; index += 4) {
    total += 0.2126 * linear(data[index]) + 0.7152 * linear(data[index + 1]) + 0.0722 * linear(data[index + 2]);
    count += 1;
  }
  return total / count;
}

async function capturePrototypeTransition(browser, from, to, name) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    window.__g8Pagereveal = null;
    window.addEventListener('pagereveal', event => {
      const root = document.querySelector('#root');
      const reviewRoot = document.querySelector('#review-root');
      window.__g8Pagereveal = {
        hasViewTransition: Boolean(event.viewTransition),
        rootContent: Boolean(root?.childElementCount && root.textContent.trim()),
        reviewContent: !location.pathname.includes('review') || Boolean(reviewRoot?.childElementCount && reviewRoot.textContent.trim()),
        pathname: location.pathname
      };
    });
  });
  await page.goto(`${baseUrl}${from}`, { waitUntil: 'load' });
  await page.evaluate(() => { window.__g8Pagereveal = null; });

  const client = await page.context().newCDPSession(page);
  await client.send('Page.enable');
  const frames = [];
  let capture = false;
  let clickedAt = 0;
  let brightestFrame = null;
  client.on('Page.screencastFrame', frame => {
    client.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {});
    if (!capture) return;
    const elapsedMs = Date.now() - clickedAt;
    if (elapsedMs < 0 || elapsedMs > 1500) return;
    const data = Buffer.from(frame.data, 'base64');
    const image = PNG.sync.read(data);
    const meanLuminance = relativeLuminance(image.data);
    const sample = { elapsedMs, meanLuminance: Number(meanLuminance.toFixed(5)) };
    frames.push(sample);
    if (!brightestFrame || meanLuminance > brightestFrame.meanLuminance) {
      brightestFrame = { ...sample, meanLuminance, data };
    }
  });
  await client.send('Page.startScreencast', { format: 'png', maxWidth: 1440, maxHeight: 900, everyNthFrame: 2 });
  capture = true;
  clickedAt = Date.now();
  const targetName = to.includes('concept') ? 'Concept' : 'Current';
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load' }),
    page.locator('.proto-switch').getByRole('link', { name: targetName, exact: true }).click()
  ]);
  const remainingMs = Math.max(0, 1500 - (Date.now() - clickedAt));
  if (remainingMs) await page.waitForTimeout(remainingMs);
  capture = false;
  await client.send('Page.stopScreencast');
  const reveal = await page.evaluate(() => window.__g8Pagereveal);
  const artifactDirectory = path.resolve(__dirname, '../../.tmp/proto-switch-gate');
  fs.mkdirSync(artifactDirectory, { recursive: true });
  const framePath = path.join(artifactDirectory, `${name}.png`);
  if (brightestFrame) fs.writeFileSync(framePath, brightestFrame.data);
  const reportPath = path.join(artifactDirectory, `${name}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ from, to, reveal, frameCount: frames.length, frames }, null, 2));
  await client.detach();
  await page.close();
  return {
    name,
    from,
    to,
    reveal,
    frames,
    maxLuminance: brightestFrame?.meanLuminance ?? null,
    framePath,
    reportPath
  };
}

(async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    headless: true
  });
  let assertions = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    for (const item of pages) {
      await page.goto(`${baseUrl}${item.path}`, { waitUntil: 'load' });
      const nav = page.locator('.proto-switch');
      await nav.waitFor({ state: 'attached' });
      await showFlowsPanel(page, 1440);
      await nav.waitFor({ state: 'visible' });
      assert.equal(await nav.locator('a').count(), 2, `${item.path}: two prototype links`);
      const currentHref = item.review ? '/review' : '/';
      const conceptHref = item.review ? '/concept/review' : '/concept';
      const current = nav.getByRole('link', { name: 'Current', exact: true });
      const concept = nav.getByRole('link', { name: 'Concept', exact: true });
      assert.equal(await current.getAttribute('href'), currentHref, `${item.path}: Current href`);
      assert.equal(await concept.getAttribute('href'), conceptHref, `${item.path}: Concept href`);
      assert.equal(await (item.proto === 'current' ? current : concept).getAttribute('aria-current'), 'page', `${item.path}: active prototype`);
      assert.equal(await page.locator('html').getAttribute('data-proto'), item.proto, `${item.path}: document prototype`);
      assert.ok(await nav.evaluate(element => !!element.closest('.lab-a, nav.lab-col')), `${item.path}: selector lives in the prototype navigation`);
      assertions += 6;

      await page.addScriptTag({ content: axeSource });
      const violations = await page.evaluate(async () => {
        const root = document.querySelector('.proto-switch');
        if (!root) throw new Error('Missing .proto-switch');
        const result = await axe.run(root, { resultTypes: ['violations'] });
        return result.violations.map(issue => `${issue.id}: ${issue.nodes.map(node => node.target.join(' ')).join(', ')}`);
      });
      assert.deepEqual(violations, [], `${item.path}: axe violations: ${violations.join('; ')}`);
      assertions += 1;

      for (const width of viewports) {
        await page.setViewportSize({ width, height: 1000 });
        await showFlowsPanel(page, width);
        await nav.waitFor({ state: 'visible' });
        const selectorBox = await nav.boundingBox();
        assert.ok(selectorBox && selectorBox.height >= 36 && selectorBox.height <= 40, `${item.path} at ${width}: selector is 36–40px high`);
        for (const link of await nav.locator('a').all()) {
          const target = await link.boundingBox();
          assert.ok(target && target.width >= 24 && target.height >= 24, `${item.path} at ${width}: prototype link meets 24px target size`);
        }
        if (item.review) {
          const toggle = page.locator('#review-root .review-toggle');
          await toggle.waitFor({ state: 'visible' });
          const toggleBox = await toggle.boundingBox();
          assert.ok(toggleBox && !intersects(selectorBox, toggleBox), `${item.path} at ${width}: review toggle does not overlap selector`);
        }
        assertions += item.review ? 3 : 1;
      }
    }

    const layoutRows = [];
    for (const width of layoutViewports) {
      const current = await measureColumns(page, '/', width);
      const concept = await measureColumns(page, '/concept.html', width);
      for (const key of width === 1000 ? ['nav', 'center'] : ['nav', 'center', 'preview']) {
        const delta = {
          x: Number((concept[key].x - current[key].x).toFixed(2)),
          width: Number((concept[key].width - current[key].width).toFixed(2))
        };
        assert.ok(Math.abs(delta.x) <= 1 && Math.abs(delta.width) <= 1,
          `${width}px ${key}: Current ${JSON.stringify(current[key])}, Concept ${JSON.stringify(concept[key])}`);
        layoutRows.push({ width, key, current: current[key], concept: concept[key], delta });
        assertions += 1;
      }

      for (const item of [
        { path: '/', width, proto: 'current' },
        { path: '/concept.html', width, proto: 'concept' }
      ]) {
        await page.goto(`${baseUrl}${item.path}`, { waitUntil: 'load' });
        await showFlowsPanel(page, width);
        const placement = await measureNavPlacement(page);
        assert.ok(placement.visible && placement.inColumn, `${item.path} at ${width}: selector is visible inside its navigation`);
        assert.ok(placement.scrollTop === 0 && placement.selector.y >= placement.column.y - 1
          && placement.selector.bottom <= placement.column.bottom + 1,
        `${item.path} at ${width}: selector is visible without scrolling the navigation`);
        assert.ok(placement.selector.y >= placement.subtitle.bottom - 1,
          `${item.path} at ${width}: selector is below the title and subtitle`);
        assert.ok(placement.selector.bottom <= placement.nextControl.y + 1,
          `${item.path} at ${width}: selector precedes the next navigation control`);
        assert.ok(!placement.overlapsFlow && placement.flowsChecked > 0,
          `${item.path} at ${width}: selector does not cover any flow`);
        if (item.proto === 'concept') {
          assert.ok(Object.values(placement.internalScrolls || {}).length === 3
            && Object.values(placement.internalScrolls).every(scroll => scroll
              && ['auto', 'scroll'].includes(scroll.overflowY)
              && scroll.scrollHeight > scroll.clientHeight),
          `${item.path} at ${width}: the whole navigation, center and phone keep scrolling`);
          assertions += 1;
        }
        assertions += 5;
      }
    }

    const currentNav = await measureNavParity(page, '/');
    const conceptNav = await measureNavParity(page, '/concept.html');
    assert.equal(currentNav.titleText, 'BeValk Lab', 'Current title text');
    assert.equal(conceptNav.titleText, 'BeValk Lab', 'Concept title text');
    assert.equal(currentNav.searchPlaceholder, 'Buscar en todos los flujos', 'Current search placeholder');
    assert.equal(conceptNav.searchPlaceholder, 'Buscar en todos los flujos', 'Concept search placeholder');
    assert.equal(currentNav.labBackground, conceptNav.labBackground, '.lab background');
    assert.deepEqual(conceptNav.cards, currentNav.cards, 'navigation, center and preview card styles');
    for (const key of ['icon', 'title', 'subtitle', 'selector', 'search', 'tabs', 'planLabel', 'toggle', 'planHelp', 'group', 'row']) {
      for (const property of ['x', 'y', 'width', 'height', 'fontSize']) {
        const delta = conceptNav.measurements[key][property] - currentNav.measurements[key][property];
        assert.ok(Math.abs(delta) <= 1,
          `${key}.${property}: Current ${currentNav.measurements[key][property]}, Concept ${conceptNav.measurements[key][property]}`);
        assertions += 1;
      }
    }
    assertions += 6;

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/concept.html`, { waitUntil: 'load' });
    const section = page.locator('.lab-a [role="group"][aria-label="Sección"]');
    const appTab = section.getByRole('button', { name: /^App/ });
    const familyTab = section.getByRole('button', { name: /^Mi Familia/ });
    const groupLabels = () => page.locator('.lab-a .lab-scroll [role="group"]')
      .evaluateAll(groups => groups.map(group => group.getAttribute('aria-label')));
    await appTab.waitFor({ state: 'visible' });
    assert.equal(await appTab.getAttribute('aria-pressed'), 'true', 'Concept starts on App');
    let labels = await groupLabels();
    assert.ok(labels.length > 0 && labels.every(label => !label.startsWith('Mi Familia')),
      `App excludes family flows: ${labels.join(', ')}`);
    await familyTab.click();
    assert.equal(await familyTab.getAttribute('aria-pressed'), 'true', 'Mi Familia tab selects');
    labels = await groupLabels();
    assert.ok(labels.length > 0 && labels.every(label => label.startsWith('Mi Familia')),
      `Mi Familia excludes app flows: ${labels.join(', ')}`);
    const search = page.getByRole('searchbox', { name: 'Buscar flujos' });
    await search.fill('Bienvenida');
    await page.locator('.lab-a .lab-scroll button').filter({ hasText: 'Bienvenida' }).first().waitFor({ state: 'visible' });
    labels = await groupLabels();
    assert.ok(labels.some(label => !label.startsWith('Mi Familia')), 'search finds App flows while Mi Familia is selected');
    await appTab.click();
    await search.fill('Contrato el plan familiar');
    await page.locator('.lab-a .lab-scroll button').filter({ hasText: 'Contrato el plan familiar' }).first().waitFor({ state: 'visible' });
    labels = await groupLabels();
    assert.ok(labels.some(label => label.startsWith('Mi Familia')), 'search finds Mi Familia flows while App is selected');
    assertions += 7;

    const currentCover = await measureCoverTypography(page, '/');
    const conceptCover = await measureCoverTypography(page, '/concept');
    const coverRoleNames = [
      'breadcrumb', 'eyebrow', 'title', 'intro', 'statNumber', 'statLabel', 'howEyebrow',
      'stepNumber', 'stepTitle', 'stepDescription', 'startEyebrow', 'startMeta', 'startTitle',
      'startDescription', 'coverageHeader', 'coverageName', 'coveragePlan', 'coverageNumber'
    ];
    for (const role of coverRoleNames) {
      assertFontParity(`cover.${role}`, currentCover[role], conceptCover[role]);
      assertions += FONT_FIELDS.length;
    }
    assert.equal(conceptCover.statsItems, 4, 'Concept has four statistics');
    assert.equal(conceptCover.statsRows, 1, 'Concept statistics fit on one row at 1440px');
    assertions += 2;

    const currentFlow = await measureFlowTypography(page, '/');
    const conceptFlow = await measureFlowTypography(page, '/concept');
    const flowRoleNames = [
      'breadcrumb', 'resetButton', 'metaCode', 'metaGroup', 'dataLabel', 'dataValue', 'storyTerm',
      'storyText', 'caseSummary', 'caseCode', 'caseChip', 'caseTitle', 'caseDescription', 'caseButton', 'watchBody'
    ];
    for (const role of flowRoleNames) {
      assertFontParity(`flow.${role}`, currentFlow[role], conceptFlow[role]);
      assertions += FONT_FIELDS.length;
    }
    assert.deepEqual(conceptFlow.sectionTitles, currentFlow.sectionTitles, 'all flow section titles match between Current and Concept');
    assertions += conceptFlow.sectionTitles.length * FONT_FIELDS.length;

    const assertConceptFont = (role, actual, expected) => {
      for (const [field, value] of Object.entries(expected)) {
        assert.equal(actual[field], value, `Concept ${role}.${field}: expected ${value}, got ${actual[field]}`);
        assertions += 1;
      }
    };
    assertConceptFont('problem label', conceptFlow.problemLabel, {
      fontSize: '13px', lineHeight: '16px', fontWeight: '500',
      fontFamily: 'Manrope, system-ui, -apple-system, sans-serif'
    });
    assertConceptFont('problem body', conceptFlow.problemBody, {
      fontSize: '14px', lineHeight: '20px', fontWeight: '400',
      fontFamily: 'Manrope, system-ui, -apple-system, sans-serif'
    });
    assertConceptFont('acceptance summary', conceptFlow.acceptanceTitle, {
      fontSize: '15px', lineHeight: '22px', fontWeight: '600',
      fontFamily: 'Manrope, system-ui, -apple-system, sans-serif'
    });
    assertConceptFont('environment summary', conceptFlow.environmentTitle, {
      fontSize: '15px', lineHeight: '22px', fontWeight: '600',
      fontFamily: 'Manrope, system-ui, -apple-system, sans-serif'
    });
    assertConceptFont('GIVEN label', conceptFlow.gwtLabel, {
      fontSize: '12px', lineHeight: '16px', fontWeight: '600',
      fontFamily: '"Geist Mono", ui-monospace, monospace'
    });
    assert.ok(conceptFlow.gwtBodies.length > 0, 'Concept renders GIVEN/WHEN/THEN body roles');
    for (const [index, body] of conceptFlow.gwtBodies.entries()) {
      assertConceptFont(`GWT body ${index + 1}`, body, {
        fontSize: '14px', lineHeight: '20px', fontWeight: '400',
        fontFamily: 'Manrope, system-ui, -apple-system, sans-serif'
      });
    }
    assertConceptFont('environment label', conceptFlow.environmentLabel, {
      fontSize: '13px', lineHeight: '16px', fontWeight: '500',
      fontFamily: 'Manrope, system-ui, -apple-system, sans-serif'
    });
    assertConceptFont('environment radio chip', conceptFlow.environmentRadio, {
      fontSize: '12px', lineHeight: '16px', fontWeight: '500',
      fontFamily: 'Manrope, system-ui, -apple-system, sans-serif'
    });

    for (const [label, sizes] of [['cover', conceptCover.fontSizes], ['flow', conceptFlow.fontSizes]]) {
      const outsideScale = [...new Set(sizes)].filter(size => !CONCEPT_CENTER_SCALE.has(size));
      assert.deepEqual(outsideScale, [], `Concept ${label} uses only the Current center type scale`);
      assertions += 1;
    }

    await page.goto(`${baseUrl}/concept`, { waitUntil: 'load' });
    const freePin = page.locator('.lab-a .lab-scroll button').filter({ hasText: 'Free' }).first()
      .locator('span').filter({ hasText: 'Free' }).first();
    const freePinStyle = await freePin.evaluate(element => {
      const style = getComputedStyle(element);
      return { fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight, fontFamily: style.fontFamily };
    });
    assert.deepEqual(freePinStyle, {
      fontSize: '11px', lineHeight: '16px', fontWeight: '700', fontFamily: '"Geist Mono", ui-monospace, monospace'
    }, 'Concept Free navigation chip uses the Current 11/16/700 Geist Mono role');
    assertions += 4;

    const transitionRows = [];
    for (const item of [
      { from: '/', to: '/concept', name: 'current-to-concept' },
      { from: '/concept', to: '/', name: 'concept-to-current' },
      { from: '/review', to: '/concept/review', name: 'review-to-concept-review' },
      { from: '/concept/review', to: '/review', name: 'concept-review-to-review' }
    ]) {
      const row = await capturePrototypeTransition(browser, item.from, item.to, item.name);
      assert.ok(row.reveal, `${item.name}: pagereveal fired in the new document`);
      assert.equal(row.reveal.hasViewTransition, true, `${item.name}: pagereveal has a ViewTransition`);
      assert.equal(row.reveal.rootContent, true, `${item.name}: #root has content during pagereveal`);
      assert.ok(row.frames.length > 0, `${item.name}: CDP captured frames during the 1.5s gate`);
      assert.ok(row.maxLuminance <= 0.97, `${item.name}: brightest frame mean luminance ${row.maxLuminance} is at most 0.97`);
      transitionRows.push(row);
      assertions += 6;
    }

    console.log(`PROTO SWITCH PASS · ${pages.length} páginas · ${viewports.length} anchos · ${assertions} comprobaciones · 0 violaciones axe`);
    console.log('PROTO SWITCH LAYOUT · x / width (px), diferencias Concept − Current; tolerancia ±1 px');
    console.log('| Viewport | Columna | Current x / width | Concept x / width | Δx / Δwidth |');
    console.log('|---:|---|---:|---:|---:|');
    for (const row of layoutRows) {
      console.log(`| ${row.width}×900 | ${row.key} | ${row.current.x} / ${row.current.width} | ${row.concept.x} / ${row.concept.width} | ${row.delta.x} / ${row.delta.width} |`);
    }
    console.log('PROTO SWITCH NAV · Current/Concept (x / y / width / height / font-size px)');
    console.log('| Elemento | Current | Concept |');
    console.log('|---|---:|---:|');
    for (const key of ['icon', 'title', 'subtitle', 'selector', 'search', 'tabs', 'planLabel', 'toggle', 'planHelp', 'group', 'row']) {
      const format = value => `${value.x} / ${value.y} / ${value.width} / ${value.height} / ${value.fontSize}`;
      console.log(`| ${key} | ${format(currentNav.measurements[key])} | ${format(conceptNav.measurements[key])} |`);
    }
    console.log(`PROTO SWITCH NAV BACKGROUND · ${currentNav.labBackground} / ${conceptNav.labBackground}`);
    console.log('PROTO SWITCH TYPOGRAPHY · Current/Concept · 1440×900 · font-size / line-height · weight · family');
    console.log('| Rol | Current | Concept |');
    console.log('|---|---|---|');
    const formatFont = value => `${value.fontSize}/${value.lineHeight} · ${value.fontWeight} · ${value.fontFamily.includes('Geist Mono') ? 'Geist Mono' : value.fontFamily.includes('Guton') ? 'Guton' : 'Manrope'}`;
    const typographyRows = [
      ...[
        ['Migas', 'breadcrumb'], ['Antetítulo', 'eyebrow'], ['H1', 'title'], ['Entradilla', 'intro'],
        ['Número de estadística', 'statNumber'], ['Etiqueta de estadística', 'statLabel'],
        ['Antetítulo «Cómo se usa»', 'howEyebrow'], ['Número de paso', 'stepNumber'],
        ['Título de paso', 'stepTitle'], ['Descripción de paso', 'stepDescription'],
        ['Antetítulo «Empieza por aquí»', 'startEyebrow'], ['Meta de tarjeta', 'startMeta'],
        ['Título de tarjeta', 'startTitle'], ['Descripción de tarjeta', 'startDescription'],
        ['Cabecera de tabla', 'coverageHeader'], ['Nombre de fila', 'coverageName'],
        ['Plan de fila', 'coveragePlan'], ['Número de fila', 'coverageNumber']
      ].map(([label, role]) => [label, currentCover[role], conceptCover[role]]),
      ...[
        ['Migas de ficha', 'breadcrumb'], ['Reiniciar', 'resetButton'], ['Código de flujo', 'metaCode'],
        ['Grupo', 'metaGroup'], ['Etiqueta de dato', 'dataLabel'], ['Valor de dato', 'dataValue'],
        ['Término de user story', 'storyTerm'], ['Texto de user story', 'storyText'],
        ['Resumen de casos', 'caseSummary'], ['Código de caso', 'caseCode'], ['Chip de caso', 'caseChip'],
        ['Título de caso', 'caseTitle'], ['Descripción de caso', 'caseDescription'],
        ['Botón de caso', 'caseButton'], ['Cuerpo «Qué mirar»', 'watchBody']
      ].map(([label, role]) => [label, currentFlow[role], conceptFlow[role]])
    ];
    for (const [label, current, concept] of typographyRows) {
      console.log(`| ${label} | ${formatFont(current)} | ${formatFont(concept)} |`);
    }
    console.log(`PROTO SWITCH CONCEPT SCALE · cover ${[...new Set(conceptCover.fontSizes)].join(', ')} · flow ${[...new Set(conceptFlow.fontSizes)].join(', ')}`);
    console.log('PROTO SWITCH FRAMES · CDP Page.startScreencast · 1440×900 · 0–1500ms after click');
    console.log('| Cambio | Fotogramas | Luminancia máxima | Evidencia PNG |');
    console.log('|---|---:|---:|---|');
    for (const row of transitionRows) {
      console.log(`| ${row.from} → ${row.to} | ${row.frames.length} | ${row.maxLuminance.toFixed(5)} | ${row.framePath} |`);
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

// Control negativo: cambiar cualquiera de los href esperados hace fallar las aserciones estrictas anteriores.
