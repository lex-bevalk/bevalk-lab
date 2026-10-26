import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'handoff', 'reference', 'project', 'ds', 'odin');
const target = path.join(root, 'src', 'styles', 'odin');
const copied = [];

async function walk(directory, relative = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const rel = path.join(relative, entry.name);
    const from = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(from, rel);
      continue;
    }
    const isCss = entry.isFile() && entry.name.toLowerCase().endsWith('.css');
    const isGuton = rel.replaceAll('\\', '/') === 'assets/fonts/Guton-SemiBold.woff2';
    if (!isCss && !isGuton) continue;
    const to = path.join(target, rel);
    await mkdir(path.dirname(to), { recursive: true });
    await copyFile(from, to);
    copied.push(rel.replaceAll('\\', '/'));
  }
}

await walk(source);
if (!copied.includes('styles.css') || !copied.includes('tokens/fonts.css') || !copied.includes('assets/fonts/Guton-SemiBold.woff2')) {
  throw new Error('La copia de Odin quedó incompleta.');
}
console.log(`Copiados ${copied.filter(file => file.endsWith('.css')).length} CSS y Guton-SemiBold.woff2 a src/styles/odin.`);
