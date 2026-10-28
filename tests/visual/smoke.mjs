import { spawnSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(process.cwd());
const viewports = [{ width: 375, height: 812 }, { width: 1440, height: 900 }];
const regularFlows = ['nuevo', 'bienvenida', 'dia1', 'aldia', 'comprobar', 'pzlink', 'ayuda', 'nvaviso', 'nvborrar', 'premmitad'];
const familyFlows = ['famdescubre', 'famcalma', 'famadmin', 'famplan', 'fambaja', 'faminvite', 'fammember', 'famsalir', 'famcerrar', 'famterminado', 'famlleno'];
const dropdowns = {
  perfil: { setup: 'c.prGo("seguridad", c.prSecReset()); if (!c.renderVals().pr.isSeg) throw new Error("No se llegó a Seguridad");', selector: '.tp-phone .lab-optsel > button[aria-labelledby="pr-sec"]' },
  sos: { setup: 'c.setState({screen:"sos", sheet:null, sos:Object.assign({}, c.state.sos, {view:"form", err:{}})}); if (!c.renderVals().sos.isForm) throw new Error("No se llegó al formulario SOS");', selector: '.tp-phone [data-screen-label="SOS"] .lab-optsel > button' },
  soporte: { setup: 'c.go("soporte"); if (!c.renderVals().isSoporte) throw new Error("No se llegó a Soporte técnico");', selector: '.tp-phone .lab-optsel > button[aria-labelledby="sop-asunto"]' },
};
const browserOptions = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, headless: true }
  : { headless: true };
const started = Date.now();
const tempRoot = await mkdtemp(join(tmpdir(), 'bevalk-visual-smoke-'));
const baseWorktree = join(tempRoot, 'base');
const dirs = { base: join(tempRoot, 'base-captures'), current: join(tempRoot, 'current-captures'), diff: join(root, 'tests/visual/smoke-diff') };
const childProcesses = [];
const servers = [];
let browser;
let createdWorktree = false;

function run(command, args, cwd = root, options = {}) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: options.inherit ? 'inherit' : 'pipe', shell: process.platform === 'win32' && /^(npm|npx)$/.test(command) });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} falló (${result.status}).\n${result.stdout || ''}\n${result.stderr || ''}`);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.stdout || '';
}

async function serve(directory) {
  const server = createServer(async (request, response) => {
    try {
      const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const relativePath = urlPath === '/' ? '/index.html' : urlPath;
      const file = resolve(directory, `.${relativePath}`);
      if (file !== directory && !file.startsWith(directory + sep)) throw new Error('Ruta fuera del directorio');
      const body = await readFile(file);
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
      response.writeHead(200, { 'content-type': `${types[extname(file)] || 'application/octet-stream'}; charset=utf-8` });
      response.end(body);
    } catch {
      response.writeHead(404); response.end('Not found');
    }
  });
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}/`;
}

async function getBaseUrl() {
  if (process.env.LAB_BASE_URL) return process.env.LAB_BASE_URL;
  const baseRef = process.env.BASE_REF || 'main';
  const ref = baseRef.startsWith('origin/') ? baseRef : `origin/${baseRef}`;
  if (process.env.CI) {
    run('git', ['worktree', 'add', '--detach', baseWorktree, ref]);
    createdWorktree = true;
  } else {
    const revision = run('git', ['rev-parse', ref]).trim();
    run('git', ['clone', '--shared', '--no-checkout', root, baseWorktree]);
    run('git', ['checkout', '--detach', revision], baseWorktree);
  }
  if (process.env.CI) run('npm', ['ci'], baseWorktree, { inherit: true });
  else await symlink(join(root, 'node_modules'), join(baseWorktree, 'node_modules'), 'junction');
  run('npm', ['run', 'build'], baseWorktree, { inherit: true });
  return serve(join(baseWorktree, 'dist'));
}

async function getCurrentUrl() {
  if (process.env.LAB_CURRENT_URL || process.env.LAB_URL) return process.env.LAB_CURRENT_URL || process.env.LAB_URL;
  const dist = join(root, 'dist');
  if (!existsSync(join(dist, 'index.html'))) run('npm', ['run', 'build'], root, { inherit: true });
  return serve(dist);
}

const getLogic = `const getC=()=>{if(window.__lab)return window.__lab;const el=document.querySelector('.tp-phone');const k=Object.keys(el||{}).find(x=>x.startsWith('__reactFiber'));let f=el&&el[k];while(f){if(f.stateNode?.logic?.labVals)return f.stateNode.logic;f=f.return;}return null;};`;
async function captureSite(url, outDir) {
  await mkdir(outDir, { recursive: true });
  const page = await browser.newPage({ viewport: viewports[0], deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'load' });
  await page.addStyleTag({ content: `*,*::before,*::after{animation:none!important;animation-duration:0s!important;animation-delay:0s!important;transition:none!important;transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important;caret-color:transparent!important}` });
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 15000))]));
  await page.waitForFunction(() => document.querySelector('.lab') && (window.__lab || [...Object.keys(document.querySelector('.tp-phone') || {})].some(key => key.startsWith('__reactFiber'))));
  const logic = expression => page.evaluate(`(()=>{${getLogic}const c=getC();if(!c)throw new Error('No se encontró la lógica del Lab');${expression}})()`);
  const captures = [];

  async function prepareFlow(id) {
    return logic(`const flows=c.labFlows();let f=flows.find(x=>x.id===${JSON.stringify(id)});if(!f){const fallback='dia1';f=flows.find(x=>x.id===fallback);if(!f)throw new Error('No existe ${id} ni el estado base '+fallback);}c.labSelect(f);c.labLabSet({tab:'phone',pv:'closed',case:null,view:'flow'});return f.id;`);
  }

  async function screenshot(name, viewport) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => { document.querySelectorAll('.lab-scroll,.tp-scroll').forEach(node => { node.scrollTop = 0; }); });
    await page.waitForFunction(() => {
      const el=document.querySelector('.tp-phone');let c=window.__lab;if(!c&&el){let f=el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))];while(f){if(f.stateNode?.logic?.labVals){c=f.stateNode.logic;break;}f=f.return;}}if(!c)return false;
      const prev=window.__smokeSettle;const signature=JSON.stringify(c.state);const stable=prev&&prev.signature===signature?prev.count+1:0;window.__smokeSettle={signature,count:stable};return stable>=2;
    }, null, { polling: 50, timeout: 12000 });
    await page.evaluate(() => document.fonts.ready);
    const file = `${viewport.width}x${viewport.height}--${name}.png`;
    const png = await page.screenshot({ animations: 'disabled' });
    await writeFile(join(outDir, file), png);
    const boxes = await page.evaluate(() => {
      const box = selector => { const el=document.querySelector(selector);if(!el)return null;const r=el.getBoundingClientRect();const s=getComputedStyle(el);return s.display==='none'||s.visibility==='hidden'||r.width<1||r.height<1?null:{x:r.x,y:r.y,width:r.width,height:r.height}; };
      return { labA:box('.lab-a'), tpPhone:box('.tp-phone') };
    });
    captures.push({ name: file, boxes });
  }

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await screenshot('cover', viewport);
    for (const id of regularFlows) {
      await prepareFlow(id);
      await screenshot(`flow-${id}`, viewport);
    }
    for (const id of familyFlows) {
      const selected = await prepareFlow(id);
      if (id === 'famadmin' && selected === 'famadmin') await logic(`c.famGo('hub');const r=c.state.fam.reqs.find(x=>!x.reply);if(!r)throw new Error('famadmin no tiene una petición pendiente');c.famSheet({kind:'reply',req:r.id,msg:null});`);
      await screenshot(`flow-${id}`, viewport);
    }
    for (const [id, target] of Object.entries(dropdowns)) {
      await page.goto(url, { waitUntil: 'load' });
      await page.addStyleTag({ content: `*,*::before,*::after{animation:none!important;animation-duration:0s!important;animation-delay:0s!important;transition:none!important;transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important;caret-color:transparent!important}` });
      await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 15000))]));
      await page.waitForFunction(() => window.__lab);
      await logic(`${target.setup}c.labLabSet({tab:'phone',pv:'closed',case:null,view:'flow'});`);
      const trigger = page.locator(target.selector);
      await trigger.waitFor({ state: 'visible' });
      await trigger.click();
      await page.locator('.tp-phone .odin-menu[role="listbox"]').waitFor({ state: 'visible' });
      await page.evaluate(async selector => {
        await document.fonts.ready; await new Promise(requestAnimationFrame);
        const menu=document.querySelector('.tp-phone .odin-menu[role="listbox"]');if(menu&&menu.scrollHeight>menu.clientHeight)menu.scrollTop=0;
        await Promise.all([...document.getAnimations({subtree:true})].filter(a=>a.playState!=='finished'&&a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));
      }, target.selector);
      await screenshot(`dropdown-${id}`, viewport);
      await page.locator('body').evaluate(el => el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true})));
      await page.waitForFunction(() => !document.querySelector('.tp-phone .odin-menu'));
    }
  }
  const tokens = await page.evaluate(() => {
    const root = document.querySelector('.lab');
    if (!root) return {};
    const names = new Set();
    for (const sheet of [...document.styleSheets]) {
      try {
        for (const rule of [...sheet.cssRules]) {
          if (!rule.style) continue;
          for (const name of [...rule.style]) if (name.startsWith('--color-')) names.add(name);
        }
      } catch {}
    }
    const style = getComputedStyle(root);
    return Object.fromEntries([...names].map(name => [name, style.getPropertyValue(name).trim()]).filter(([, value]) => value));
  });
  await writeFile(join(outDir, 'capture-manifest.json'), JSON.stringify({ url, captures, tokens }, null, 2));
  await page.close();
  return { count: captures.length, tokens };
}

try {
  const baseUrl = await getBaseUrl();
  const currentUrl = await getCurrentUrl();
  browser = await chromium.launch(browserOptions);
  const [baseCapture, currentCapture] = await Promise.all([captureSite(baseUrl, dirs.base), captureSite(currentUrl, dirs.current)]);
  const tokenDifferences = [...new Set([...Object.keys(baseCapture.tokens), ...Object.keys(currentCapture.tokens)])]
    .filter(name => baseCapture.tokens[name] !== currentCapture.tokens[name])
    .map(name => ({ name, base: baseCapture.tokens[name] ?? null, branch: currentCapture.tokens[name] ?? null }));
  const comparison = spawnSync(process.execPath, ['tests/visual/compare.mjs', dirs.base, dirs.current, dirs.diff], { cwd: root, encoding: 'utf8' });
  if (comparison.stdout) process.stdout.write(comparison.stdout);
  if (comparison.stderr) process.stderr.write(comparison.stderr);
  if (comparison.error) throw comparison.error;
  const summaryFile = join(dirs.diff, 'comparison-summary.json');
  const summary = JSON.parse(await readFile(summaryFile, 'utf8'));
  const smokeSummary = { baseCaptures: baseCapture.count, branchCaptures: currentCapture.count, tokenDifferences, comparison: { compared: summary.compared, pass: summary.pass, fail: summary.fail, missing: summary.missing } };
  await writeFile(join(dirs.diff, 'smoke-summary.json'), JSON.stringify(smokeSummary, null, 2));
  const elapsedSeconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`SMOKE capturas: base ${baseCapture.count} · rama ${currentCapture.count} · ${elapsedSeconds} s`);
  console.log(`SMOKE tokens de color: ${tokenDifferences.length} diferencias`);
  console.log(`SMOKE resumen: ${summaryFile}`);
  if (summary.compared !== currentCapture.count || summary.fail || summary.missing || comparison.status !== 0 || tokenDifferences.length) process.exitCode = 1;
} catch (error) {
  console.error(error.stack || error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  await Promise.all(servers.map(server => new Promise(resolveClose => server.close(resolveClose))));
  const resolvedTemp = resolve(tempRoot);
  if (resolvedTemp.startsWith(resolve(tmpdir()) + sep) && resolvedTemp.includes('bevalk-visual-smoke-')) {
    await rm(resolvedTemp, { recursive: true, force: true });
    if (createdWorktree) spawnSync('git', ['worktree', 'prune'], { cwd: root, stdio: 'ignore' });
  }
}
