const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const refUrl = process.env.REF_URL || 'http://127.0.0.1:8765/project/Main.dc.html';
const labUrl = process.env.LAB_URL || 'http://localhost:4173/concept.html';
const ignoreConceptNavigation = process.env.FOCUS_IGNORE_CONCEPT_NAV === '1';
const browserOptions = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {};

(async () => {
  const browser = await chromium.launch({ ...browserOptions, headless: true });
  async function sequenceFor(url) {
    const page = await browser.newPage({ viewport: { width: 1680, height: 916 }, reducedMotion: 'reduce' });
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    await page.evaluate(() => document.fonts.ready);
    const count = await page.evaluate(ignoreConceptNavigation => {
      const selector = 'a[href], area[href], button, input, select, textarea, iframe, object, embed, [contenteditable="true"], summary, [tabindex]';
      return [...document.querySelectorAll(selector)].filter(element => {
        if (element.closest('.proto-switch')) return false;
        if (ignoreConceptNavigation && element.closest('.lab-a')) return false;
        if (element.tabIndex < 0) return false;
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
      }).length;
    }, ignoreConceptNavigation);
    if (count === 0) throw new Error(`No se encontraron elementos enfocables en ${url}`);
    const sequence = [];
    let attempts = 0;
    const attemptLimit = (count + 2) * (ignoreConceptNavigation ? 4 : 2);
    while (sequence.length < count + 2 && attempts < attemptLimit) {
      attempts += 1;
      await page.keyboard.press('Tab');
      const item = await page.evaluate(ignoreConceptNavigation => {
        const element = document.activeElement;
        if (!element || element === document.body) return { tag: 'BODY', label: '' };
        if (element.closest('.proto-switch')) return null;
        if (ignoreConceptNavigation && element.closest('.lab-a')) return null;
        const tag = element.tagName.toLowerCase();
        const label = element.getAttribute('aria-label')
          || element.getAttribute('title')
          || (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
        const navGroup = element.matches('.lab-a button[aria-current]')
          ? element.parentElement?.getAttribute('aria-label') || ''
          : /^button$/.test(tag) && /^Mi Familia(?:,| ·)/.test(label)
            ? 'Mi Familia · Inicio'
          : /^button$/.test(tag) && /Mamá te pide ayuda con un enlace/.test(label)
            ? 'Mi Familia · tarea semanal'
          : /^button$/.test(tag) && /^F\d{2} · Mi Familia ·/.test(label)
            ? 'Mi Familia · destacado'
            : '';
        return { tag, label, navGroup };
      }, ignoreConceptNavigation);
      // The reference has no prototype switch, so omit its focus targets.
      if (item) sequence.push(item);
    }
    if (sequence.length < count + 2) throw new Error(`No se completó la secuencia de tabulación en ${url}`);
    await page.close();
    const normalized = sequence.filter(item => !(item.navGroup || '').startsWith('Mi Familia ·'));
    return { url, candidateCount: count, steps: sequence.length, sequence, normalized };
  }

  try {
    const reference = await sequenceFor(refUrl);
    const lab = await sequenceFor(labUrl);
    const exact = JSON.stringify(reference.normalized) === JSON.stringify(lab.normalized);
    const sameReferencePrefix = ignoreConceptNavigation
      && reference.normalized.length <= lab.normalized.length
      && reference.normalized.every((item, index) => JSON.stringify(item) === JSON.stringify(lab.normalized[index]));
    const identical = exact || sameReferencePrefix;
    const comparison = exact ? 'identical' : sameReferencePrefix ? 'reference-prefix' : 'different';
    const outputDir = path.resolve('tests/e2e/results');
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, 'focus.json'), JSON.stringify({ identical, comparison, reference, lab }, null, 2));
    console.log(`FOCUS ${identical ? (sameReferencePrefix && !exact ? 'REFERENCE PREFIX' : 'IDENTICAL') : 'DIFFERENT'} · referencia ${reference.steps} pasos (${reference.candidateCount} elementos) · Lab ${lab.steps} pasos (${lab.candidateCount} elementos)`);
    if (sameReferencePrefix && !exact) {
      console.log(`Concept conserva el orden compartido; ${lab.normalized.length - reference.normalized.length} objetivos adicionales quedan después de la secuencia de referencia.`);
    }
    console.log(`Secuencia guardada en ${path.join(outputDir, 'focus.json')}`);
    if (!identical) {
      const length = Math.max(reference.normalized.length, lab.normalized.length);
      const diff = [];
      for (let index = 0; index < length; index += 1) {
        if (JSON.stringify(reference.normalized[index]) !== JSON.stringify(lab.normalized[index])) {
          diff.push({ step: index + 1, reference: reference.normalized[index] || null, lab: lab.normalized[index] || null });
        }
      }
      console.table(diff);
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
