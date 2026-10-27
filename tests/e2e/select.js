const { chromium } = require('playwright');
const fs = require('fs');
const GETC = `const getC = () => { if (window.__lab) return window.__lab; const el = document.querySelector('.tp-phone'); const k = Object.keys(el || {}).find(k => k.startsWith('__reactFiber')); let f = el && el[k]; while (f) { if (f.stateNode && f.stateNode.logic && f.stateNode.logic.labVals) return f.stateNode.logic; f = f.return; } return null; };`;
const targets = {
  prsec: { state: 'c.renderVals().pr.sec.label', setup: 'c.prGo("seguridad", c.prSecReset()); if (!c.renderVals().pr.isSeg) throw new Error("No se llegó a Seguridad");' },
  prdel: { state: 'c.renderVals().pr.del.label', setup: 'c.prGo("seguridad", Object.assign(c.prSecReset(), {sec:"borrar"})); if (!c.renderVals().pr.sec.isBorrar) throw new Error("No se llegó a Eliminar cuenta");' },
  prfb: { state: 'c.renderVals().pr.fb.label', setup: 'c.prGo("opinion", {fb:{topic:"", text:"", err:{}}}); if (!c.renderVals().pr.isOpinion) throw new Error("No se llegó a Tu opinión importa");' },
  sop: { state: 'c.renderVals().sop.asuntoLabel', setup: 'c.go("soporte"); if (!c.renderVals().isSoporte) throw new Error("No se llegó a Soporte técnico");' },
  sos: { state: 'c.renderVals().sos.helpLabel', setup: 'c.setState({screen:"sos", sheet:null, sos:Object.assign({}, c.state.sos, {view:"form", err:{}})}); if (!c.renderVals().sos.isForm) throw new Error("No se llegó al formulario SOS");' },
};
const triggerSelectors = {
  prsec: '.tp-phone .lab-optsel > button[aria-labelledby="pr-sec"]',
  prdel: '.tp-phone .lab-optsel > button[aria-labelledby="pr-motivo"]',
  prfb: '.tp-phone .lab-optsel > button[aria-labelledby="pr-fb"]',
  sop: '.tp-phone .lab-optsel > button[aria-labelledby="sop-asunto"]',
  sos: '.tp-phone [data-screen-label="SOS"] .lab-optsel > button',
};

(async () => {
  const browserOptions = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, headless: true }
    : { headless: true };
  const browser = await chromium.launch(browserOptions);
  const page = await browser.newPage({ viewport: { width: 1680, height: 916 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(process.env.LAB_URL || 'http://localhost:4173/', { waitUntil: 'load' });
    await page.waitForFunction(() => window.__lab);
    await page.addScriptTag({ content: fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8') });
    const evaluateLogic = expression => page.evaluate(`(() => { ${GETC} const c = getC(); if (!c) throw new Error('No se encontró la lógica del Lab'); ${expression} })()`);
    const results = [];
    let axeChecked = false;

    for (const [target, spec] of Object.entries(targets)) {
      try {
        await evaluateLogic(`(new Function('c', ${JSON.stringify(spec.setup)}))(c); c.labLabSet({tab:"phone", pv:"closed", case:null, view:"flow"});`);
        const triggerSelector = triggerSelectors[target];
        const trigger = page.locator(triggerSelector);
        await trigger.waitFor({ state: 'visible' });
        if (target === 'prdel') {
          const violations = await page.evaluate(async () => {
            const buttons = [...document.querySelectorAll('.tp-phone [data-screen-label="Perfil"] button')]
              .filter(element => element.textContent.trim() === 'Eliminar cuenta' && element.closest('.lab-optsel') === null);
            if (buttons.length !== 1) throw new Error(`Se esperaba un único botón de pie "Eliminar cuenta"; encontrados: ${buttons.length}`);
            const button = buttons[0];
            const result = await window.axe.run(button, {
              runOnly: ['color-contrast'],
              resultTypes: ['violations'],
            });
            return result.violations.map(item => `${item.id} (${item.impact})`);
          });
          if (violations.length) throw new Error('axe encontró violaciones de contraste en Eliminar cuenta: ' + violations.join(', '));
        }
        await trigger.click();
        const menu = page.locator('.tp-phone .odin-menu[role="listbox"]');
        await menu.waitFor({ state: 'visible' });
        const geometryFailures = await page.locator('.tp-phone .odin-menu[role="listbox"] [role="option"]').evaluateAll(options => {
          const failures = [];
          const rects = options.map((option, index) => {
            if (option.scrollHeight > option.clientHeight + 1) failures.push(`opción ${index}: scrollHeight ${option.scrollHeight} > clientHeight ${option.clientHeight} + 1`);
            if (option.scrollWidth > option.clientWidth + 1) failures.push(`opción ${index}: scrollWidth ${option.scrollWidth} > clientWidth ${option.clientWidth} + 1`);
            const rect = option.getBoundingClientRect();
            return { top: rect.top, bottom: rect.bottom };
          });
          for (let index = 0; index < rects.length - 1; index++) {
            if (rects[index].bottom > rects[index + 1].top + 1) {
              failures.push(`opción ${index}: bottom ${rects[index].bottom} > top de opción ${index + 1} ${rects[index + 1].top} + 1`);
            }
          }
          return failures;
        });
        if (geometryFailures.length) throw new Error(`Geometría inválida en ${target}: ${geometryFailures.join('; ')}`);
        const activeTarget = await evaluateLogic('return c.renderVals().sheet.target;');
        if (activeTarget !== target) throw new Error(`Se abrió ${activeTarget} al probar ${target}`);
        if (await trigger.getAttribute('aria-expanded') !== 'true') throw new Error('aria-expanded no pasó a true al abrir');
        if (await page.locator('.odin-drawer, [role="dialog"]').count()) throw new Error('Se montó un drawer o diálogo');

        const options = await page.evaluate(() => window.__lab.renderVals().sheet.opts.map(option => ({ label: option.label, selected: option.selected })));
        const choice = options.find(option => !option.selected) || options[0];
        if (!choice) throw new Error('El menú no tiene opciones');
        await page.getByRole('option', { name: choice.label, exact: true }).click();
        await page.waitForFunction(() => !document.querySelector('.tp-phone .odin-menu'));
        const selectedValue = await evaluateLogic(`return (new Function('c', ${JSON.stringify('return ' + spec.state)}))(c);`);
        if (selectedValue !== choice.label) throw new Error(`El estado no recibió la opción elegida: ${selectedValue}`);
        if (await trigger.getAttribute('aria-expanded') !== 'false') throw new Error('El menú no cerró después de elegir');
        if (!await trigger.evaluate(element => document.activeElement === element)) throw new Error('El foco no volvió al trigger tras elegir');

        await trigger.click();
        await menu.waitFor({ state: 'visible' });
        await page.locator('body').evaluate(element => element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
        await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('aria-expanded') === 'false', triggerSelector);
        if (!await trigger.evaluate(element => document.activeElement === element)) throw new Error('El cierre por mousedown no devolvió el foco al trigger');

        await trigger.click();
        await menu.waitFor({ state: 'visible' });
        await page.keyboard.press('Escape');
        await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('aria-expanded') === 'false', triggerSelector);
        if (!await trigger.evaluate(element => document.activeElement === element)) throw new Error('Escape no devolvió el foco al trigger');

        await trigger.focus();
        await page.keyboard.press('ArrowDown');
        await menu.waitFor({ state: 'visible' });
        await page.keyboard.press('Enter');
        await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('aria-expanded') === 'false', triggerSelector);
        if (!await trigger.evaluate(element => document.activeElement === element)) throw new Error('ArrowDown + Enter no devolvió el foco al trigger');

        if (!axeChecked) {
          await trigger.click();
          await menu.waitFor({ state: 'visible' });
          const violations = await page.evaluate(async () => {
            const result = await window.axe.run({ include: [['.lab-optsel']] }, { resultTypes: ['violations'] });
            return result.violations.map(item => `${item.id} (${item.impact})`);
          });
          if (violations.length) throw new Error('axe encontró violaciones: ' + violations.join(', '));
          await page.locator('body').evaluate(element => element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
          axeChecked = true;
        }
        if (errors.length) throw new Error('Errores de página: ' + errors.join(' | '));
        results.push({ target, ok: true });
        console.log('PASS ' + target);
      } catch (error) {
        results.push({ target, ok: false });
        console.log('FAIL ' + target + ' · ' + error.message.split('\n')[0]);
      }
    }
    const passed = results.filter(result => result.ok).length;
    console.log(`${passed}/${results.length}`);
    if (passed !== results.length || !axeChecked) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
