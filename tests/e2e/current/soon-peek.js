const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const appUrl = process.env.LAB_URL || 'http://localhost:4173/';
const browserOptions = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {};

async function openFlow(page, id) {
  const item = page.locator('nav.lab-col button.lab-item').filter({ hasText: id });
  assert.equal(await item.count(), 1, `${id} aparece como flujo próximo`);
  await item.click();
  await page.waitForFunction(flowId => window.__lab?.state.lab.cur === flowId, id);
}

async function assertLocked(page) {
  const state = await page.evaluate(() => [
    document.querySelector('main.lab-col > div[aria-hidden]'),
    document.querySelector('aside.lab-pv > div[aria-hidden]')
  ].map(element => ({
    ariaHidden: element?.getAttribute('aria-hidden'),
    filter: getComputedStyle(element).filter,
    pointerEvents: getComputedStyle(element).pointerEvents
  })));
  assert.equal(state.length, 2);
  for (const zone of state) {
    assert.equal(zone.ariaHidden, 'true');
    assert.equal(zone.filter, 'blur(6px)');
    assert.equal(zone.pointerEvents, 'none');
  }
}

async function assertUnblurred(page) {
  const state = await page.evaluate(() => [
    document.querySelector('main.lab-col > div[aria-hidden]'),
    document.querySelector('aside.lab-pv > div[aria-hidden]')
  ].map(element => ({
    ariaHidden: element?.getAttribute('aria-hidden'),
    filter: getComputedStyle(element).filter,
    pointerEvents: getComputedStyle(element).pointerEvents
  })));
  assert.equal(state.length, 2);
  for (const zone of state) {
    assert.equal(zone.ariaHidden, 'false');
    assert.equal(zone.filter, 'none');
    assert.equal(zone.pointerEvents, 'auto');
  }
}

async function assertBannerDoesNotCoverFlowHeading(page, banner) {
  const boxes = await page.evaluate(bannerElement => {
    const main = document.querySelector('main.lab-col');
    const heading = main?.querySelector('h1');
    const chip = main?.querySelector('.lab-chip-soon');
    const rect = element => {
      const { left, top, right, bottom } = element.getBoundingClientRect();
      return { left, top, right, bottom };
    };
    return {
      banner: rect(bannerElement.parentElement),
      heading: heading && rect(heading),
      chip: chip && rect(chip)
    };
  }, await banner.elementHandle());
  assert.ok(boxes.heading, 'El H1 del flujo está presente');
  assert.ok(boxes.chip, 'El chip de estado del flujo está presente');
  for (const [name, target] of [['H1', boxes.heading], ['chip de estado', boxes.chip]]) {
    const overlaps = boxes.banner.left < target.right && boxes.banner.right > target.left
      && boxes.banner.top < target.bottom && boxes.banner.bottom > target.top;
    assert.equal(overlaps, false, `El rectángulo del banner no se solapa con el ${name}: ${JSON.stringify({ banner: boxes.banner, target })}`);
  }
}

(async () => {
  const { LAB_ALL_FLOWS, LAB_SEC_OF, LAB_SOON_OF } = await import(pathToFileURL(path.resolve(__dirname, '../../../src/current/data.ts')));
  const lexFlow = LAB_ALL_FLOWS.find(flow => LAB_SEC_OF(flow) === 'soon' && flow.g === 'p1' && LAB_SOON_OF(flow) === 'lex');
  assert.ok(lexFlow, 'p1 tiene un flujo Próximamente de tipo lex');

  const browser = await chromium.launch({ ...browserOptions, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    await page.goto(appUrl, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => !!window.__lab?.labOpen && !!document.querySelector('.tp-phone'), null, { timeout: 30000 });
    await page.locator('nav.lab-col').getByRole('button', { name: /^Próximamente/ }).first().click();

    await openFlow(page, 'A14');
    let dialog = page.locator('[data-lab-modal]');
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await dialog.isVisible(), true, 'A14 abre el modal ask');
    assert.equal(await dialog.getByRole('button', { name: /Echar un vistazo|Desbloquear|Ojear lo que lleva Lex|Vale, enséñamelo/ }).count(), 0,
      'El enlace no aparece antes de los cinco latigazos');

    await dialog.getByRole('button', { name: 'Sí', exact: true }).click();
    for (let count = 0; count < 3; count += 1) {
      await page.locator('[data-lab-modal]').getByRole('button', { name: 'Otro latigazo', exact: true }).click();
    }
    assert.equal(await page.evaluate(() => window.__lab.state.lab.whips), 4, 'Cuatro latigazos siguen sin desbloquear el enlace');
    dialog = page.locator('[data-lab-modal]');
    assert.equal(await dialog.getByRole('button', { name: /Echar un vistazo|Desbloquear|Ojear lo que lleva Lex|Vale, enséñamelo/ }).count(), 0);

    await dialog.getByRole('button', { name: 'Otro latigazo', exact: true }).click();
    await page.waitForFunction(() => window.__lab.state.lab.whips === 5);
    dialog = page.locator('[data-lab-modal]');
    const peek = dialog.getByRole('button', { name: 'Echar un vistazo', exact: true });
    await peek.waitFor({ state: 'visible' });
    await fs.mkdir(path.resolve('.tmp'), { recursive: true });
    await page.screenshot({ path: path.resolve('.tmp/soon-peek-after-fifth-whip-1440x900.png') });

    await peek.click();
    await dialog.waitFor({ state: 'detached' });
    await assertUnblurred(page);
    await page.waitForFunction(() => document.activeElement === document.querySelector('main.lab-col'), null, { timeout: 2000 });
    const banner = page.locator('main.lab-col').getByRole('button', { name: 'Vistazo · aún no está en vigor', exact: true });
    await banner.waitFor({ state: 'visible' });
    await assertBannerDoesNotCoverFlowHeading(page, banner);
    await page.screenshot({ path: path.resolve('.tmp/soon-peek-unblurred-1440x900.png') });

    const mobile = page.locator('.tp-phone');
    await mobile.locator('textarea').fill('Correos pide 1,99 € de gastos de envío.');
    await mobile.getByRole('button', { name: 'Analizar', exact: true }).click();
    await page.waitForFunction(() => window.__lab.state.an.view === 'result', null, { timeout: 10000 });

    await banner.click();
    dialog = page.locator('[data-lab-modal]');
    await dialog.getByRole('button', { name: 'Echar un vistazo', exact: true }).waitFor({ state: 'visible' });
    await dialog.getByRole('button', { name: 'No', exact: true }).click();
    dialog = page.locator('[data-lab-modal]');
    await dialog.getByRole('button', { name: /Echar un vistazo|Desbloquear|Ojear lo que lleva Lex|Vale, enséñamelo/ }).waitFor({ state: 'visible' });
    await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await page.locator('[data-lab-modal]').waitFor({ state: 'detached' });

    await openFlow(page, 'A15');
    dialog = page.locator('[data-lab-modal]');
    await dialog.getByRole('button', { name: /Echar un vistazo|Desbloquear|Ojear lo que lleva Lex|Vale, enséñamelo/ }).waitFor({ state: 'visible' });
    await assertLocked(page);
    await dialog.getByRole('button', { name: /Echar un vistazo|Desbloquear|Ojear lo que lleva Lex|Vale, enséñamelo/ }).click();
    await dialog.waitFor({ state: 'detached' });
    await assertUnblurred(page);
    await page.evaluate(() => window.__lab.labPlan('premium'));
    await assertUnblurred(page);
    await page.locator('main.lab-col').getByRole('button', { name: 'Reiniciar el móvil', exact: true }).click();
    await assertUnblurred(page);
    assert.equal(await page.evaluate(() => window.__lab.state.lab.peek.includes('A15')), true,
      'Cambiar de plan y reiniciar el móvil conservan el vistazo');

    await openFlow(page, lexFlow.id);
    dialog = page.locator('[data-lab-modal]');
    await dialog.getByRole('button', { name: /Echar un vistazo|Desbloquear|Ojear lo que lleva Lex|Vale, enséñamelo/ }).waitFor({ state: 'visible' });
    await dialog.getByRole('button', { name: 'Vale, esperaré', exact: true }).click();
    await dialog.waitFor({ state: 'detached' });
    const lexBanner = page.locator('main.lab-col').getByRole('button', { name: /Próximamente · Lex está en ello/ });
    await lexBanner.click();
    dialog = page.locator('[data-lab-modal]');
    await dialog.getByRole('button', { name: /Echar un vistazo|Desbloquear|Ojear lo que lleva Lex|Vale, enséñamelo/ }).waitFor({ state: 'visible' });
    await dialog.getByRole('button', { name: 'Meterle prisa', exact: true }).click();
    dialog = page.locator('[data-lab-modal]');
    await dialog.getByRole('button', { name: /Echar un vistazo|Desbloquear|Ojear lo que lleva Lex|Vale, enséñamelo/ }).waitFor({ state: 'visible' });
    await dialog.getByRole('button', { name: 'No', exact: true }).click();
    await page.locator('[data-lab-modal]').getByRole('button', { name: 'Cerrar', exact: true }).click();
    await page.locator('[data-lab-modal]').waitFor({ state: 'detached' });

    await openFlow(page, 'A14');
    assert.equal(await page.locator('[data-lab-modal]').count(), 0, 'Volver a A14 no abre el modal automáticamente');
    await assertUnblurred(page);

    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__lab?.labOpen && !!document.querySelector('.tp-phone'), null, { timeout: 30000 });
    assert.deepEqual(await page.evaluate(() => ({ whips: window.__lab.state.lab.whips || 0, peek: window.__lab.state.lab.peek || [] })),
      { whips: 0, peek: [] }, 'Los latigazos y el vistazo viven solo en la sesión');
    await page.locator('nav.lab-col').getByRole('button', { name: /^Próximamente/ }).first().click();
    await openFlow(page, 'A14');
    assert.equal(await page.locator('[data-lab-modal]').getByRole('button', { name: /Echar un vistazo|Desbloquear|Ojear lo que lleva Lex|Vale, enséñamelo/ }).count(), 0);
    await assertLocked(page);
  } finally {
    await browser.close();
  }

  assert.deepEqual(pageErrors, [], 'Current no debe lanzar errores de página');
  console.log('CURRENT SOON PEEK · umbral 5, unlock por flujo, reapertura, lex, foco y reinicio de sesión: PASS');
  console.log('Capturas: .tmp/soon-peek-after-fifth-whip-1440x900.png · .tmp/soon-peek-unblurred-1440x900.png');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
