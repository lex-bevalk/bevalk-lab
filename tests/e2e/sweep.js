const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless: true });
  const p = await b.newPage({ viewport: { width: 1680, height: 916 } });
  const errs = [];
  p.on('console', m => { const t = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && !/status of 404|TUNNEL|Failed to load resource/.test(t)) errs.push(t); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto((process.env.LAB_URL || 'http://localhost:4173/'), { waitUntil: 'load' });
  await p.waitForTimeout(2200);
  const n = await p.evaluate(() => document.querySelectorAll('.lab-a button[aria-current]').length);
  const out = [];
  for (let i = 0; i < n; i++) {
    for (const plan of ['Freemium', 'Premium']) {
      const before = errs.length;
      await p.locator('.lab-a button[aria-current]').nth(i).click();
      await p.waitForTimeout(350);
      const radio = p.locator('.lab-a [role=radio]', { hasText: plan });
      if (await radio.count() === 0 || await radio.getAttribute('aria-disabled') === 'true') {
        out.push([i + 1, plan, 'SKIP unavailable', '', '', ''].join(' | '));
        continue;
      }
      await radio.click({force:true});
      await p.waitForTimeout(500);
      const r = await p.evaluate(() => {
        const t = s => (document.querySelector(s) || {}).textContent || '';
        const scr = [...document.querySelectorAll('.tp-phone [data-screen-label]')].map(e => e.getAttribute('data-screen-label'));
        return {title: t('.lab-b h1'), plan: t('.lab-a [role=radio][aria-checked=true]').trim(), notice: t('.lab-b [role=status]').trim().slice(0, 90), screens: scr.join('|')};
      });
      out.push([i + 1, plan, r.plan, r.screens, r.notice, errs.slice(before).join(' ; ').slice(0, 200)].join(' | '));
    }
  }
  console.log(out.join('\n'));
  console.log('TOTAL ERRORS', errs.length);
  await b.close();
})();
