import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pathConfig = JSON.parse(await readFile(new URL('./proto-paths.json', import.meta.url), 'utf8'));

export function matchesPath(pattern, filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replaceAll('**', '\u0000').replaceAll('*', '[^/]*').replaceAll('\u0000', '.*');
  return new RegExp(`^${escaped}$`).test(normalized);
}

export function foreignPaths(proto, files, config = pathConfig) {
  if (!Object.hasOwn(config, proto)) throw new Error(`Unknown prototype: ${proto}`);
  const other = proto === 'current' ? 'concept' : 'current';
  const patterns = config[other];
  return [...new Set(files.map(file => file.trim().replaceAll('\\', '/')).filter(Boolean))]
    .filter(file => patterns.some(pattern => matchesPath(pattern, file)))
    .sort();
}

function gitFiles(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(' ')} exited ${result.status}`);
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

async function stdinFiles() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  return input.split(/\r?\n/).filter(Boolean);
}

async function main() {
  const [proto, ...args] = process.argv.slice(2);
  if (!proto || !Object.hasOwn(pathConfig, proto)) throw new Error('Usage: npm run guard:proto -- <concept|current> [--base <ref>]');
  const baseIndex = args.indexOf('--base');
  const base = baseIndex >= 0 ? args[baseIndex + 1] : 'origin/main';
  if (baseIndex >= 0 && !base) throw new Error('Missing ref after --base');
  const pipedFiles = process.stdin.isTTY ? [] : await stdinFiles();
  const files = pipedFiles.length
    ? pipedFiles
    : [
      ...gitFiles(['diff', '--name-only', `${base}...HEAD`]),
      ...gitFiles(['diff', '--name-only']),
      ...gitFiles(['diff', '--cached', '--name-only']),
      ...gitFiles(['ls-files', '--others', '--exclude-standard'])
    ];
  const foreign = foreignPaths(proto, files);
  if (foreign.length) {
    console.error(`Prototype guard failed for ${proto}; paths owned by ${proto === 'current' ? 'concept' : 'current'}:`);
    for (const file of foreign) console.error(`- ${file}`);
    process.exitCode = 1;
    return;
  }
  console.log(`OK: ${proto} guard · ${new Set(files).size} changed paths`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 2;
  });
}
