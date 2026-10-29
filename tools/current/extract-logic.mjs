import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetPath, currentSourcePath, replaceDataUris } from './assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const html = await readFile(currentSourcePath(), 'utf8');
const classStart = html.indexOf('class Component extends DCLogic');
const scriptEnd = html.indexOf('</script>', classStart);
if (classStart < 0 || scriptEnd < 0) throw new Error('No se encontró completa la clase Component en el script de Current.');

function methodBody(source, name) {
  const header = new RegExp(`\\n  ${name}\\([^\\n]*\\)\\s*\\{`, 'g').exec(source);
  if (!header) throw new Error(`No se encontró el método ${name} en la clase de Current.`);
  const open = source.indexOf('{', header.index + header[0].indexOf(')'));
  let depth = 0;
  let quote = '';
  let lineComment = false;
  let blockComment = false;
  for (let i = open; i < source.length; i++) {
    const c = source[i];
    const next = source[i + 1];
    if (lineComment) { if (c === '\n') lineComment = false; continue; }
    if (blockComment) { if (c === '*' && next === '/') { blockComment = false; i++; } continue; }
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = '';
      continue;
    }
    if (c === '/' && next === '/') { lineComment = true; i++; continue; }
    if (c === '/' && next === '*') { blockComment = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return { start: open + 1, end: i };
  }
  throw new Error(`No se pudo cerrar el método ${name} en la clase de Current.`);
}

function noOpMethod(source, name) {
  const body = methodBody(source, name);
  return source.slice(0, body.start) + source.slice(body.end);
}

let logic = html.slice(classStart, scriptEnd).trimEnd();
logic = logic.replace('class Component extends DCLogic {', 'export class LabLogic extends DCLogic {');
logic = replaceDataUris(logic, uri => assetPath(uri));
logic = noOpMethod(logic, 'waitLucide');
logic = noOpMethod(logic, 'paint');

const dataStart = html.indexOf('data-dc-script');
const dataTagEnd = html.indexOf('>', dataStart);
const dataNames = [...html.slice(dataTagEnd + 1, classStart).matchAll(/^const\s+([A-Za-z_$][\w$]*)\s*=/gm)]
  .map(match => match[1]);
if (!dataNames.length) throw new Error('No se encontraron los datos que consume la clase de Current.');
const classLine = html.slice(0, classStart).split(/\r?\n/).length + 1;
const endLine = html.slice(0, scriptEnd).split(/\r?\n/).length;
const header = `// @ts-nocheck\n// Copied from design/current/current.html lines ${classLine}-${endLine}; paint() and waitLucide() are no-ops because G3 renders icons in React.\nimport { DCLogic } from './DCLogic';\nimport { ${dataNames.join(', ')} } from '../data';\n\n`;

const outputDir = path.join(root, 'src/current/logic');
await mkdir(outputDir, { recursive: true });
await copyFile(path.join(root, 'src/logic/DCLogic.ts'), path.join(outputDir, 'DCLogic.ts'));
await writeFile(path.join(outputDir, 'LabLogic.ts'), `${header}${logic}\n`, 'utf8');
console.log(`Current: clase LabLogic generada (${dataNames.length} imports de datos); DCLogic copiada sin cambios.`);
