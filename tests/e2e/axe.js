const { chromium } = require('playwright');
const fs = require('fs');
const GETC = `const getC = () => { if (window.__lab) return window.__lab; const el = document.querySelector('.tp-phone'); const k = Object.keys(el || {}).find(k => k.startsWith('__reactFiber')); let f = el && el[k]; while (f) { if (f.stateNode && f.stateNode.logic && f.stateNode.logic.labVals) return f.stateNode.logic; f = f.return; } return null; };`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1680, height: 916 } });
  await p.goto((process.env.LAB_URL || 'http://localhost:4173/')); await p.waitForTimeout(2200);
  await p.addScriptTag({ content: fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8') });
  const run = async label => {
    await p.evaluate(() => document.querySelectorAll('.lab-b details').forEach(d => d.open = true));
    const r = await p.evaluate(async () => { const res = await axe.run({ include: [['.lab-a'], ['.lab-b'], ['.lab-pvh'], ['.lab-tabs']] }, { resultTypes: ['violations'] });
      return res.violations.map(v => v.id + ' (' + v.impact + ') x' + v.nodes.length + ': ' + v.nodes.slice(0, 3).map(n => n.target.join(' ') + ' → ' + (n.failureSummary || '').split('\n').slice(1, 2).join('')).join(' || ')); });
    console.log('== ' + label + '\n' + (r.join('\n') || 'no violations'));
  };
  await run('welcome');
  await p.evaluate(`(() => { ${GETC} const c = getC(); c.labSelect(c.labFlows().find(x => x.id === 'famadmin')); })()`); await p.waitForTimeout(600);
  await p.locator('.lab-b article button').nth(1).click(); await p.waitForTimeout(900);
  await run('flow + case');
  await b.close();
})();
