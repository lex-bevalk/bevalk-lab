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
    const nextControl = column.matches('.lab-a')
      ? [...column.querySelectorAll('span')].find(element => element.textContent.trim() === 'Modalidad simulada')
      : column.querySelector('input[type="search"]');
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
    const internalScrolls = column.matches('.lab-a') ? Object.fromEntries([
      ['navigation', column.querySelector('.lab-scroll')],
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
    })) : null;
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
          `${item.path} at ${width}: navigation, center and phone keep internal scrolling`);
          assertions += 1;
        }
        assertions += 5;
      }
    }

    console.log(`PROTO SWITCH PASS · ${pages.length} páginas · ${viewports.length} anchos · ${assertions} comprobaciones · 0 violaciones axe`);
    console.log('PROTO SWITCH LAYOUT · x / width (px), diferencias Concept − Current; tolerancia ±1 px');
    console.log('| Viewport | Columna | Current x / width | Concept x / width | Δx / Δwidth |');
    console.log('|---:|---|---:|---:|---:|');
    for (const row of layoutRows) {
      console.log(`| ${row.width}×900 | ${row.key} | ${row.current.x} / ${row.current.width} | ${row.concept.x} / ${row.concept.width} | ${row.delta.x} / ${row.delta.width} |`);
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

// Control negativo: cambiar cualquiera de los href esperados hace fallar las aserciones estrictas anteriores.
