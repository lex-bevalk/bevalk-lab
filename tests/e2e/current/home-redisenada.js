const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const appUrl = process.env.LAB_URL || 'http://localhost:4173/';
const browserOptions = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {};
const expectedTools = [
  'Analizador de enlaces',
  'Mi huella',
  'Chat con MarIA',
  'Escáner de QRs',
  'Alertas',
  'Mi Familia',
  '¿Cómo se usa BeValk?',
  'Soporte técnico'
];

const normalize = value => value.replace(/\s+/g, ' ').trim();

async function selectFlow(page) {
  await page.locator('nav.lab-col').getByRole('button', { name: /^Próximamente/ }).first().click();
  const flow = page.locator('nav.lab-col button.lab-item').filter({ hasText: 'A39' });
  assert.equal(await flow.count(), 1, 'A39 debe aparecer dentro de Próximamente › Novedades');
  await flow.click();
  await page.waitForFunction(() => window.__lab?.state.lab.cur === 'A39' && window.__lab?.state.screen === 'home2');

  const dialog = page.locator('[data-lab-modal]');
  assert.equal(await dialog.isVisible(), true, 'A39 conserva la presentación de Próximamente');
  await dialog.getByRole('button', { name: 'No', exact: true }).click();
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();

  // A39 es una novedad futura. La prueba retira el bloqueo visual/pointer-events
  // del preview para ejercitar sus controles sin cambiar el comportamiento de Current.
  const preview = page.locator('.lab-pv > div[aria-hidden="true"]');
  assert.equal(await preview.count(), 1, 'El preview mantiene el bloqueo de Próximamente');
  await preview.evaluate(element => {
    element.setAttribute('aria-hidden', 'false');
    element.style.filter = 'none';
    element.style.pointerEvents = 'auto';
  });
}

async function assertHome2(page, title) {
  const home = page.locator('.tp-phone [data-screen-label="Inicio rediseñado"]');
  assert.equal(await home.isVisible(), true, 'Se muestra Inicio rediseñado');
  assert.equal(normalize(await home.locator('h1').innerText()), title);
  assert.equal(await home.getByText('Qué hacer ahora', { exact: true }).count(), 1);
  assert.equal(await home.getByText('Cambia la contraseña de LinkedIn', { exact: true }).count(), 1);
  assert.equal(await home.getByText('LinkedIn · contraseña filtrada · 2 min', { exact: true }).count(), 1);

  const buttons = home.locator('section[aria-labelledby="home2-tools-title"] > div > button');
  assert.equal(await buttons.count(), 8, 'La rejilla muestra ocho herramientas');
  const labels = await buttons.evaluateAll(items => items.map(button => {
    const label = [...button.children].find(child => child.tagName === 'SPAN' && child.getAttribute('aria-hidden') !== 'true');
    return (label?.textContent || '').trim();
  }));
  assert.deepEqual(labels, expectedTools, 'Las herramientas mantienen el orden especificado');
  assert.equal(await home.locator('span').filter({ hasText: /^NUEVO$/ }).count(), 1, 'Solo hay un chip NUEVO');
  assert.equal(await buttons.nth(1).getByText('NUEVO', { exact: true }).count(), 0, 'Mi huella no lleva chip NUEVO');
  assert.equal(await buttons.nth(5).getByText('NUEVO', { exact: true }).count(), 1, 'Mi Familia lleva el chip NUEVO');
  return { home, buttons };
}

(async () => {
  const browser = await chromium.launch({ ...browserOptions, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    await page.goto(appUrl, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => !!window.__lab?.labOpen && !!document.querySelector('.tp-phone'), null, { timeout: 30000 });
    await selectFlow(page);

    const { home, buttons } = await assertHome2(page, 'BeValk');
    await fs.mkdir(path.resolve('.tmp'), { recursive: true });
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelectorAll('.lab-col').forEach(element => { element.scrollTop = 0; });
    });
    await page.screenshot({ path: path.resolve('.tmp/home2-freemium-1440x900.png') });

    await home.getByRole('button', { name: 'Ver todo', exact: true }).click();
    await page.waitForFunction(() => window.__lab.state.screen === 'huella');
    await page.locator('.tp-phone nav button').filter({ hasText: 'Inicio' }).click();
    await page.waitForFunction(() => window.__lab.state.screen === 'home2');

    await page.locator('.tp-phone [data-screen-label="Inicio rediseñado"]')
      .getByRole('button', { name: 'Analizador de enlaces', exact: true }).click();
    await page.waitForFunction(() => window.__lab.state.screen === 'analizador');
    await page.locator('.tp-phone nav button').filter({ hasText: 'Inicio' }).click();
    await page.waitForFunction(() => window.__lab.state.screen === 'home2');

    await page.evaluate(() => window.__lab.labPlan('premium'));
    await page.waitForFunction(() => window.__lab.world().plan === 'premium');
    await page.waitForFunction(() => !window.__lab.state.toast);
    const premium = await assertHome2(page, 'BeValk Premium');
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelectorAll('.lab-col').forEach(element => { element.scrollTop = 0; });
    });
    await page.screenshot({ path: path.resolve('.tmp/home2-premium-1440x900.png') });

    await premium.home.getByRole('button', { name: /Cambia la contraseña de LinkedIn/ }).click();
    await page.waitForFunction(() => window.__lab.state.screen === 'huflow' && window.__lab.state.hu.view === 'paso');
    const linkedInStep = await page.evaluate(() => ({ screen: window.__lab.state.screen, step: window.__lab.state.hu.paso }));
    assert.deepEqual(linkedInStep, { screen: 'huflow', step: 'li1' }, 'La tarea abre el paso de LinkedIn de Mi huella');
  } finally {
    await browser.close();
  }

  assert.deepEqual(pageErrors, [], 'Current no debe lanzar errores de página');
  console.log('CURRENT HOME REDISEÑADA · selector A39, herramientas, rutas y plan Freemium/Premium: PASS');
  console.log('Capturas: .tmp/home2-freemium-1440x900.png · .tmp/home2-premium-1440x900.png');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
