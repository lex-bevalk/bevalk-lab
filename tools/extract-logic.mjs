import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'handoff/reference/project/Main.dc.html');
const manifestPath = path.join(root, 'handoff/reference/assets-manifest.json');
const dataPath = path.join(root, 'src/data');
const firstLine = 6715;
const lastLine = 10611;

function findMethodBody(source, methodName) {
  const header = new RegExp(`\\n  ${methodName}\\([^\\n]*\\)\\s*\\{`, 'g');
  const match = header.exec(source);
  if (!match) throw new Error(`No se encontró el método ${methodName}`);
  const open = source.indexOf('{', match.index + match[0].indexOf(')'));
  let depth = 0;
  let quote = '';
  let lineComment = false;
  let blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i];
    const n = source[i + 1];
    if (lineComment) { if (c === '\n') lineComment = false; continue; }
    if (blockComment) { if (c === '*' && n === '/') { blockComment = false; i++; } continue; }
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = '';
      continue;
    }
    if (c === '/' && n === '/') { lineComment = true; i++; continue; }
    if (c === '/' && n === '*') { blockComment = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return { start: open + 1, end: i, name: methodName };
  }
  throw new Error(`No se pudo cerrar el método ${methodName}`);
}

function replaceMethod(source, name, replacement) {
  const body = findMethodBody(source, name);
  return source.slice(0, body.start) + replacement + source.slice(body.end);
}

function replaceExactOnce(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first === -1 || first !== source.lastIndexOf(needle)) {
    throw new Error(`La aguja exacta de ${label} no aparece una sola vez.`);
  }
  return source.slice(0, first) + replacement + source.slice(first + needle.length);
}

const html = await readFile(sourcePath, 'utf8');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const lines = html.split(/\r?\n/);
let logic = lines.slice(firstLine - 1, lastLine).join('\n').trimEnd();
// Divergencia F5: el sheet opts solo aporta datos al dropdown y no debe montar el drawer.
logic = replaceExactOnce(
  logic,
  '? {visible:true, title: s.sheet.title || "", body:"", hasList:false',
  '? {visible:false, target: optTarget, title: s.sheet.title || "", body:"", hasList:false',
  'sheet opts → dropdown Odin'
);
for (const asset of manifest) {
  if (asset.type === 'image/png') logic = logic.replaceAll(`/_blob/${asset.id}`, `/assets/${asset.suggestedName}`);
}
logic = logic.replace('class Component extends DCLogic {', 'export class LabLogic extends DCLogic {');
logic = replaceMethod(logic, 'planWorld', '\n    return purePlanWorld(w, plan);\n  ');
logic = replaceMethod(logic, 'labTrack', '\n    const patch = pureLabTrack(this.state, this.state.lab, this.labCase(), this);\n    if (patch) this.setState({lab: patch});\n  ');
logic = replaceMethod(logic, 'waitLucide', '\n  ');
logic = replaceMethod(logic, 'paint', '\n  ');

const dataFiles = ['scenarios', 'flows', 'lessons', 'alerts', 'maria', 'analyzer', 'huella', 'onboarding', 'family', 'perfil', 'score', 'lab'];
const dataModules = await Promise.all(dataFiles.map(name => readFile(path.join(dataPath, `${name}.ts`), 'utf8')));
const names = [...new Set(dataModules.flatMap(module => [...module.matchAll(/^export const ([A-Za-z_$][\w$]*)/gm)].map(match => match[1])))];
const importedData = names.filter(name => name !== 'scoreColor').join(', ');
const header = `// @ts-nocheck\n// Copied from Main.dc.html lines ${firstLine}-${lastLine}; runtime-only methods paint/waitLucide are no-ops in phase 2.2.\nimport { DCLogic } from './DCLogic';\nimport { ${importedData} } from '../data';\nimport { labTrack as pureLabTrack, planWorld as purePlanWorld, scoreColor } from './pure';\n\n`;
await writeFile(path.join(root, 'src/logic/LabLogic.ts'), `${header}${logic}\n`, 'utf8');
console.log('Generada src/logic/LabLogic.ts desde Main.dc.html.');
