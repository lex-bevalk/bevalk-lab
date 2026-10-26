// usage: node run.js <width> <height> <out-prefix> <steps.json>
// steps: [{click:"text"} | {sel:"css"} | {wait:ms} | {shot:"name"} | {eval:"js"} | {type:[sel,text]}]
const { chromium } = require('playwright');
(async () => {
  const [,, w, h, pre, stepsFile] = process.argv;
  const steps = JSON.parse(require('fs').readFileSync(stepsFile, 'utf8'));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  const errs = [];
  p.on('console', m => { const t = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && !/status of 404|TUNNEL|Failed to load resource/.test(t)) errs.push(m.type() + ': ' + t); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto((process.env.LAB_URL || 'http://localhost:4173/'), { waitUntil: 'load' });
  await p.waitForTimeout(2200);
  for (const st of steps) {
    try {
      if (st.click) { const loc = st.in ? p.locator(st.in).getByText(st.click, { exact: !!st.exact }) : p.getByText(st.click, { exact: !!st.exact }); await loc.first().click({ timeout: 4000 }); await p.waitForTimeout(st.after || 450); }
      else if (st.role) { await p.getByRole(st.role, { name: st.name, exact: !!st.exact }).first().click({ timeout: 4000 }); await p.waitForTimeout(st.after || 450); }
      else if (st.sel) { await p.locator(st.sel).first().click({ timeout: 4000 }); await p.waitForTimeout(st.after || 450); }
      else if (st.type) { await p.locator(st.type[0]).first().fill(st.type[1]); await p.waitForTimeout(st.after || 300); }
      else if (st.wait) await p.waitForTimeout(st.wait);
      else if (st.eval) { const r = await p.evaluate(st.eval); console.log('EVAL', st.label || '', JSON.stringify(r)); }
      else if (st.shot) await p.screenshot({ path: pre + st.shot + '.png' });
    } catch (e) { console.log('STEP FAIL', JSON.stringify(st), e.message.split('\n')[0]); }
  }
  if (errs.length) console.log('ERRORS\n' + errs.slice(0, 30).join('\n'));
  await b.close();
})();
