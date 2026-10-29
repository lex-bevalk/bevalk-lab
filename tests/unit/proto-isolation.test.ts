import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { matchesPath } from '../../tools/check-proto-guard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const protoPaths = JSON.parse(readFileSync(path.join(root, 'tools/proto-paths.json'), 'utf8')) as Record<string, string[]>;
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts']);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    return sourceExtensions.has(path.extname(entry.name)) ? [absolute] : [];
  });
}

function relativePath(absolute: string): string {
  return path.relative(root, absolute).replaceAll('\\', '/');
}

function resolvedImport(from: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  const result = ts.resolveModuleName(specifier, from, {
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true,
    jsx: ts.JsxEmit.ReactJSX
  }, ts.sys).resolvedModule;
  return result ? relativePath(result.resolvedFileName) : null;
}

describe('prototype source isolation', () => {
  it('keeps relative imports between current and concept source paths isolated', () => {
    const files = sourceFiles(path.join(root, 'src'));
    const currentFiles = files.filter(file => protoPaths.current.some(pattern => matchesPath(pattern, relativePath(file))));
    const conceptFiles = files.filter(file => protoPaths.concept.some(pattern => matchesPath(pattern, relativePath(file))));
    const violations: string[] = [];

    for (const [fromFiles, forbidden] of [[currentFiles, protoPaths.concept], [conceptFiles, protoPaths.current]] as const) {
      for (const file of fromFiles) {
        const source = readFileSync(file, 'utf8');
        const imports = ts.preProcessFile(source, true, true).importedFiles;
        for (const imported of imports) {
          const resolved = resolvedImport(file, imported.fileName);
          if (resolved && forbidden.some(pattern => matchesPath(pattern, resolved))) {
            violations.push(`${relativePath(file)} -> ${resolved}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
