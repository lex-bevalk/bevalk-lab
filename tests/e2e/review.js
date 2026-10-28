const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const baseUrl = (process.env.LAB_URL || 'http://localhost:4173/concept.html')
  .replace(/\/concept\.html\/?$/, '')
  .replace(/\/$/, '');
const teamHtml = path.resolve(process.env.LAB_DIST_DIR || path.resolve(__dirname, '../../dist'), 'team.html');
const savedComments = [];
const createdId = '2c6849e1-7a08-4b81-8b6c-4f50f8b2a729';
const luisId = 'abfc0c63-47d4-4f82-9f69-df0202a44cf6';
const siblingId = '67b742e1-1ed1-4d45-b71d-5673bf78f019';
const deleteToken = 'd'.repeat(64);
let role = 'team';
let postPayload = null;
let replySequence = 0;
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
    replies: [],
    ...overrides
  };
}

async function assertAxe(page, selector, label) {
  await page.waitForFunction(target => {
    const element = document.querySelector(target);
    return Boolean(element) && Number(window.getComputedStyle(element).opacity) >= 0.99;
  }, selector);
  const result = await page.evaluate(async target => {
    const element = document.querySelector(target);
    if (!element) throw new Error(`Missing axe target: ${target}`);
    const audit = await window.axe.run(element, { resultTypes: ['violations'] });
    return audit.violations.flatMap(issue => issue.nodes.map(node => `${issue.id}: ${node.target.join(', ')} — ${node.failureSummary}`));
  }, selector);
  assert.deepEqual(result, [], `axe violations in ${label}: ${result.join('; ')}`);
}

(async () => {
  assert.ok(fs.existsSync(teamHtml), `Build team.html first: ${teamHtml}`);
  const launchOptions = { headless: true };
  if (process.env.LAB_CHROMIUM_EXECUTABLE) launchOptions.executablePath = process.env.LAB_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch(launchOptions);
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
      if (postPayload.comment_id) {
        const parent = savedComments.find(item => item.id === postPayload.comment_id);
        if (!parent) {
          await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not_found' }) });
          return;
        }
        const reply = {
          id: replySequence++ === 0 ? 'af9f8ad0-15ec-4ed3-a748-c50c9a1d7854' : '5cb78767-e037-49f0-9bdb-59692fa1705b',
          comment_id: postPayload.comment_id,
          created_at: '2026-10-27T12:05:00.000Z',
          author: String(postPayload.author).trim(),
          body: String(postPayload.body).trim()
        };
        parent.replies = [...(parent.replies || []), reply];
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(reply) });
        return;
      }
      const item = commentFixture({ ...postPayload, author: String(postPayload.author).trim(), body: String(postPayload.body).trim() });
      savedComments.unshift(item);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ...item, delete_token: deleteToken }) });
      return;
    }
    if (request.method() === 'DELETE') {
      const { id, token } = request.postDataJSON();
      const index = savedComments.findIndex(item => item.id === id);
      if (index < 0) {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not_found' }) });
      } else if (role === 'team' && (id !== createdId || token !== deleteToken)) {
        await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'forbidden' }) });
      } else {
        savedComments.splice(index, 1);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id }) });
      }
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
    await page.goto(`${baseUrl}/concept-review.html`, { waitUntil: 'load' });
    await page.locator('.tp-phone').waitFor({ state: 'visible' });
    const stage = page.locator('#root .lab-c > :has(.tp-phone)');
    assert.equal(await stage.count(), 1, 'the review spacing selector should match the stage');
    assert.equal(await stage.evaluate(element => element.contains(document.querySelector('.tp-phone'))), true);
    const stageStyle = await stage.evaluate(element => getComputedStyle(element).marginBottom);
    assert.equal(stageStyle, '64px', 'review CSS should reserve space on the observed stage');
    const phoneBox = await page.locator('.tp-phone').boundingBox();
    const toggle = page.getByRole('button', { name: 'Comentar', exact: true });
    const toggleBox = await toggle.boundingBox();
    const flowsBox = await page.locator('aside[aria-label="Flujos del prototipo"]').boundingBox();
    assert.ok(phoneBox && toggleBox && flowsBox, 'phone, toggle, and flows panel should have geometry');
    assert.ok(toggleBox.y >= phoneBox.y + phoneBox.height, 'comment toggle should sit below the phone');
    assert.ok(toggleBox.x < phoneBox.x + phoneBox.width && toggleBox.x + toggleBox.width > phoneBox.x, 'comment toggle should overlap the phone horizontally');
    assert.ok(toggleBox.x + toggleBox.width <= flowsBox.x || toggleBox.x >= flowsBox.x + flowsBox.width
      || toggleBox.y + toggleBox.height <= flowsBox.y || toggleBox.y >= flowsBox.y + flowsBox.height,
    'comment toggle should not intersect the flows panel');
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

    const dialog = page.getByRole('dialog', { name: 'Nuevo comentario', exact: true });
    await dialog.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.getAttribute('name') === 'author');
    await assertAxe(page, '[role="dialog"]', 'comment modal');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    await page.waitForFunction(() => document.activeElement?.textContent?.includes('Cancelar'));
    await target.click({ position: { x: targetBox.width * 0.42, y: targetBox.height * 0.36 } });
    await page.getByRole('dialog', { name: 'Nuevo comentario', exact: true }).waitFor({ state: 'visible' });
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

    savedComments.push(commentFixture({ id: siblingId, author: 'Bea', body: 'Comentario de Bea', screen: screenLabel, x: 0.05, y: 0.25 }));
    await page.reload({ waitUntil: 'load' });
    const draftPins = page.getByTestId('review-pin');
    await draftPins.nth(1).waitFor({ state: 'visible' });
    assert.equal(await draftPins.count(), 2, 'the draft reset check needs two pins on the same screen');
    await page.getByRole('button', { name: `Comentario 1 en ${screenLabel}: Ana`, exact: true }).click();
    const draftPopover = page.getByRole('complementary', { name: 'Comentario de Ana', exact: true });
    const draftForm = draftPopover.locator('.replies__form');
    await draftForm.locator('summary').click();
    const replyDraft = 'Borrador para Ana';
    await draftForm.getByRole('textbox', { name: 'Respuesta', exact: true }).fill(replyDraft);
    await page.getByRole('button', { name: `Comentario 2 en ${screenLabel}: Bea`, exact: true }).click();
    const siblingPopover = page.getByRole('complementary', { name: 'Comentario de Bea', exact: true });
    assert.equal(await siblingPopover.locator('textarea').evaluateAll(textareas => textareas.some(textarea => textarea.value.includes('Borrador para Ana'))), false,
      'the previous comment draft must not appear in any textarea after switching pins');
    savedComments.splice(savedComments.findIndex(item => item.id === siblingId), 1);
    await page.reload({ waitUntil: 'load' });
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });

    const teamPin = page.getByTestId('review-pin');
    await teamPin.click();
    const teamPopover = page.getByRole('complementary', { name: 'Comentario de Ana', exact: true });
    await teamPopover.waitFor({ state: 'visible' });
    assert.equal(await teamPopover.getByRole('combobox', { name: 'Estado de Ana', exact: true }).count(), 0);
    assert.equal(await teamPopover.getByRole('button', { name: 'Eliminar', exact: true }).count(), 1);
    const replyForm = teamPopover.locator('.replies__form');
    await replyForm.locator('summary').click();
    assert.ok(await page.evaluate(() => localStorage.getItem('bevalk-comment-author')?.trim()), 'the reply author should already be stored');
    await page.waitForFunction(() => document.activeElement === document.querySelector('.review-popover textarea[name="body"]'));
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.review-popover textarea[name="body"]')), true,
      'opening the reply form with a stored name should focus the Respuesta textarea');
    await replyForm.getByRole('textbox', { name: 'Tu nombre', exact: true }).fill('Luis');
    await replyForm.getByRole('textbox', { name: 'Respuesta', exact: true }).fill('Respuesta del equipo');
    await replyForm.locator('form').getByRole('button', { name: 'Responder', exact: true }).click();
    await teamPopover.getByText('Respuesta del equipo', { exact: true }).waitFor({ state: 'visible' });
    assert.equal(postPayload.comment_id, createdId);
    await assertAxe(page, '.review-popover', 'team comment popover with reply');
    await page.keyboard.press('Escape');
    await teamPopover.waitFor({ state: 'detached' });

    savedComments[0].y = 0.95;
    const mobileReplies = savedComments[0].replies;
    savedComments[0].replies = Array.from({ length: 10 }, (_, index) => ({
      id: `mobile-layer-reply-${index}`,
      comment_id: createdId,
      created_at: '2026-10-27T12:05:00.000Z',
      author: 'Luis',
      body: 'Respuesta temporal para probar la superposición del popover.'
    }));
    await page.reload({ waitUntil: 'load' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: 'Móvil', exact: true }).click();
    const narrowPin = page.getByTestId('review-pin');
    await narrowPin.waitFor({ state: 'visible' });
    await narrowPin.click();
    const narrowPopover = page.getByRole('complementary', { name: 'Comentario de Ana', exact: true });
    const narrowBox = await narrowPopover.boundingBox();
    assert.ok(narrowBox, 'mobile popover should have geometry');
    const oldPositionControl = await narrowPopover.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const pin = document.querySelector('.review-pin');
      if (!pin) return false;
      const pinRect = pin.getBoundingClientRect();
      const oldTop = Math.max(12, Math.min(pinRect.top + pinRect.height / 2 + 18, window.innerHeight - 240));
      return oldTop + rect.height > window.innerHeight;
    });
    assert.equal(oldPositionControl, true, 'control negative: the previous 240px bottom reserve would let this popover overflow');
    assert.ok(narrowBox.x >= 0 && narrowBox.y >= 0 && narrowBox.x + narrowBox.width <= 375 && narrowBox.y + narrowBox.height <= 812,
      'popover should fit inside a 375x812 viewport');
    const toggleHitTest = await page.evaluate(() => {
      const toggle = document.querySelector('.review-toggle');
      const popover = document.querySelector('.review-popover');
      if (!toggle || !popover) return { centerIntersects: false, hitIsPopover: false };
      const toggleRect = toggle.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const x = toggleRect.left + toggleRect.width / 2;
      const y = toggleRect.top + toggleRect.height / 2;
      const centerIntersects = x >= popoverRect.left && x <= popoverRect.right
        && y >= popoverRect.top && y <= popoverRect.bottom;
      const hit = document.elementFromPoint(x, y);
      return { centerIntersects, hitIsPopover: Boolean(hit && popover.contains(hit)) };
    });
    assert.equal(toggleHitTest.centerIntersects, true, 'the toggle center should intersect the mobile popover');
    assert.equal(toggleHitTest.hitIsPopover, true, 'elementFromPoint at the toggle center should return an element inside the popover');
    savedComments[0].replies = mobileReplies;
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.keyboard.press('Escape');
    await narrowPopover.waitFor({ state: 'detached' });

    savedComments.push(commentFixture({ id: luisId, author: 'Luis', body: 'Comentario de Luis' }));
    role = 'owner';
    await page.goto(`${baseUrl}/concept-review.html?c=${createdId}`, { waitUntil: 'load' });
    await page.getByTestId('review-pin').first().waitFor({ state: 'visible' });
    const ownerReviewPin = page.getByRole('button', { name: `Comentario 1 en ${screenLabel}: Ana`, exact: true });
    await ownerReviewPin.click();
    const ownerPopover = page.getByRole('complementary', { name: 'Comentario de Ana', exact: true });
    await ownerPopover.getByRole('combobox', { name: 'Estado de Ana', exact: true }).selectOption('done');
    await page.locator('.review-pin--done').waitFor({ state: 'visible' });

    await page.goto(`${baseUrl}/comments`, { waitUntil: 'load' });
    await page.getByRole('heading', { name: 'Comentarios', exact: true }).waitFor({ state: 'visible' });
    await page.getByText('Revisar este punto', { exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('combobox', { name: 'Estado de Ana', exact: true }).waitFor({ state: 'visible' });
    await page.reload({ waitUntil: 'load' });
    const ownerAnaCard = page.locator(`[data-comment-id="${createdId}"]`);
    const ownerLuisCard = page.locator(`[data-comment-id="${luisId}"]`);
    await ownerLuisCard.waitFor({ state: 'visible' });
    assert.equal(await ownerAnaCard.getByRole('button', { name: 'Eliminar', exact: true }).count(), 1);
    assert.equal(await ownerLuisCard.getByRole('button', { name: 'Eliminar', exact: true }).count(), 1);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const luisReplyForm = ownerLuisCard.locator('.replies__form');
    await luisReplyForm.locator('summary').click();
    await luisReplyForm.getByRole('textbox', { name: 'Tu nombre', exact: true }).fill('Ana');
    await luisReplyForm.getByRole('textbox', { name: 'Respuesta', exact: true }).fill('Respuesta de owner en la tarjeta');
    await luisReplyForm.locator('form').getByRole('button', { name: 'Responder', exact: true }).click();
    await ownerLuisCard.getByText('Respuesta de owner en la tarjeta', { exact: true }).waitFor({ state: 'visible' });
    assert.equal(postPayload.comment_id, luisId);
    await assertAxe(page, `[data-comment-id="${luisId}"]`, 'owner comment card with reply');

    role = 'team';
    await page.reload({ waitUntil: 'load' });
    await page.getByRole('heading', { name: 'Comentarios', exact: true }).waitFor({ state: 'visible' });
    await page.getByText('Revisar este punto', { exact: true }).waitFor({ state: 'visible' });
    assert.equal(await page.getByRole('combobox', { name: 'Estado de Ana', exact: true }).count(), 0, 'team role must not see the owner status selector');
    const teamAnaCard = page.locator(`[data-comment-id="${createdId}"]`);
    const teamLuisCard = page.locator(`[data-comment-id="${luisId}"]`);
    assert.equal(await teamAnaCard.getByRole('button', { name: 'Eliminar', exact: true }).count(), 1);
    assert.equal(await teamLuisCard.getByRole('button', { name: 'Eliminar', exact: true }).count(), 0);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    await teamAnaCard.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await teamAnaCard.getByText('¿Eliminar este comentario?', { exact: true }).waitFor({ state: 'visible' });
    await assertAxe(page, `[data-comment-id="${createdId}"]`, 'comment delete confirmation');
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'No');
    await teamAnaCard.getByRole('button', { name: 'Sí, eliminar', exact: true }).click();
    await teamAnaCard.waitFor({ state: 'detached' });
    await page.getByText('Comentario eliminado', { exact: true }).waitFor({ state: 'visible' });
    assert.equal(await page.locator('.comments-notice[role="status"]').textContent(), 'Comentario eliminado');
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'Comentario eliminado');

    role = 'owner';
    await page.goto(`${baseUrl}/concept-review.html`, { waitUntil: 'load' });
    const luisPin = page.getByRole('button', { name: `Comentario 1 en ${screenLabel}: Luis`, exact: true });
    await luisPin.waitFor({ state: 'visible' });
    await luisPin.click();
    const deletePopover = page.getByRole('complementary', { name: 'Comentario de Luis', exact: true });
    await deletePopover.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await deletePopover.getByText('¿Eliminar este comentario?', { exact: true }).waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'No');
    await deletePopover.getByRole('button', { name: 'Sí, eliminar', exact: true }).click();
    await deletePopover.waitFor({ state: 'detached' });
    assert.equal(await page.locator('.review-pin').count(), 0, 'the deleted comment pin should disappear');
    await page.getByRole('status').filter({ hasText: 'Comentario eliminado' }).waitFor({ state: 'attached' });
    await page.waitForFunction(() => document.activeElement?.textContent?.includes('Comentar'));

    assert.deepEqual(consoleErrors, [], `browser console should be clear: ${consoleErrors.join('\n')}`);
    console.log('Review/comments e2e passed.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
