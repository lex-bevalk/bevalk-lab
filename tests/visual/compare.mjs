import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import pngjs from 'pngjs';

const { PNG } = pngjs;
const [baselineArg, currentArg, diffArg] = process.argv.slice(2);
if (!baselineArg || !currentArg) {
  console.error('Uso: node tests/visual/compare.mjs <baselineDir> <currentDir> [diffDir]');
  process.exit(2);
}
const baselineDir = resolve(process.cwd(), baselineArg);
const currentDir = resolve(process.cwd(), currentArg);
const visualDir = resolve(fileURLToPath(new URL('.', import.meta.url)));
const diffDir = diffArg ? resolve(process.cwd(), diffArg) : join(visualDir, 'diff');
const threshold = 0.1;
const maxDifferentPercent = 0.5;
await mkdir(diffDir, { recursive: true });

async function captureNames(dir) {
  try {
    const manifest = JSON.parse(await readFile(join(dir, 'capture-manifest.json'), 'utf8'));
    return manifest.captures.map(capture => capture.name).sort();
  } catch {
    return listPngs(dir);
  }
}
async function listPngs(dir, prefix = '') {
  const entries = await readdir(join(dir, prefix), { withFileTypes: true });
  const names = [];
  for (const entry of entries) {
    const child = join(prefix, entry.name);
    if (entry.isDirectory()) names.push(...await listPngs(dir, child));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) names.push(child.replaceAll('\\', '/'));
  }
  return names.sort();
}
async function readPng(file) {
  return PNG.sync.read(await readFile(file));
}

const baselineNames = await captureNames(baselineDir);
const currentNames = await captureNames(currentDir);
const allNames = [...new Set([...baselineNames, ...currentNames])].sort();
const baselineSet = new Set(baselineNames);
const currentSet = new Set(currentNames);
const results = [];
for (const name of allNames) {
  if (!baselineSet.has(name) || !currentSet.has(name)) {
    results.push({ name, status: 'MISSING', percent: 100, differentPixels: null, totalPixels: null });
    continue;
  }
  const [baseline, current] = await Promise.all([
    readPng(join(baselineDir, name)),
    readPng(join(currentDir, name)),
  ]);
  if (baseline.width !== current.width || baseline.height !== current.height) {
    results.push({ name, status: 'SIZE', percent: 100, differentPixels: null, totalPixels: baseline.width * baseline.height, baseline: [baseline.width, baseline.height], current: [current.width, current.height] });
    continue;
  }
  const diff = new PNG({ width: baseline.width, height: baseline.height });
  const differentPixels = pixelmatch(baseline.data, current.data, diff.data, baseline.width, baseline.height, { threshold });
  const totalPixels = baseline.width * baseline.height;
  const percent = differentPixels * 100 / totalPixels;
  await writeFile(join(diffDir, name), PNG.sync.write(diff));
  results.push({ name, status: percent > maxDifferentPercent ? 'FAIL' : 'PASS', percent, differentPixels, totalPixels });
}

const pass = results.filter(result => result.status === 'PASS').length;
const fail = results.filter(result => result.status === 'FAIL' || result.status === 'SIZE').length;
const missing = results.filter(result => result.status === 'MISSING').length;
const report = { baselineDir, currentDir, threshold, maxDifferentPercent, compared: results.length, pass, fail, missing, results };
await writeFile(join(diffDir, 'comparison-summary.json'), JSON.stringify(report, null, 2));
const rows = results.map(result => [
  result.name,
  result.percent.toFixed(2) + '%',
  result.differentPixels === null ? '—' : `${result.differentPixels}/${result.totalPixels}`,
  result.status,
]);
console.log(`Baseline: ${baselineDir}`);
console.log(`Actual:   ${currentDir}`);
console.log(`Umbral pixelmatch: ${threshold} · máximo: ${maxDifferentPercent.toFixed(2)}%`);
console.table(rows.map(([captura, diferencia, pixeles, estado]) => ({ captura, diferencia, pixeles, estado })));
console.log(`TOTAL ${results.length} · PASS ${pass} · FAIL ${fail} · FALTAN ${missing}`);
console.log(`Resumen: ${join(diffDir, 'comparison-summary.json')}`);
if (fail || missing) process.exitCode = 1;
