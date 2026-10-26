import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const referencePath = path.join(root, 'handoff/reference/project/Main.dc.html');
const manifestPath = path.join(root, 'handoff/reference/assets-manifest.json');

export function evaluateReferenceData() {
  const html = readFileSync(referencePath, 'utf8');
  const source = html.split(/\r?\n/).slice(4682, 6714).join('\n');
  const names = [...source.matchAll(/^const\s+([A-Za-z_$][\w$]*)\s*=/gm)].map(match => match[1]);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Array<{ id: string; type: string; suggestedName: string }>;
  let transformed = source;
  for (const asset of manifest) {
    if (asset.type === 'image/png') transformed = transformed.replaceAll(`/_blob/${asset.id}`, `/assets/${asset.suggestedName}`);
  }
  const context = vm.createContext({});
  vm.runInContext(`${transformed}\nglobalThis.__data = { ${names.join(', ')} };`, context);
  return { data: (context as any).__data as Record<string, unknown>, names };
}

export function evaluateGeneratedData(names: string[]) {
  const dataDirectory = path.join(root, 'src/data');
  const declarations = new Map<string, string>();
  for (const file of readdirSync(dataDirectory).filter(name => name.endsWith('.ts') && name !== 'index.ts' && name !== 'types.ts')) {
    const module = readFileSync(path.join(dataDirectory, file), 'utf8');
    const starts = [...module.matchAll(/^export const ([A-Za-z_$][\w$]*)/gm)];
    starts.forEach((match, index) => {
      const end = starts[index + 1]?.index ?? module.length;
      const name = match[1];
      let declaration = module.slice(match.index, end).trim();
      declaration = declaration.replace(new RegExp(`^export const ${name}(?:\\s*:[^=]+)? =`), `const ${name} =`);
      declarations.set(name, declaration);
    });
  }
  const missing = names.filter(name => !declarations.has(name));
  if (missing.length) throw new Error(`No se encontraron declaraciones generadas: ${missing.join(', ')}`);
  const context = vm.createContext({});
  vm.runInContext(`${names.map(name => declarations.get(name)).join('\n\n')}\nglobalThis.__data = { ${names.join(', ')} };`, context);
  return (context as any).__data as Record<string, unknown>;
}

export function createReferenceLogic(environment: Record<string, unknown>, props: Record<string, unknown>) {
  const html = readFileSync(referencePath, 'utf8');
  const lines = html.split(/\r?\n/);
  const data = lines.slice(4682, 6714).join('\n');
  const logic = lines.slice(6714, 10611).join('\n');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Array<{ id: string; type: string; suggestedName: string }>;
  let transformed = data;
  for (const asset of manifest) {
    if (asset.type === 'image/png') transformed = transformed.replaceAll(`/_blob/${asset.id}`, `/assets/${asset.suggestedName}`);
  }
  const context = vm.createContext({ ...environment, console });
  const base = `
    class DCLogic {
      constructor(props) { this.props = props || {}; this.state = {}; this.__host = null; }
      setState(update, callback) { this.__host && this.__host.__setLogicState(update, callback); }
      forceUpdate(callback) { this.__host && this.__host.forceUpdate(callback); }
      componentDidMount() {}
      componentDidUpdate(prevProps) {}
      componentWillUnmount() {}
      renderVals() { return {}; }
    }
  `;
  vm.runInContext(`${base}\n${transformed}\n${logic}\nglobalThis.__LabReference = Component;`, context);
  return new (context as any).__LabReference(props);
}

export function normalize(value: any, seen = new WeakMap<object, any>()): any {
  if (typeof value === 'function') return { __function__: value.toString() };
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  if (Array.isArray(value)) {
    const result: any[] = [];
    seen.set(value, result);
    for (const item of value) result.push(normalize(item, seen));
    return result;
  }
  const result: Record<string, unknown> = {};
  seen.set(value, result);
  for (const key of Object.keys(value)) result[key] = normalize(value[key], seen);
  return result;
}

export function normalizeRuntime(value: any, seen = new WeakMap<object, any>()): any {
  if (typeof value === 'function') return { __function__: true };
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  if (Array.isArray(value)) {
    const result: any[] = [];
    seen.set(value, result);
    for (const item of value) result.push(normalizeRuntime(item, seen));
    return result;
  }
  const result: Record<string, unknown> = {};
  seen.set(value, result);
  for (const key of Object.keys(value)) result[key] = normalizeRuntime(value[key], seen);
  return result;
}

export function assertEquivalent(actual: unknown, expected: unknown, name: string) {
  try {
    assert.deepStrictEqual(normalize(actual), normalize(expected));
  } catch (error) {
    if (error instanceof Error) error.message = `${name}: ${error.message}`;
    throw error;
  }
}
