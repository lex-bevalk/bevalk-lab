import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as generatedData from '../../src/current/data';
import { assetPath, replaceDataUris } from '../../tools/current/assets.mjs';

const html = readFileSync(new URL('../../design/current/current.html', import.meta.url), 'utf8');
const scriptMarker = html.indexOf('data-dc-script');
const scriptEnd = html.indexOf('>', scriptMarker);
const classStart = html.indexOf('class Component extends DCLogic', scriptEnd);
if (scriptMarker < 0 || scriptEnd < 0 || classStart < 0) throw new Error('No se pudo separar el bloque de datos del export Current.');

const sourceData = replaceDataUris(html.slice(scriptEnd + 1, classStart), uri => assetPath(uri));
const sourceFile = ts.createSourceFile('current-data.js', sourceData, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const names = sourceFile.statements
  .filter(statement => ts.isVariableStatement(statement) && (statement.declarationList.flags & ts.NodeFlags.Const) !== 0)
  .flatMap(statement => statement.declarationList.declarations.map(declaration => {
    if (!ts.isIdentifier(declaration.name)) throw new Error('Se encontró un dato Current con nombre destructurado.');
    return declaration.name.text;
  }));
if (sourceFile.parseDiagnostics.length) throw new Error(`No se pudo analizar el bloque de datos Current: ${sourceFile.parseDiagnostics[0].messageText}`);
const referenceContext: Record<string, unknown> = {};
runInNewContext(`${sourceData}\nglobalThis.__currentData = { ${names.join(', ')} };`, referenceContext);
const referenceData = referenceContext.__currentData as Record<string, unknown>;
const generatedSource = readFileSync(new URL('../../src/current/data.ts', import.meta.url), 'utf8')
  .replace(/^export const /gm, 'const ');
const generatedContext: Record<string, unknown> = {};
runInNewContext(`${generatedSource}\nglobalThis.__currentData = { ${names.join(', ')} };`, generatedContext);
const generatedValues = generatedContext.__currentData as Record<string, unknown>;

function normalize(value: unknown): unknown {
  if (typeof value === 'function') return { $function: value.toString() };
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, normalize((value as Record<string, unknown>)[key])]));
  }
  return value;
}

describe('datos extraídos del prototipo Current', () => {
  it('conserva las declaraciones de datos y sus funciones frente al bloque original', () => {
    expect(Object.keys(generatedData).sort()).toEqual([...names].sort());
    for (const name of names) {
      expect(normalize(generatedValues[name]), name).toEqual(normalize(referenceData[name]));
    }
  });

  it('incluye los 63 flujos y 20 grupos', () => {
    expect(generatedData.LAB_ALL_FLOWS).toHaveLength(63);
    expect(generatedData.LAB_ALL_GROUPS).toHaveLength(20);
  });
});
