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
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

function intersects(first, second) {
  return first.left < second.right && first.right > second.left
    && first.top < second.bottom && first.bottom > second.top;
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
      const nav = page.locator('#proto-root nav[aria-label="Prototipo"]');
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
      assertions += 5;

      await page.addScriptTag({ content: axeSource });
      const violations = await page.evaluate(async () => {
        const root = document.querySelector('#proto-root');
        if (!root) throw new Error('Missing #proto-root');
        const result = await axe.run(root, { resultTypes: ['violations'] });
        return result.violations.map(issue => `${issue.id}: ${issue.nodes.map(node => node.target.join(' ')).join(', ')}`);
      });
      assert.deepEqual(violations, [], `${item.path}: axe violations: ${violations.join('; ')}`);
      assertions += 1;

      for (const width of viewports) {
        await page.setViewportSize({ width, height: 1000 });
        const selectorBox = await nav.boundingBox();
        assert.ok(selectorBox && selectorBox.height === 40, `${item.path} at ${width}: selector is 40px high`);
        for (const link of await nav.locator('a').all()) {
          const target = await link.boundingBox();
          assert.ok(target && target.width >= 32 && target.height >= 32, `${item.path} at ${width}: prototype link meets 32px target size`);
        }
        if (item.review) {
          const toggle = page.locator('#review-root .review-toggle');
          await toggle.waitFor({ state: 'visible' });
          const toggleBox = await toggle.boundingBox();
          assert.ok(toggleBox && !intersects(selectorBox, toggleBox), `${item.path} at ${width}: review toggle overlaps selector`);
        }
        assertions += item.review ? 2 : 1;
      }
    }
    console.log(`PROTO SWITCH PASS · ${pages.length} páginas · ${viewports.length} anchos · ${assertions} comprobaciones · 0 violaciones axe`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

// Control negativo: cambiar cualquiera de los href esperados hace fallar las aserciones estrictas anteriores.
