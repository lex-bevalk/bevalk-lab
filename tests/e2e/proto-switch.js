const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

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
      const current = nav.getByRole('link', { name: 'Current version', exact: true });
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
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

// Control negativo: cambiar cualquiera de los href esperados hace fallar las aserciones estrictas anteriores.
