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
const SCROLL_NAV_EXCLUSION = {
  pattern: '*-scroll-nav-*',
  reason: 'La cantidad de páginas de navegación varía con el número de flujos; el contenido de navegación se valida con e2e y focus.',
};

await mkdir(diffDir, { recursive: true });

async function readManifest(dir) {
  try {
    return JSON.parse(await readFile(join(dir, 'capture-manifest.json'), 'utf8'));
  } catch {
    return null;
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
function isScrollNav(name) {
  return /-scroll-nav-/.test(name);
}
function comparisonKey(name, capture) {
  if (!capture?.flowId) return name;
  const prefix = name.match(/^(\d+x\d+--)/)?.[1] || '';
  const stem = name.slice(prefix.length);
  const flow = stem.match(/^flow-F\d{2}-(.+\.png)$/);
  if (flow) return `${prefix}flow-${capture.flowId}-${flow[1]}`;
  const caseCapture = stem.match(/^(case-.+?)-F\d{2}-(.+\.png)$/);
  if (caseCapture) return `${prefix}${caseCapture[1]}-${capture.flowId}-${caseCapture[2]}`;
  return name;
}
function boxUnion(boxes) {
  const present = boxes.filter(box => box && Number.isFinite(box.x) && Number.isFinite(box.y) && box.width > 0 && box.height > 0);
  if (!present.length) return null;
  const left = Math.min(...present.map(box => box.x));
  const top = Math.min(...present.map(box => box.y));
  const right = Math.max(...present.map(box => box.x + box.width));
  const bottom = Math.max(...present.map(box => box.y + box.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}
function fillMask(image, rect) {
  if (!rect) return;
  const left = Math.max(0, Math.floor(rect.x));
  const top = Math.max(0, Math.floor(rect.y));
  const right = Math.min(image.width, Math.ceil(rect.x + rect.width));
  const bottom = Math.min(image.height, Math.ceil(rect.y + rect.height));
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const index = (y * image.width + x) * 4;
      image.data[index] = 0;
      image.data[index + 1] = 0;
      image.data[index + 2] = 0;
      image.data[index + 3] = 255;
    }
  }
}

const baselineManifest = await readManifest(baselineDir);
const currentManifest = await readManifest(currentDir);
const baselineCaptures = baselineManifest?.captures || [];
const currentCaptures = currentManifest?.captures || [];
const baselineByName = new Map(baselineCaptures.map(capture => [capture.name, capture]));
const currentByName = new Map(currentCaptures.map(capture => [capture.name, capture]));
const baselineAllNames = baselineManifest ? baselineCaptures.map(capture => capture.name) : await listPngs(baselineDir);
const currentAllNames = currentManifest ? currentCaptures.map(capture => capture.name) : await listPngs(currentDir);
const baselineScrollNav = baselineAllNames.filter(isScrollNav);
const currentScrollNav = currentAllNames.filter(isScrollNav);
const excludedScrollNames = [...new Set([...baselineScrollNav, ...currentScrollNav])].sort();
const keyedCaptures = (names, byName) => names.filter(name => !isScrollNav(name)).map(name => {
  const capture = byName.get(name);
  return { name, key: comparisonKey(name, capture), capture };
});
const baselineEntries = keyedCaptures(baselineAllNames, baselineByName);
const currentEntries = keyedCaptures(currentAllNames, currentByName);
const baselineByKey = new Map(baselineEntries.map(entry => [entry.key, entry]));
const currentByKey = new Map(currentEntries.map(entry => [entry.key, entry]));
const allKeys = [...new Set([...baselineByKey.keys(), ...currentByKey.keys()])].sort();
const results = [];
const excludedByReason = {
  familyGroup: [],
  maskedPhoneScrollCount: [],
};
let maskedNavCount = 0;
let maskedPhoneCount = 0;

for (const key of allKeys) {
  const beforeEntry = baselineByKey.get(key);
  const afterEntry = currentByKey.get(key);
  const familyGroupEntry = [beforeEntry, afterEntry].find(entry => entry?.capture?.flowGroup?.startsWith('Mi Familia ·'));
  if (familyGroupEntry) {
    excludedByReason.familyGroup.push({ key, baselineName: beforeEntry?.name || null, currentName: afterEntry?.name || null, group: familyGroupEntry.capture.flowGroup });
    continue;
  }
  if (!beforeEntry || !afterEntry) {
    const onlyEntry = beforeEntry || afterEntry;
    const isPhoneScrollPage = /-scroll-phone-phone-\d+\.png$/.test(onlyEntry?.name || '');
    if (isPhoneScrollPage) {
      const baseKey = key.replace(/-scroll-phone-phone-\d+\.png$/, '.png');
      const pairedBase = baselineByKey.get(baseKey) && currentByKey.get(baseKey)
        ? [baselineByKey.get(baseKey), currentByKey.get(baseKey)]
        : [];
      if (pairedBase.length && pairedBase.some(entry => entry.capture?.maskPhone)) {
        excludedByReason.maskedPhoneScrollCount.push({ key, baselineName: beforeEntry?.name || null, currentName: afterEntry?.name || null, pairedBaseKey: baseKey });
        continue;
      }
    }
    results.push({ name: key, baselineName: beforeEntry?.name || null, currentName: afterEntry?.name || null, status: 'MISSING', percent: 100, differentPixels: null, totalPixels: null });
    continue;
  }
  const { name: baselineName, capture: before } = beforeEntry;
  const { name: currentName, capture: after } = afterEntry;
  const [baseline, current] = await Promise.all([
    readPng(join(baselineDir, baselineName)),
    readPng(join(currentDir, currentName)),
  ]);
  if (baseline.width !== current.width || baseline.height !== current.height) {
    results.push({ name: key, baselineName, currentName, status: 'SIZE', percent: 100, differentPixels: null, totalPixels: baseline.width * baseline.height, baseline: [baseline.width, baseline.height], current: [current.width, current.height] });
    continue;
  }

  const navMask = boxUnion([before?.boxes?.labA, after?.boxes?.labA]);
  const phoneRequested = Boolean(before?.maskPhone || after?.maskPhone);
  const phoneMask = phoneRequested ? boxUnion([before?.boxes?.tpPhone, after?.boxes?.tpPhone]) : null;
  if (navMask) maskedNavCount += 1;
  if (phoneMask) maskedPhoneCount += 1;
  fillMask(baseline, navMask);
  fillMask(current, navMask);
  fillMask(baseline, phoneMask);
  fillMask(current, phoneMask);

  const diff = new PNG({ width: baseline.width, height: baseline.height });
  const differentPixels = pixelmatch(baseline.data, current.data, diff.data, baseline.width, baseline.height, { threshold });
  const totalPixels = baseline.width * baseline.height;
  const percent = differentPixels * 100 / totalPixels;
  await writeFile(join(diffDir, currentName), PNG.sync.write(diff));
  results.push({ name: key, baselineName, currentName, status: percent > maxDifferentPercent ? 'FAIL' : 'PASS', percent, differentPixels, totalPixels, masks: { nav: Boolean(navMask), phone: Boolean(phoneMask) } });
}

const pass = results.filter(result => result.status === 'PASS').length;
const fail = results.filter(result => result.status === 'FAIL' || result.status === 'SIZE').length;
const missing = results.filter(result => result.status === 'MISSING').length;
const report = {
  baselineDir,
  currentDir,
  threshold,
  maxDifferentPercent,
  masks: {
    navigation: {
      rule: 'Caja de .lab-a, siempre que esté presente en el sidecar.',
      comparedCaptures: maskedNavCount,
      baselineCaptures: baselineCaptures.filter(capture => capture.boxes?.labA).length,
      currentCaptures: currentCaptures.filter(capture => capture.boxes?.labA).length,
    },
    phone: {
      rule: 'Caja de .tp-phone cuando el sidecar indica un bloque familiar visible o pantalla familia.',
      comparedCaptures: maskedPhoneCount,
      baselineCaptures: baselineCaptures.filter(capture => capture.maskPhone && capture.boxes?.tpPhone).length,
      currentCaptures: currentCaptures.filter(capture => capture.maskPhone && capture.boxes?.tpPhone).length,
      flaggedBaselineCaptures: baselineCaptures.filter(capture => capture.maskPhone).length,
      flaggedCurrentCaptures: currentCaptures.filter(capture => capture.maskPhone).length,
    },
  },
  exclusions: {
    familyGroup: {
      reason: 'Los grupos Mi Familia se validan con visual:own familia y e2e:family-layout.',
      captures: excludedByReason.familyGroup.length,
      names: excludedByReason.familyGroup,
    },
    maskedPhoneScrollCount: {
      reason: 'La paginación del móvil cambia por contenido cubierto por la máscara .tp-phone.',
      captures: excludedByReason.maskedPhoneScrollCount.length,
      names: excludedByReason.maskedPhoneScrollCount,
    },
    scrollNav: {
      pattern: SCROLL_NAV_EXCLUSION.pattern,
      reason: SCROLL_NAV_EXCLUSION.reason,
      baseline: baselineScrollNav.length,
      current: currentScrollNav.length,
      uniqueNames: excludedScrollNames.length,
    },
  },
  compared: results.length,
  pass,
  fail,
  missing,
  results,
};
await writeFile(join(diffDir, 'comparison-summary.json'), JSON.stringify(report, null, 2));
const rows = results.map(result => [
  result.name,
  result.percent === null ? '—' : result.percent.toFixed(2) + '%',
  result.differentPixels === null ? '—' : `${result.differentPixels}/${result.totalPixels}`,
  result.status,
]);
console.log(`Baseline: ${baselineDir}`);
console.log(`Actual:   ${currentDir}`);
console.log(`Umbral pixelmatch: ${threshold} · máximo: ${maxDifferentPercent.toFixed(2)}%`);
console.log(`Máscaras .lab-a: ${maskedNavCount} pares comparados · máscara .tp-phone: ${maskedPhoneCount} pares comparados (${report.masks.phone.baselineCaptures} baseline, ${report.masks.phone.currentCaptures} actual con caja visible)`);
console.log(`Exclusiones: grupos Mi Familia ${excludedByReason.familyGroup.length} · scroll-phone con móvil enmascarado ${excludedByReason.maskedPhoneScrollCount.length} · ${SCROLL_NAV_EXCLUSION.pattern} ${excludedScrollNames.length} nombres únicos (${baselineScrollNav.length} baseline, ${currentScrollNav.length} actual)`);
console.table(rows.map(([captura, diferencia, pixeles, estado]) => ({ captura, diferencia, pixeles, estado })));
console.log(`TOTAL ${results.length} · PASS ${pass} · FAIL ${fail} · FALTAN ${missing}`);
console.log(`Resumen: ${join(diffDir, 'comparison-summary.json')}`);
if (fail || missing) process.exitCode = 1;
