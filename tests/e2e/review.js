const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const baseUrl = (process.env.LAB_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const teamHtml = path.resolve(process.env.LAB_DIST_DIR || path.resolve(__dirname, '../../dist'), 'team.html');
const savedComments = [];
const createdId = '2c6849e1-7a08-4b81-8b6c-4f50f8b2a729';
let role = 'team';
let postPayload = null;
const consoleErrors = [];

function commentFixture(overrides = {}) {
  return {
    id: createdId,
    created_at: '2026-10-27T12:00:00.000Z',
    updated_at: '2026-10-27T12:00:00.000Z',
    author: 'Ana',
    body: 'Revisar este punto',
    screen: 'Inicio',
    tpl: '421',
    x: 0.5,
    y: 0.25,
    flow: 'nuevo',
    plan: 'premium',
    status: 'todo',
    ...overrides
  };
}

async function assertAxe(page, selector, label) {
  const result = await page.evaluate(async target => {
    const element = document.querySelector(target);
    if (!element) throw new Error(`Missing axe target: ${target}`);
    const audit = await window.axe.run(element, { resultTypes: ['violations'] });
    return audit.violations.map(issue => `${issue.id}: ${issue.help}`);
  }, selector);
  assert.deepEqual(result, [], `axe violations in ${label}: ${result.join('; ')}`);
}

(async () => {
  assert.ok(fs.existsSync(teamHtml), `Build team.html first: ${teamHtml}`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') consoleErrors.push(`${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', error => consoleErrors.push(`pageerror: ${error.message}`));

  await page.route('**/api/comments*', async route => {
    const request = route.request();
    if (request.method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ role, items: savedComments }) });
      return;
    }
    if (request.method() === 'POST') {
      postPayload = request.postDataJSON();
      const item = commentFixture({ ...postPayload, author: String(postPayload.author).trim(), body: String(postPayload.body).trim() });
      savedComments.unshift(item);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(item) });
      return;
    }
    if (request.method() === 'PATCH') {
      const patch = request.postDataJSON();
      const index = savedComments.findIndex(item => item.id === patch.id);
      if (index < 0) {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not_found' }) });
      } else {
        savedComments[index] = { ...savedComments[index], status: patch.status };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(savedComments[index]) });
      }
      return;
    }
    await route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ error: 'method_not_allowed' }) });
  });

  await page.route('**/comments', async route => {
    if (route.request().resourceType() === 'document') {
      await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', path: teamHtml });
      return;
    }
    await route.fallback();
  });

  try {
    await page.goto(`${baseUrl}/review.html`, { waitUntil: 'load' });
    await page.locator('.tp-phone').waitFor({ state: 'visible' });
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    await assertAxe(page, '.review-toggle', 'comment button');

    const screen = page.locator('.tp-phone [data-screen-label]').filter({ visible: true }).first();
    await screen.waitFor({ state: 'visible' });
    const screenLabel = await screen.getAttribute('data-screen-label');
    assert.ok(screenLabel, 'visible phone screen must have a data-screen-label');

    await page.getByRole('button', { name: 'Comentar', exact: true }).click();
    await page.getByRole('button', { name: 'Cancelar', exact: true }).waitFor({ state: 'visible' });
    const target = page.getByTestId('review-target');
    await target.waitFor({ state: 'visible' });
    const targetBox = await target.boundingBox();
    assert.ok(targetBox && targetBox.width > 0 && targetBox.height > 0, 'screen target overlay should be visible');
    await target.click({ position: { x: targetBox.width * 0.42, y: targetBox.height * 0.36 } });

    const dialog = page.getByRole('dialog', { name: 'Nuevo comentario' });
    await dialog.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.getAttribute('name') === 'author');
    await assertAxe(page, '[role="dialog"]', 'comment modal');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    await page.waitForFunction(() => document.activeElement?.textContent?.includes('Cancelar'));
    await target.click({ position: { x: targetBox.width * 0.42, y: targetBox.height * 0.36 } });
    await page.getByRole('dialog', { name: 'Nuevo comentario' }).waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.getAttribute('name') === 'author');
    await dialog.getByRole('textbox', { name: 'Tu nombre', exact: true }).fill('Ana');
    await dialog.getByRole('textbox', { name: 'Comentario', exact: true }).fill('Revisar este punto');
    await dialog.getByRole('button', { name: 'Enviar', exact: true }).click();
    await page.getByTestId('review-pin').waitFor({ state: 'visible' });
    assert.ok(postPayload, 'POST /api/comments must be called');
    assert.ok(postPayload.x >= 0 && postPayload.x <= 1, 'comment x must be within [0, 1]');
    assert.ok(postPayload.y >= 0 && postPayload.y <= 1, 'comment y must be within [0, 1]');
    assert.equal(postPayload.screen, screenLabel, 'POST should use the visible data-screen-label');
    await assertAxe(page, '.review-pins', 'comment pins');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Comentar', exact: true }).waitFor({ state: 'visible' });

    role = 'owner';
    await page.goto(`${baseUrl}/comments`, { waitUntil: 'load' });
    await page.getByRole('heading', { name: 'Comentarios' }).waitFor({ state: 'visible' });
    await page.getByText('Revisar este punto', { exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('combobox', { name: 'Estado de Ana' }).waitFor({ state: 'visible' });

    role = 'team';
    await page.reload({ waitUntil: 'load' });
    await page.getByRole('heading', { name: 'Comentarios' }).waitFor({ state: 'visible' });
    await page.getByText('Revisar este punto', { exact: true }).waitFor({ state: 'visible' });
    assert.equal(await page.getByRole('combobox', { name: 'Estado de Ana' }).count(), 0, 'team role must not see the owner status selector');

    assert.deepEqual(consoleErrors, [], `browser console should be clear: ${consoleErrors.join('\n')}`);
    console.log('Review/comments e2e passed.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
