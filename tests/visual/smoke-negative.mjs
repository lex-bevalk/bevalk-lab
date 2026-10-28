import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(process.cwd());
const tempRoot = await mkdtemp(join(tmpdir(), 'bevalk-visual-negative-'));
const tempDist = join(tempRoot, 'dist');
const servers = [];
async function serve(directory) {
  const server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      const file = resolve(directory, `.${path === '/' ? '/index.html' : decodeURIComponent(path)}`);
      if (file !== directory && !file.startsWith(directory + sep)) throw new Error('Ruta fuera del directorio');
      const body = await readFile(file);
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
      response.writeHead(200, { 'content-type': `${types[extname(file)] || 'application/octet-stream'}; charset=utf-8` });
      response.end(body);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}/`;
}
try {
  await cp(join(root, 'dist'), tempDist, { recursive: true });
  const assetDir = join(tempDist, 'assets');
  let patched = false;
  for (const name of await readdir(assetDir)) {
    if (!name.endsWith('.css')) continue;
    const path = join(assetDir, name);
    const css = await readFile(path, 'utf8');
    const changed = css.replace(/(--color-primary\s*:\s*#)([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})/, (full, prefix, red, green, blue) => {
      const value = Math.min(255, Number.parseInt(red, 16) + 1).toString(16).padStart(2, '0').toUpperCase();
      patched = true;
      return `${prefix}${value}${green}${blue}`;
    });
    if (changed !== css) await writeFile(path, changed);
  }
  if (!patched) throw new Error('No se encontró --color-primary para aplicar el control negativo.');

  const baselineUrl = await serve(join(root, 'dist'));
  const currentUrl = await serve(tempDist);
  const diffDir = join(root, 'tests/visual/smoke-diff');
  await rm(diffDir, { recursive: true, force: true });
  const child = spawn(process.execPath, ['tests/visual/smoke.mjs'], {
    cwd: root,
    env: { ...process.env, LAB_BASE_URL: baselineUrl, LAB_CURRENT_URL: currentUrl },
    stdio: 'inherit',
  });
  const exitCode = await new Promise((resolveExit, reject) => {
    child.once('error', reject);
    child.once('close', code => resolveExit(code));
  });
  const summaryPath = join(diffDir, 'smoke-summary.json');
  let report = null;
  try { report = JSON.parse(await readFile(summaryPath, 'utf8')); } catch {}
  if (exitCode === 0 || !report || report.comparison?.compared !== 50 || report.comparison?.missing !== 0 || !report.tokenDifferences?.some(item => item.name === '--color-primary')) {
    throw new Error(`FALLO: el control no demostró una diferencia de color (exit=${exitCode}, resumen=${JSON.stringify(report)}).`);
  }
  console.log('CONTROL NEGATIVO PASS: el humo detectó el cambio temporal de --color-primary de 1 unidad.');
} finally {
  await Promise.all(servers.map(server => new Promise(resolveClose => server.close(resolveClose))));
  const resolvedTemp = resolve(tempRoot);
  if (resolvedTemp.startsWith(resolve(tmpdir()) + sep) && resolvedTemp.includes('bevalk-visual-negative-')) await rm(resolvedTemp, { recursive: true, force: true });
}
